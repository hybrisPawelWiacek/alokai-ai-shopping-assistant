import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../chat/auth';
import { logger } from '../../../chat/logger';

// Using the same stub storage as parent route
// In production, this would use a database
const templates = new Map<string, any>();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.isAuthenticated || !authResult.isB2B) {
      return NextResponse.json(
        { error: 'B2B authentication required' },
        { status: 401 }
      );
    }

    const template = templates.get(params.templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (template.createdBy !== authResult.userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this template' },
        { status: 403 }
      );
    }

    // Delete template (stub implementation)
    templates.delete(params.templateId);

    logger.info('Template deleted', {
      templateId: params.templateId,
      userId: authResult.userId,
    });

    return NextResponse.json({
      message: 'Template deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete template', { 
      error,
      templateId: params.templateId,
    });
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}