import { NextRequest, NextResponse } from 'next/server';
import { getSdk } from '@/sdk';
import { ConfigurationManager } from '@/features/ai-shopping-assistant/config';
import { Loggers } from '@/features/ai-shopping-assistant/observability';
import { ChatOpenAI } from '@langchain/openai';

const logger = Loggers.api;

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  dependencies: {
    openai: boolean;
    middleware: boolean;
    configuration: boolean;
    [key: string]: boolean;
  };
  details?: {
    [key: string]: any;
  };
}

/**
 * Health check endpoint for the AI Shopping Assistant
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    dependencies: {
      openai: false,
      middleware: false,
      configuration: false,
    },
    details: {},
  };

  try {
    // Check OpenAI connectivity
    try {
      const model = new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        temperature: 0,
        maxTokens: 10,
      });
      
      // Quick test to verify API key works
      await model.invoke('test', { 
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      result.dependencies.openai = true;
    } catch (error) {
      logger.warn('OpenAI health check failed', { error });
      result.dependencies.openai = false;
      result.details!.openaiError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check middleware connectivity
    try {
      const sdk = getSdk();
      // Try a simple SDK call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // This should work even with mocks
      await sdk.unified.getCart();
      clearTimeout(timeoutId);
      
      result.dependencies.middleware = true;
    } catch (error) {
      logger.warn('Middleware health check failed', { error });
      result.dependencies.middleware = false;
      result.details!.middlewareError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check configuration system
    try {
      const configManager = ConfigurationManager.getInstance();
      const config = await configManager.getConfig();
      
      result.dependencies.configuration = config.actions.length > 0;
      result.details!.actionCount = config.actions.length;
    } catch (error) {
      logger.warn('Configuration health check failed', { error });
      result.dependencies.configuration = false;
      result.details!.configError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Determine overall health
    const criticalDependencies = ['openai', 'configuration'];
    const allHealthy = criticalDependencies.every(dep => result.dependencies[dep]);
    
    if (!allHealthy) {
      result.status = 'unhealthy';
    }

    // Add performance metrics
    result.details!.responseTimeMs = Date.now() - startTime;
    result.details!.memoryUsageMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    // Log health check
    logger.info('Health check completed', {
      status: result.status,
      dependencies: result.dependencies,
      responseTime: result.details!.responseTimeMs,
    });

    // Return appropriate status code
    const statusCode = result.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(result, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': result.status,
      }
    });

  } catch (error) {
    logger.error('Health check failed with unexpected error', { error });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      dependencies: {
        openai: false,
        middleware: false,
        configuration: false,
      },
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs: Date.now() - startTime,
      },
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
      }
    });
  }
}

/**
 * Liveness probe - simple check that the service is running
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-Service': 'ai-shopping-assistant',
      'X-Status': 'alive',
    }
  });
}