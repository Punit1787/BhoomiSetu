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
    importances = pipeline.named_steps["model"].feature_importances_
    ranked = sorted(
        zip(bundle["feature_names"], importances, strict=True),
        key=lambda item: item[1],
        reverse=True,
    )[:3]
    top = [
        FeatureContribution(
            feature=name.replace("categorical__", "").replace("numeric__", ""),
            importance=round(float(value), 4),
        )
        for name, value in ranked
    ]
    risk = "high" if days >= 150 else "medium" if days >= 75 else "low"
    return PredictionResponse(
        predicted_days_remaining=days,
        risk_band=risk,
        top_features=top,
        model_version=bundle["version"],
    )
