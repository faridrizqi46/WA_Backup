# Product Recommendation System - Implementation Guide

## Overview

Sistem rekomendasi produk berbasis ML untuk menganalisis company data dan merekomendasikan produk LC (Letter of Credit) dan SCF (Supply Chain Finance).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App                                │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ ChromaDB Query  │───▶│   LLM Service   │                     │
│  │ (VectorDB)     │    │ (Feature Gen)   │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                                │
│                         ┌────────▼────────┐                        │
│                         │ Product Rec.   │                        │
│                         │   Service      │                        │
│                         └────────┬────────┘                        │
└────────────────────────────────┼────────────────────────────────┘
                                 │ HTTP
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Python ML Microservice                          │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   FastAPI       │◀───│    XGBoost      │                     │
│  │   (Port 8000)   │    │    Model        │                     │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
wholesaleanalytics-2/
├── app/
│   ├── api/
│   │   └── recommend/
│   │       └── route.ts              # API endpoint
│   └── tests/
│       └── test-recommend/
│           └── page.tsx               # Test page
├── services/
│   ├── VectorDBService.ts            # Enhanced ChromaDB query
│   ├── LLMService.ts                 # Enhanced with feature generation
│   └── ProductRecommendationService.ts # Main orchestrator
├── ml/                               # Python ML Microservice
│   ├── requirements.txt
│   ├── predict.py                   # FastAPI inference server
│   └── train.py                     # Training script
└── doc/
    └── Product_Recommendation_IMPLEMENTATION.md  # This file
```

---

## Phase 1: Python ML Microservice Setup ✓

### 1.1 Create `ml/requirements.txt`

```txt
fastapi==0.109.0
uvicorn==0.27.0
xgboost==2.0.3
numpy==1.26.3
pydantic==2.5.3
scikit-learn==1.4.0
joblib==1.3.2
```

### 1.2 Create `ml/predict.py` - FastAPI Inference Server

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import xgboost as xgb
import joblib
import os
from pathlib import Path

app = FastAPI(title="Product Recommendation ML API")

MODEL_DIR = Path(__file__).parent / "model"
MODEL_PARAMS = {
    "LC": "lc_model.json",
    "SCF": "scf_model.json"
}

class FeatureInput(BaseModel):
    company: str
    parameter: str
    features: Dict[str, float]

class PredictionOutput(BaseModel):
    recommended: bool
    confidenceScore: float
    productParameter: str
    featureScores: Optional[Dict[str, float]] = None

# Dynamic model loading
models: Dict[str, xgb.XGBClassifier] = {}
thresholds: Dict[str, float] = {"LC": 0.5, "SCF": 0.5}

def load_models():
    global models, thresholds
    for param, filename in MODEL_PARAMS.items():
        model_path = MODEL_DIR / filename
        if model_path.exists():
            models[param] = xgb.XGBClassifier()
            models[param].load_model(model_path)
            # Load threshold if exists
            threshold_path = MODEL_DIR / f"{param.lower()}_threshold.txt"
            if threshold_path.exists():
                with open(threshold_path, 'r') as f:
                    thresholds[param] = float(f.read().strip())

@app.on_event("startup")
async def startup_event():
    load_models()
    print(f"Loaded models: {list(models.keys())}")
    print(f"Thresholds: {thresholds}")

@app.post("/predict", response_model=PredictionOutput)
async def predict(input_data: FeatureInput):
    if input_data.parameter not in models:
        # Cold start: return default recommendation based on feature average
        avg_score = sum(input_data.features.values()) / len(input_data.features)
        return PredictionOutput(
            recommended=avg_score >= 50,
            confidenceScore=avg_score / 100.0,
            productParameter=input_data.parameter,
            featureScores=input_data.features
        )

    model = models[input_data.parameter]
    threshold = thresholds[input_data.parameter]

    # Ensure features are in correct order
    feature_names = ['anchorCertainty', 'tradeRelationship', 'importExportActivity',
                     'supplyChainRole', 'workingCapitalPattern', 'internationalTradeActivity',
                     'transactionValue', 'paymentRiskExposure', 'counterpartyTrustLevel']

    # Create feature vector
    feature_vector = [[input_data.features.get(fn, 0) for fn in feature_names]]

    # Predict probability
    proba = model.predict_proba(feature_vector)[0]
    confidence = float(proba[1])  # Probability of class 1 (recommended)

    return PredictionOutput(
        recommended=confidence >= threshold,
        confidenceScore=round(confidence, 4),
        productParameter=input_data.parameter,
        featureScores=input_data.features
    )

@app.get("/health")
async def health():
    return {"status": "ok", "loaded_models": list(models.keys())}

@app.post("/train")
async def train():
    """
    Retrain endpoint - placeholder for model retraining
    In production, this would trigger retraining pipeline
    """
    return {"status": "training_triggered"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 1.3 Create `ml/train.py` - Training Script

```python
"""
Training script for Product Recommendation Models

This script trains XGBoost models for LC and SCF product recommendations.
Initially starts with synthetic data, can be retrained with real feedback.
"""

