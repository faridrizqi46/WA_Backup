import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { status: 'error', message: 'OPENAI_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        status: 'ok',
        message: 'OpenAI API key is valid',
      });
    } else {
      const error = await response.text();
      return NextResponse.json(
        { status: 'error', message: `OpenAI API error: ${response.status}`, details: error },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to OpenAI API' },
      { status: 500 }
    );
  }
}