import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../chat/auth';
import { logger } from '../../../../chat/logger';

// Using the same stub storage as parent routes
// In production, this would use a database
const templates = new Map<string, any>();

export async function PUT(
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

    const { shared } = await request.json();
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
        { error: 'Not authorized to share this template' },
        { status: 403 }
      );
    }

    // Update sharing status (stub implementation)
    template.shared = shared;
    template.updatedAt = new Date().toISOString();
    templates.set(params.templateId, template);

    logger.info('Template sharing updated', {
      templateId: params.templateId,
      userId: authResult.userId,
      shared,
    });

    return NextResponse.json({
      message: shared ? 'Template shared with team' : 'Template unshared',
      template,
    });
  } catch (error) {
    logger.error('Failed to update template sharing', { 
      error,
      templateId: params.templateId,
    });
    return NextResponse.json(
      { error: 'Failed to update sharing' },
      { status: 500 }
    );
  }
}