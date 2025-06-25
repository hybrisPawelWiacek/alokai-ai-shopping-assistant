import { getAuditLogger, AuditEventType } from './audit-logger';
import { FileScanResult, FileThreat } from './file-scanner';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

/**
 * Virus scan provider types
 */
export enum VirusScanProvider {
  CLAMAV = 'CLAMAV',
  VIRUSTOTAL = 'VIRUSTOTAL',
  WINDOWS_DEFENDER = 'WINDOWS_DEFENDER',
  HYBRID = 'HYBRID'
}

/**
 * Virus scan result
 */
export interface VirusScanResult {
  clean: boolean;
  infected: boolean;
  provider: VirusScanProvider;
  threats: VirusThreat[];
  scanDuration: number;
  engineVersion?: string;
  definitionsDate?: string;
}

/**
 * Virus threat details
 */
export interface VirusThreat {
  name: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'quarantined' | 'cleaned' | 'blocked';
  details?: string;
}

/**
 * Virus scanner configuration
 */
export interface VirusScannerConfig {
  provider?: VirusScanProvider;
  clamavPath?: string;
  virusTotalApiKey?: string;
  tempDir?: string;
  maxFileSizeMB?: number;
  timeout?: number;
  quarantineDir?: string;
  enableCloudFallback?: boolean;
}

/**
 * Advanced virus scanner with multiple provider support
 */
export class VirusScanner {
  private readonly config: Required<VirusScannerConfig>;
  private readonly auditLogger = getAuditLogger();
  private clamavAvailable: boolean = false;

  constructor(config: VirusScannerConfig = {}) {
    this.config = {
      provider: config.provider || VirusScanProvider.HYBRID,
      clamavPath: config.clamavPath || '/usr/local/bin/clamscan',
      virusTotalApiKey: config.virusTotalApiKey || process.env.VIRUSTOTAL_API_KEY || '',
      tempDir: config.tempDir || './temp/virus-scan',
      maxFileSizeMB: config.maxFileSizeMB || 25,
      timeout: config.timeout || 30000,
      quarantineDir: config.quarantineDir || './quarantine',
      enableCloudFallback: config.enableCloudFallback ?? true
    };

    this.initialize();
  }