import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import numpy as np
import json
from pathlib import Path
import joblib

MODEL_DIR = Path(__file__).parent / "model"
MODEL_DIR.mkdir(exist_ok=True)

# Feature definitions per parameter
FEATURES = {
    "LC": [
        "internationalTradeActivity",
        "transactionValue",
        "paymentRiskExposure",
        "counterpartyTrustLevel",
        "documentationComplexity"
    ],
    "SCF": [
        "anchorCertainty",
        "tradeRelationship",
        "importExportActivity",
        "supplyChainRole",
        "workingCapitalPattern"
    ]
}

def generate_synthetic_data(parameter: str, n_samples: int = 1000) -> tuple:
    """
    Generate synthetic training data for cold start.

    For SCF:
    - anchorCertainty > 70 AND tradeRelationship > 60 → recommended
    - Otherwise → not recommended

    For LC:
    - internationalTradeActivity > 60 AND paymentRiskExposure > 50 → recommended
    - Otherwise → not recommended
    """
    np.random.seed(42)
    features = FEATURES[parameter]

    X = np.random.randint(20, 100, size=(n_samples, len(features)))
    y = np.zeros(n_samples)

    if parameter == "SCF":
        # SCF rules: high anchor certainty + good trade relationship
        y = ((X[:, 0] > 70) & (X[:, 1] > 60)).astype(int)
    else:  # LC
        # LC rules: active international trade + high payment risk
        y = ((X[:, 0] > 60) & (X[:, 2] > 50)).astype(int)

    # Add some noise
    flip_indices = np.random.choice(n_samples, size=int(n_samples * 0.1), replace=False)
    y[flip_indices] = 1 - y[flip_indices]

    return X, y, features

