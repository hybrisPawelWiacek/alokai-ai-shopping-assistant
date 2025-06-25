import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../chat/auth';
import { getBulkOperationHistory } from '@/features/ai-shopping-assistant/security/bulk-operation-history';
import { logger } from '../../chat/logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.isAuthenticated || !authResult.isB2B) {
      return NextResponse.json(
        { error: 'B2B authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = searchParams.get('limit');

    // Get operation history
    const operationHistory = getBulkOperationHistory();
    const operations = await operationHistory.listUserOperations(
      authResult.userId!,
      {
        status: status || undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        limit: limit ? parseInt(limit) : 50,
      }
    );

    return NextResponse.json({
      operations,
      total: operations.length,
    });
  } catch (error) {
    logger.error('Failed to fetch bulk operation history', { error });
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}