  /**
   * Scan a file for viruses
   */
  async scanFile(
    file: File | Buffer,
    filename: string,
    userId?: string
  ): Promise<VirusScanResult> {
    const startTime = Date.now();
    
    // Check file size
    const size = file instanceof File ? file.size : file.length;
    if (size > this.config.maxFileSizeMB * 1024 * 1024) {
      return {
        clean: false,
        infected: false,
        provider: this.config.provider,
        threats: [{
          name: 'FILE_TOO_LARGE',
          type: 'size_limit',
          severity: 'low',
          action: 'blocked',
          details: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds limit`
        }],
        scanDuration: Date.now() - startTime
      };
    }

    // Save file temporarily
    const tempPath = await this.saveTempFile(file, filename);

    try {
      let result: VirusScanResult;

      switch (this.config.provider) {
        case VirusScanProvider.CLAMAV:
          result = await this.scanWithClamAV(tempPath, filename);
          break;
        
        case VirusScanProvider.VIRUSTOTAL:
          result = await this.scanWithVirusTotal(tempPath, filename);
          break;
        
        case VirusScanProvider.WINDOWS_DEFENDER:
          result = await this.scanWithWindowsDefender(tempPath, filename);
          break;
        
        case VirusScanProvider.HYBRID:
        default:
          result = await this.scanWithHybrid(tempPath, filename);
          break;
      }

      // Log scan result
      if (!result.clean) {
        await this.auditLogger.logSecurityEvent(
          AuditEventType.MALICIOUS_PAYLOAD_DETECTED,
          {
            userId,
            action: 'virus_scan',
            threatDetails: {
              filename,
              provider: result.provider,
              threats: result.threats,
              fileHash: await this.calculateFileHash(tempPath)
            },
            blocked: true
          }
        );

        // Quarantine infected file
        if (result.infected) {
          await this.quarantineFile(tempPath, filename, result);
        }
      }

      result.scanDuration = Date.now() - startTime;
      return result;
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Scan with ClamAV
   */
  private async scanWithClamAV(filePath: string, filename: string): Promise<VirusScanResult> {
    if (!this.clamavAvailable) {
      throw new Error('ClamAV is not available');
    }

    try {
      const { stdout, stderr } = await execAsync(
        `${this.config.clamavPath} --no-summary --infected "${filePath}"`,
        { timeout: this.config.timeout }
      );

      // Parse ClamAV output
      const infected = stdout.includes('FOUND');
      const threats: VirusThreat[] = [];

      if (infected) {
        const lines = stdout.split('\n').filter(line => line.includes('FOUND'));
        for (const line of lines) {
          const match = line.match(/(.+?):\s*(.+?)\s+FOUND/);
          if (match) {
            threats.push({
              name: match[2].trim(),
              type: 'virus',
              severity: this.getVirusSeverity(match[2]),
              action: 'blocked'
            });
          }
        }
      }

      // Get engine info
      const versionInfo = await this.getClamAVVersion();

      return {
        clean: !infected,
        infected,
        provider: VirusScanProvider.CLAMAV,
        threats,
        scanDuration: 0,
        ...versionInfo
      };
    } catch (error) {
      console.error('ClamAV scan failed:', error);
      throw error;
    }
  }

  /**
   * Scan with VirusTotal API
   */
  private async scanWithVirusTotal(filePath: string, filename: string): Promise<VirusScanResult> {
    if (!this.config.virusTotalApiKey) {
      throw new Error('VirusTotal API key not configured');
    }

    try {
      // Calculate file hash
      const fileHash = await this.calculateFileHash(filePath);
      
      // Check if file already scanned (by hash)
      const hashCheckUrl = `https://www.virustotal.com/api/v3/files/${fileHash}`;
      const hashCheckResponse = await fetch(hashCheckUrl, {
        headers: {
          'x-apikey': this.config.virusTotalApiKey
        }
      });

      let scanResult: any;

      if (hashCheckResponse.ok) {
        // File already scanned
        scanResult = await hashCheckResponse.json();
      } else {
        // Upload and scan file
        const fileBuffer = await fs.readFile(filePath);
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), filename);

        const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
          method: 'POST',
          headers: {
            'x-apikey': this.config.virusTotalApiKey
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error(`VirusTotal upload failed: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        const analysisId = uploadResult.data.id;

        // Wait for analysis (simplified - in production would poll)
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Get analysis result
        const analysisResponse = await fetch(
          `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
          {
            headers: {
              'x-apikey': this.config.virusTotalApiKey
            }
          }
        );

        scanResult = await analysisResponse.json();
      }

      // Parse results
      const stats = scanResult.data.attributes.stats || scanResult.data.attributes.last_analysis_stats;
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      
      const threats: VirusThreat[] = [];
      if (malicious > 0 || suspicious > 0) {
        threats.push({
          name: `Detected by ${malicious + suspicious} engines`,
          type: 'malware',
          severity: malicious > 0 ? 'critical' : 'high',
          action: 'blocked',
          details: `Malicious: ${malicious}, Suspicious: ${suspicious}`
        });
      }

      return {
        clean: malicious === 0 && suspicious === 0,
        infected: malicious > 0,
        provider: VirusScanProvider.VIRUSTOTAL,
        threats,
        scanDuration: 0,
        engineVersion: 'VirusTotal API v3'
      };
    } catch (error) {
      console.error('VirusTotal scan failed:', error);
      throw error;
    }
  }

  /**
   * Scan with Windows Defender
   */
  private async scanWithWindowsDefender(filePath: string, filename: string): Promise<VirusScanResult> {
    if (process.platform !== 'win32') {
      throw new Error('Windows Defender is only available on Windows');
    }

    try {
      const { stdout, stderr } = await execAsync(
        `"C:\\Program Files\\Windows Defender\\MpCmdRun.exe" -Scan -ScanType 3 -File "${filePath}"`,
        { timeout: this.config.timeout }
      );

      // Parse Windows Defender output
      const infected = stdout.includes('found') && stdout.includes('threat');
      const threats: VirusThreat[] = [];

      if (infected) {
        threats.push({
          name: 'Windows Defender Detection',
          type: 'malware',
          severity: 'high',
          action: 'blocked'
        });
      }

      return {
        clean: !infected,
        infected,
        provider: VirusScanProvider.WINDOWS_DEFENDER,
        threats,
        scanDuration: 0,
        engineVersion: 'Windows Defender'
      };
    } catch (error) {
      console.error('Windows Defender scan failed:', error);
      throw error;
    }
  }

  /**
   * Hybrid scan using multiple providers
   */
  private async scanWithHybrid(filePath: string, filename: string): Promise<VirusScanResult> {
    const results: VirusScanResult[] = [];
    const threats: VirusThreat[] = [];

    // Try ClamAV first (fastest)
    if (this.clamavAvailable) {
      try {
        const clamResult = await this.scanWithClamAV(filePath, filename);
        results.push(clamResult);
        threats.push(...clamResult.threats);
        
        // If infected, no need to check other scanners
        if (clamResult.infected) {
          return {
            ...clamResult,
            provider: VirusScanProvider.HYBRID
          };
        }
      } catch (error) {
        console.warn('ClamAV scan failed in hybrid mode:', error);
      }
    }

    // If suspicious or cloud fallback enabled, check VirusTotal
    if (this.config.enableCloudFallback && this.config.virusTotalApiKey) {
      try {
        const vtResult = await this.scanWithVirusTotal(filePath, filename);
        results.push(vtResult);
        threats.push(...vtResult.threats);
      } catch (error) {
        console.warn('VirusTotal scan failed in hybrid mode:', error);
      }
    }

    // Aggregate results
    const infected = results.some(r => r.infected);
    const clean = results.length > 0 && results.every(r => r.clean);

    return {
      clean,
      infected,
      provider: VirusScanProvider.HYBRID,
      threats,
      scanDuration: 0,
      engineVersion: `Hybrid (${results.map(r => r.provider).join(', ')})`
    };
  }

  /**
   * Initialize scanner
   */
  private async initialize(): Promise<void> {
    // Create directories
    await fs.mkdir(this.config.tempDir, { recursive: true });
    await fs.mkdir(this.config.quarantineDir, { recursive: true });

    // Check ClamAV availability
    if (this.config.provider === VirusScanProvider.CLAMAV || 
        this.config.provider === VirusScanProvider.HYBRID) {
      try {
        await execAsync(`${this.config.clamavPath} --version`);
        this.clamavAvailable = true;
        console.log('ClamAV is available');
      } catch (error) {
        this.clamavAvailable = false;
        console.warn('ClamAV is not available:', error);
      }
    }
  }

  /**
   * Save file temporarily
   */
  private async saveTempFile(file: File | Buffer, filename: string): Promise<string> {
    const tempName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${filename}`;
    const tempPath = path.join(this.config.tempDir, tempName);
    
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    await fs.writeFile(tempPath, buffer);
    
    return tempPath;
  }

  /**
   * Calculate file hash
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Get ClamAV version info
   */
  private async getClamAVVersion(): Promise<{ engineVersion?: string; definitionsDate?: string }> {
    try {
      const { stdout } = await execAsync(`${this.config.clamavPath} --version`);
      const versionMatch = stdout.match(/ClamAV ([0-9.]+)/);
      const dateMatch = stdout.match(/(\d{1,2}-\w{3}-\d{4})/);
      
      return {
        engineVersion: versionMatch ? versionMatch[1] : undefined,
        definitionsDate: dateMatch ? dateMatch[1] : undefined
      };
    } catch {
      return {};
    }
  }

  /**
   * Determine virus severity
   */
  private getVirusSeverity(virusName: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerName = virusName.toLowerCase();
    
    if (lowerName.includes('trojan') || lowerName.includes('ransom')) {
      return 'critical';
    } else if (lowerName.includes('worm') || lowerName.includes('backdoor')) {
      return 'high';
    } else if (lowerName.includes('adware') || lowerName.includes('pup')) {
      return 'medium';
    }
    
    return 'high'; // Default to high for unknown threats
  }

  /**
   * Quarantine infected file
   */
  private async quarantineFile(
    filePath: string,
    originalName: string,
    scanResult: VirusScanResult
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = await this.calculateFileHash(filePath);
    const quarantineName = `${timestamp}_${hash}_${originalName}`;
    const quarantinePath = path.join(this.config.quarantineDir, quarantineName);
    
    // Move file to quarantine
    await fs.rename(filePath, quarantinePath);
    
    // Save scan result metadata
    const metadataPath = `${quarantinePath}.json`;
    await fs.writeFile(metadataPath, JSON.stringify({
      originalName,
      quarantineDate: new Date().toISOString(),
      scanResult,
      hash
    }, null, 2));
  }
}

// Singleton instance
let virusScanner: VirusScanner | null = null;

/**
 * Get or create virus scanner instance
 */
export function getVirusScanner(config?: VirusScannerConfig): VirusScanner {
  if (!virusScanner) {
    virusScanner = new VirusScanner(config);
  }
  return virusScanner;
}