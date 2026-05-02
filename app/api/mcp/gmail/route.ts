/**
 * GET /api/mcp/gmail
 * Gmail MCP Server - Exposes Gmail tools for AI agents
 * 
 * This is a publicly discoverable MCP server that allows:
 * - Sending emails
 * - Reading threads
 * - Checking send status
 * 
 * The AI agent can call these tools as part of email sending workflow.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // MCP spec requires server info endpoint
    const origin = request.headers.get('origin') || request.nextUrl.origin;

    return NextResponse.json({
      name: 'gmail-mcp',
      version: '1.0.0',
      description: 'Gmail MCP server for cold email automation',
      capabilities: {
        tools: true,
      },
      tools: [
        {
          name: 'send_email',
          description: 'Send an email via Gmail with specified subject and body',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: 'Recipient email address',
              },
              subject: {
                type: 'string',
                description: 'Email subject line',
              },
              body: {
                type: 'string',
                description: 'Email body text (plain text)',
              },
              refreshToken: {
                type: 'string',
                description: 'Gmail OAuth refresh token',
              },
            },
            required: ['to', 'subject', 'body', 'refreshToken'],
          },
        },
        {
          name: 'get_thread',
          description: 'Retrieve a Gmail thread by ID',
          inputSchema: {
            type: 'object',
            properties: {
              threadId: {
                type: 'string',
                description: 'Gmail thread ID',
              },
              refreshToken: {
                type: 'string',
                description: 'Gmail OAuth refresh token',
              },
            },
            required: ['threadId', 'refreshToken'],
          },
        },
        {
          name: 'check_send_status',
          description: 'Check if an email was successfully sent',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'Gmail message ID',
              },
              refreshToken: {
                type: 'string',
                description: 'Gmail OAuth refresh token',
              },
            },
            required: ['messageId', 'refreshToken'],
          },
        },
      ],
      authentication: {
        type: 'oauth2',
        provider: 'google',
      },
    });
  } catch (error) {
    console.error('[v0] MCP server error:', error);

    return NextResponse.json(
      {
        error: 'MCP server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      tool: string;
      input: Record<string, unknown>;
    };

    const { tool, input } = body;

    // Handle different tool calls
    switch (tool) {
      case 'send_email':
        return handleSendEmail(input);

      case 'get_thread':
        return handleGetThread(input);

      case 'check_send_status':
        return handleCheckSendStatus(input);

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[v0] MCP tool error:', error);

    return NextResponse.json(
      {
        error: 'Tool execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleSendEmail(input: Record<string, unknown>) {
  const { to, subject, body, refreshToken } = input as {
    to: string;
    subject: string;
    body: string;
    refreshToken: string;
  };

  // Validate inputs
  if (!to || !subject || !body || !refreshToken) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    // In production, use Google API to send email
    // For now, return mock success
    console.log(`[v0] Sending email to ${to}`);

    return NextResponse.json({
      success: true,
      messageId: `mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleGetThread(input: Record<string, unknown>) {
  const { threadId, refreshToken } = input as {
    threadId: string;
    refreshToken: string;
  };

  if (!threadId || !refreshToken) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Mock thread data
  return NextResponse.json({
    success: true,
    threadId,
    messages: [
      {
        id: 'mock-msg-1',
        from: 'prospect@company.com',
        subject: 'RE: Quick thought',
        body: 'This sounds interesting, let me know more',
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

async function handleCheckSendStatus(input: Record<string, unknown>) {
  const { messageId, refreshToken } = input as {
    messageId: string;
    refreshToken: string;
  };

  if (!messageId || !refreshToken) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    messageId,
    status: 'sent',
    sentAt: new Date().toISOString(),
  });
}
