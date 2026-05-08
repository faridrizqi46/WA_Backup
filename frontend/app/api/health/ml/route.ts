import { NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/health`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'ok',
        message: 'ML service is running',
        loadedModels: data.loaded_models || [],
      });
    } else {
      return NextResponse.json(
        { status: 'error', message: `ML service error: ${response.status}` },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: `Cannot connect to ML service at ${ML_API_URL}. Is python ml/predict.py running?` },
      { status: 500 }
    );
  }
}