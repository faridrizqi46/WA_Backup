from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import xgboost as xgb
from pathlib import Path
import os

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


models: Dict[str, xgb.XGBClassifier] = {}
thresholds: Dict[str, float] = {"LC": 0.5, "SCF": 0.5}

FEATURE_NAMES = {
    "LC": ['internationalTradeActivity', 'transactionValue', 'paymentRiskExposure',
           'counterpartyTrustLevel', 'documentationComplexity'],
    "SCF": ['anchorCertainty', 'tradeRelationship', 'importExportActivity',
            'supplyChainRole', 'workingCapitalPattern']
}


def load_models():
    global models, thresholds
    for param, filename in MODEL_PARAMS.items():
        model_path = MODEL_DIR / filename
        if model_path.exists():
            models[param] = xgb.XGBClassifier()
            models[param].load_model(model_path)
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
        avg_score = sum(input_data.features.values()) / len(input_data.features) if input_data.features else 50
        return PredictionOutput(
            recommended=avg_score >= 50,
            confidenceScore=avg_score / 100.0,
            productParameter=input_data.parameter,
            featureScores=input_data.features
        )

    model = models[input_data.parameter]
    threshold = thresholds[input_data.parameter]

    feature_names = FEATURE_NAMES.get(input_data.parameter, [])
    feature_vector = [[input_data.features.get(fn, 0) for fn in feature_names]]

    proba = model.predict_proba(feature_vector)[0]
    confidence = float(proba[1])

    return PredictionOutput(
        recommended=confidence >= threshold,
        confidenceScore=round(confidence, 4),
        productParameter=input_data.parameter,
        featureScores=input_data.features
    )


@app.get("/health")
async def health():
    return {"status": "ok", "loaded_models": list(models.keys())}


@app.post("/retrain")
async def retrain():
    return {"status": "retraining_triggered"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)