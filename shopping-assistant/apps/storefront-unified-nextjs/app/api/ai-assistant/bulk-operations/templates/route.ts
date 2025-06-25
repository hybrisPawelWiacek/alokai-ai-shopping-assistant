import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../chat/auth';
import { logger } from '../../chat/logger';

// Stub implementation for template storage
// In production, this would use a database
const templates = new Map<string, any>();

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

    // Get user's templates (stub implementation)
    const userTemplates = Array.from(templates.values()).filter(
      template => 
        template.createdBy === authResult.userId ||
        (template.shared && template.accountId === authResult.accountId)
    );

    return NextResponse.json({
      templates: userTemplates,
      total: userTemplates.length,
    });
  } catch (error) {
    logger.error('Failed to fetch templates', { error });
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.isAuthenticated || !authResult.isB2B) {
      return NextResponse.json(
        { error: 'B2B authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, items, tags } = body;

    if (!name || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Name and items are required' },
        { status: 400 }
      );
    }

    // Create template (stub implementation)
    const template = {
      id: `template_${Date.now()}`,
      name,
      description,
      items,
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: authResult.userId,
      accountId: authResult.accountId,
      shared: false,
      totalItems: items.length,
      estimatedValue: items.reduce((sum: number, item: any) => 
        sum + (item.quantity * (item.price || 0)), 0
      ),
    };

    templates.set(template.id, template);

    logger.info('Template created', {
      templateId: template.id,
      userId: authResult.userId,
      itemCount: items.length,
    });

    return NextResponse.json({
      template,
      message: 'Template created successfully',
    });
  } catch (error) {
    logger.error('Failed to create template', { error });
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}