import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../chat/auth';
import { getBulkOperationHistory } from '@/features/ai-shopping-assistant/security/bulk-operation-history';
import { getAuditLogger, AuditEventType } from '@/features/ai-shopping-assistant/security/audit-logger';
import { getSdk } from '@/sdk';
import { logger } from '../../../chat/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { operationId: string } }
) {
  const auditLogger = getAuditLogger();
  
  try {
    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.isAuthenticated || !authResult.isB2B) {
      return NextResponse.json(
        { error: 'B2B authentication required' },
        { status: 401 }
      );
    }

    const { reason } = await request.json();
    
    if (!reason?.trim()) {
      return NextResponse.json(
        { error: 'Rollback reason is required' },
        { status: 400 }
      );
    }

    // Get operation history
    const operationHistory = getBulkOperationHistory();
    
    // Check rollback eligibility
    const eligibility = await operationHistory.checkRollbackEligibility(params.operationId);
    
    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          error: eligibility.reason,
          deadline: eligibility.deadline,
        },
        { status: 403 }
      );
    }

    // Get SDK for rollback operations
    const sdk = getSdk();

    // Perform rollback
    const result = await operationHistory.rollbackOperation(
      params.operationId,
      authResult.userId!,
      reason,
      sdk as any // Type casting for compatibility
    );

    // Log the rollback
    await auditLogger.logEvent(AuditEventType.BULK_OPERATION_ROLLBACK, {
      userId: authResult.userId,
      accountId: authResult.accountId,
      action: 'bulk_operation.rollback',
      result: result.success ? 'success' : 'partial',
      resource: params.operationId,
      details: {
        reason,
        reversedItems: result.reversedItems,
        errors: result.errors,
      },
    });

    return NextResponse.json({
      success: result.success,
      reversedItems: result.reversedItems,
      errors: result.errors,
      message: `Successfully rolled back ${result.reversedItems} items`,
    });
  } catch (error) {
    logger.error('Rollback operation failed', { 
      error,
      operationId: params.operationId,
    });
    
    await auditLogger.logEvent(AuditEventType.BULK_OPERATION_ROLLBACK, {
      userId: 'unknown',
      action: 'bulk_operation.rollback',
      result: 'failure',
      resource: params.operationId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Rollback operation failed' },
      { status: 500 }
    );
  }
}