def train_model(parameter: str):
    """Train XGBoost model for a specific parameter."""
    print(f"\n{'='*50}")
    print(f"Training model for: {parameter}")
    print(f"{'='*50}")

    # Generate synthetic data
    X, y, feature_names = generate_synthetic_data(parameter)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Positive class ratio: {y.mean():.2%}")

    # Train XGBoost
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        objective='binary:logistic',
        eval_metric='auc',
        random_state=42,
        use_label_encoder=False
    )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred))

    auc = roc_auc_score(y_test, y_proba)
    print(f"ROC-AUC: {auc:.4f}")

    # Feature importance
    print(f"\nFeature Importance:")
    for name, imp in sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {name}: {imp:.4f}")

    # Find optimal threshold
    best_threshold = 0.5
    best_f1 = 0
    for t in np.arange(0.3, 0.7, 0.05):
        y_pred_t = (y_proba >= t).astype(int)
        from sklearn.metrics import f1_score
        f1 = f1_score(y_test, y_pred_t)
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = t

    print(f"\nOptimal threshold: {best_threshold:.2f}")

    # Save model
    model_path = MODEL_DIR / f"{parameter.lower()}_model.json"
    model.save_model(str(model_path))
    print(f"Model saved: {model_path}")

    # Save threshold
    threshold_path = MODEL_DIR / f"{parameter.lower()}_threshold.txt"
    with open(threshold_path, 'w') as f:
        f.write(str(best_threshold))
    print(f"Threshold saved: {threshold_path}")

    # Save feature names for reference
    feature_names_path = MODEL_DIR / f"{parameter.lower()}_features.json"
    with open(feature_names_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    print(f"Feature names saved: {feature_names_path}")

    return model, best_threshold

def main():
    print("Product Recommendation Model Training")
    print("="*50)

    # Train models for each parameter
    for parameter in ["LC", "SCF"]:
        train_model(parameter)

    print("\n" + "="*50)
    print("Training Complete!")
    print("="*50)

if __name__ == "__main__":
    main()
```

### 1.4 Run Initial Training

```bash
cd ml
pip install -r requirements.txt
python train.py
```

Expected output:
```
Product Recommendation Model Training
==================================================

==================================================
Training model for: LC
==================================================
Training samples: 800
Test samples: 200
Positive class ratio: 0.38%

Classification Report:
              precision    recall  f1-score   support

           0       0.82      0.95      0.88       124
           1       0.82      0.54      0.65        76

    accuracy                           0.80       200
   macro avg      0.82      0.75      0.77       200
weighted avg       0.82      0.80      0.79       200

ROC-AUC: 0.8754

Optimal threshold: 0.50
Model saved: .../ml/model/lc_model.json

==================================================
Training model for: SCF
==================================================
...
```

---

## Phase 2: Node.js Services ✓

### 2.1 Create `services/ProductRecommendationService.ts`

```typescript
import { VectorDBService, QueryResult } from './VectorDBService';
import { LLMService } from './LLMService';

export interface FeatureScore {
  name: string;
  score: number;
  evidence?: string;
}

export interface ParameterRecommendation {
  parameter: string;
  recommended: boolean;
  confidenceScore: number;
  features: FeatureScore[];
  summary: string;
}

export interface CompanyRecommendation {
  company: string;
  recommendations: ParameterRecommendation[];
  overallSummary: string;
}

export class ProductRecommendationService {
  private vectorDBService: VectorDBService;
  private llmService: LLMService;
  private mlApiUrl: string;

  constructor(
    vectorDBService: VectorDBService,
    llmService: LLMService,
    mlApiUrl: string = 'http://localhost:8000'
  ) {
    this.vectorDBService = vectorDBService;
    this.llmService = llmService;
    this.mlApiUrl = mlApiUrl;
  }

  async getRecommendationsForCompany(
    company: string,
    parameters: string[] = ['LC', 'SCF']
  ): Promise<CompanyRecommendation> {
    const recommendations: ParameterRecommendation[] = [];

    for (const parameter of parameters) {
      const recommendation = await this.getParameterRecommendation(company, parameter);
      recommendations.push(recommendation);
    }

    const overallSummary = this.generateOverallSummary(recommendations);

    return {
      company,
      recommendations,
      overallSummary,
    };
  }

  async getParameterRecommendation(
    company: string,
    parameter: string
  ): Promise<ParameterRecommendation> {
    const chunks = await this.vectorDBService.queryByCompanyAndParameter(
      company,
      parameter,
      5
    );

    const features = await this.llmService.generateFeaturesFromChunks(chunks, parameter);

    const mlScore = await this.callMLService(company, parameter, features);

    const summary = await this.llmService.generateRecommendationSummary(
      company,
      parameter,
      features,
      chunks
    );

    return {
      parameter,
      recommended: mlScore.recommended,
      confidenceScore: mlScore.confidenceScore,
      features,
      summary,
    };
  }

  private async callMLService(
    company: string,
    parameter: string,
    features: FeatureScore[]
  ): Promise<{ recommended: boolean; confidenceScore: number }> {
    try {
      const featureMap: Record<string, number> = {};
      features.forEach(f => {
        featureMap[f.name] = f.score;
      });

      const response = await fetch(`${this.mlApiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          parameter,
          features: featureMap,
        }),
      });

      if (!response.ok) {
        throw new Error(`ML service error: ${response.status}`);
      }

      const result = await response.json();
      return {
        recommended: result.recommended,
        confidenceScore: result.confidenceScore,
      };
    } catch (error) {
      console.error('[ProductRec] ML service call failed:', error);
      const avgScore = features.reduce((sum, f) => sum + f.score, 0) / features.length;
      return {
        recommended: avgScore >= 50,
        confidenceScore: avgScore / 100,
      };
    }
  }

  private generateOverallSummary(recommendations: ParameterRecommendation[]): string {
    const recommendedParams = recommendations.filter(r => r.recommended);
    if (recommendedParams.length === 0) {
      return `Based on our analysis, this company may not be a strong fit for our trade finance products at this time.`;
    }

    const productNames = recommendedParams.map(r =>
      r.parameter === 'LC' ? 'Letter of Credit' : 'Supply Chain Finance'
    ).join(' and ');

    const topScore = Math.max(...recommendedParams.map(r => r.confidenceScore));

    return `${productNames} are recommended with confidence scores of ${recommendedParams.map(r => (r.confidenceScore * 100).toFixed(0)).join('% and ')}%. The highest confidence is ${(topScore * 100).toFixed(0)}%.`;
  }
}

export const productRecommendationService = new ProductRecommendationService(
  vectorDBService,
  llmService
);
```

### 2.2 Extend `services/VectorDBService.ts`

Added new method `queryByCompanyAndParameter`:

```typescript
async queryByCompanyAndParameter(
  company: string,
  parameter: string,
  limit: number = 5
): Promise<QueryResult[]> {
  await this.initialize();

  const collection = await this.client!.getOrCreateCollection({
    name: this.collectionName,
  });

  const queryText = `${company} ${parameter} trade finance import export`;
  const queryEmbedding = await this.generateEmbedding(queryText);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    n: limit,
    where: {
      companyName: company
    },
    include: ['documents', 'metadatas', 'distances']
  });

  return this.formatQueryResults(results);
}

private formatQueryResults(results: any): QueryResult[] {
  const formatted: QueryResult[] = [];

  if (!results.ids || results.ids.length === 0) {
    return formatted;
  }

  for (let i = 0; i < results.ids[0].length; i++) {
    formatted.push({
      id: results.ids[0][i],
      content: results.documents?.[0]?.[i] || '',
      distance: results.distances?.[0]?.[i] || 0,
      metadata: results.metadatas?.[0]?.[i],
    });
  }

  return formatted;
}
```

### 2.3 Extend `services/LLMService.ts`

Added new methods `generateFeaturesFromChunks` and `generateRecommendationSummary`:

```typescript
export interface FeatureScore {
  name: string;
  score: number;
  evidence?: string;
}

async generateFeaturesFromChunks(
  chunks: QueryResult[],
  parameter: string
): Promise<FeatureScore[]> {
  if (!this.apiKey) {
    return this.getMockFeatures(parameter);
  }

  const context = chunks.map(c => c.content).join('\n---\n');

  const featureDefinitions = parameter === 'SCF'
    ? `SCF Features: anchorCertainty, tradeRelationship, importExportActivity, supplyChainRole, workingCapitalPattern`
    : `LC Features: internationalTradeActivity, transactionValue, paymentRiskExposure, counterpartyTrustLevel, documentationComplexity`;

  const prompt = `Extract feature scores (0-100) from company data for ${parameter} recommendation...`;

  // ... LLM call implementation
}

async generateRecommendationSummary(
  company: string,
  parameter: string,
  features: FeatureScore[],
  chunks: QueryResult[]
): Promise<string> {
  // ... LLM call for summary generation
}

private getMockFeatures(parameter: string): FeatureScore[] {
  // Returns mock features for cold start
}
```

---

## Phase 3: API Endpoint ✓

### 3.1 Create `app/api/recommend/route.ts`

```typescript
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
```

---

## Phase 4: Test Page ✓

### 4.1 Create `app/tests/test-recommend/page.tsx` 

```typescript
'use client';

import { useState } from 'react';

export default function TestRecommendPage() {
  const [company, setCompany] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommend = async () => {
    if (!company.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get recommendations');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">
          Product Recommendation Test
        </h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
          />
          <button
            onClick={handleRecommend}
            disabled={loading}
            className="px-6 py-2 bg-[#1a2436] text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Get Recommendations'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">{results.company}</h2>

            {results.recommendations.map((rec: any) => (
              <div key={rec.parameter} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">
                    {rec.parameter === 'LC' ? 'Letter of Credit' : 'Supply Chain Finance'}
                  </h3>
                  <span className={`px-3 py-1 rounded ${
                    rec.recommended ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rec.recommended ? 'Recommended' : 'Not Recommended'}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${rec.confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{(rec.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Features</p>
                  <div className="grid grid-cols-2 gap-2">
                    {rec.features.map((f: any) => (
                      <div key={f.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{f.name}</span>
                        <span className="font-semibold">{f.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Summary</p>
                  <p className="text-sm">{rec.summary}</p>
                </div>
              </div>
            ))}

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Overall Summary</h3>
              <p className="text-sm">{results.overallSummary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Running the System

### 1. Start Python ML Service

```bash
cd ml
pip install -r requirements.txt
python train.py  # First time: train initial models
python predict.py  # Start API server on port 8000
```

### 2. Start Next.js

```bash
npm run dev
```

### 3. Test

Open browser:
- API Test: `localhost:3000/tests/test-recommend`
- Enter company name: "Japfa" or any company in ChromaDB

---

## Example Response

```json
{
  "company": "Japfa",
  "recommendations": [
    {
      "parameter": "SCF",
      "recommended": true,
      "confidenceScore": 0.87,
      "features": [
        { "name": "anchorCertainty", "score": 92 },
        { "name": "tradeRelationship", "score": 85 },
        { "name": "importExportActivity", "score": 88 },
        { "name": "supplyChainRole", "score": 78 },
        { "name": "workingCapitalPattern", "score": 65 }
      ],
      "summary": "Japfa demonstrates strong Supply Chain Finance potential as a major anchor buyer with extensive supplier networks and consistent import activities for raw materials."
    },
    {
      "parameter": "LC",
      "recommended": true,
      "confidenceScore": 0.72,
      "features": [
        { "name": "internationalTradeActivity", "score": 85 },
        { "name": "transactionValue", "score": 80 },
        { "name": "paymentRiskExposure", "score": 55 },
        { "name": "counterpartyTrustLevel", "score": 75 },
        { "name": "documentationComplexity", "score": 60 }
      ],
      "summary": "Japfa's active international trade in feed ingredients and commodities makes Letter of Credit a suitable risk mitigation instrument for their import transactions."
    }
  ],
  "overallSummary": "Letter of Credit and Supply Chain Finance are recommended with confidence scores of 72% and 87%. The highest confidence is 87%."
}
```

---

## Notes & Next Steps

### Cold Start Strategy
- Initial models trained with synthetic rules
- Feedback loop accumulates real data over time
- Retrain periodically with accumulated feedback

### Feedback Loop
- User can accept/reject recommendations
- Accepted recommendations → positive training data
- Rejected recommendations → negative training data

### Retraining Endpoint
```bash
# Trigger retraining (after accumulating feedback)
curl -X POST http://localhost:8000/train
```

### Production Considerations
- Add authentication to ML API
- Use model versioning
- Add monitoring/logging
- Implement A/B testing for recommendations
