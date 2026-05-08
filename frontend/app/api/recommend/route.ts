import { NextRequest, NextResponse } from 'next/server';
import { ProductRecommendationService } from '@/services/ProductRecommendationService';
import { vectorDBService } from '@/services/VectorDBService';
import { llmService } from '@/services/LLMService';

const productRecService = new ProductRecommendationService(
  vectorDBService,
  llmService
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, parameters } = body;

    if (!company) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const recommendation = await productRecService.getRecommendationsForCompany(
      company,
      parameters || ['LC', 'SCF']
    );

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('[API /recommend] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}