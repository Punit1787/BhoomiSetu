from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from app.schemas.intelligence import FeatureContribution, PredictionResponse

MODEL_DIR = Path(__file__).resolve().parents[1] / "ml_models"


@lru_cache(maxsize=2)
def load_bundle(name: str) -> dict[str, Any]:
    return joblib.load(MODEL_DIR / name)


def predict(name: str, features: dict[str, Any]) -> PredictionResponse:
    bundle = load_bundle(name)
    pipeline = bundle["pipeline"]
    days = max(1, round(float(pipeline.predict(pd.DataFrame([features]))[0])))
    reference = bundle["reference_values"]
    effects = []
    for feature, reference_value in reference.items():
        counterfactual = {**features, feature: reference_value}
        comparison = float(pipeline.predict(pd.DataFrame([counterfactual]))[0])
        effects.append((feature, abs(float(days) - comparison)))
    ranked = sorted(effects, key=lambda item: item[1], reverse=True)[:3]
    total_effect = sum(value for _, value in ranked) or 1.0
    top = [
        FeatureContribution(
            feature=feature,
            importance=round(float(value) / total_effect, 4),
        )
        for feature, value in ranked
    ]
    risk = "high" if days >= 150 else "medium" if days >= 75 else "low"
    return PredictionResponse(
        predicted_days_remaining=days,
        risk_band=risk,
        top_features=top,
        model_version=bundle["version"],
        holdout_mae_days=bundle["metrics"]["mae_days"],
    )
