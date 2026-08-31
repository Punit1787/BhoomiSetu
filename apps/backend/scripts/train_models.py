"""Train BhoomiSetu's two procedural timeline models on reproducible synthetic history."""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "app" / "ml_models"
DATA_DIR = ROOT / "scripts" / "data"
CATEGORICAL = ["project_type", "state", "district", "current_stage"]
NUMERIC = [
    "parcel_count",
    "objection_count",
    "document_turnaround_days",
    "officer_open_load",
    "days_in_compensation",
]


def generate_history(rows: int = 1800, seed: int = 26016) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    stages = np.array(
        ["notification", "verification", "objection", "award", "compensation", "possession"]
    )
    frame = pd.DataFrame(
        {
            "project_type": rng.choice(["highway", "rail", "irrigation", "urban_transit"], rows),
            "state": rng.choice(["Maharashtra", "Gujarat", "Karnataka", "Madhya Pradesh"], rows),
            "district": rng.choice(
                ["Pune", "Nashik", "Nagpur", "Satara", "Ahmedabad", "Indore"], rows
            ),
            "current_stage": rng.choice(stages, rows),
            "parcel_count": rng.integers(1, 7, rows),
            "objection_count": rng.poisson(1.5, rows),
            "document_turnaround_days": rng.integers(2, 46, rows),
            "officer_open_load": rng.integers(4, 52, rows),
            "days_in_compensation": rng.integers(0, 121, rows),
        }
    )
    stage_index = (
        frame["current_stage"].map({stage: i for i, stage in enumerate(stages)}).to_numpy()
    )
    noise = rng.normal(0, 14, rows)
    frame["delay_days_remaining"] = np.maximum(
        7,
        230
        - stage_index * 37
        + frame.objection_count * 19
        + frame.document_turnaround_days * 1.4
        + frame.officer_open_load * 0.7
        + noise,
    ).round()
    frame["compensation_days"] = np.maximum(
        5,
        34
        + frame.objection_count * 10
        + frame.document_turnaround_days * 0.8
        + frame.officer_open_load * 0.45
        + frame.days_in_compensation * 0.35
        + noise * 0.45,
    ).round()
    return frame


def train(frame: pd.DataFrame, target: str) -> dict:
    preprocess = ColumnTransformer(
        [
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL,
            ),
            ("numeric", "passthrough", NUMERIC),
        ]
    )
    pipeline = Pipeline(
        [
            ("preprocess", preprocess),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=180,
                    max_depth=12,
                    min_samples_leaf=3,
                    random_state=26016,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    pipeline.fit(frame[CATEGORICAL + NUMERIC], frame[target])
    feature_names = list(pipeline.named_steps["preprocess"].get_feature_names_out())
    return {"pipeline": pipeline, "feature_names": feature_names, "version": "phase3-rf-v1"}


if __name__ == "__main__":
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    history = generate_history()
    history.to_csv(DATA_DIR / "synthetic_case_history.csv", index=False)
    joblib.dump(train(history, "delay_days_remaining"), MODEL_DIR / "delay_model.joblib")
    joblib.dump(
        train(history, "compensation_days"), MODEL_DIR / "compensation_timeline_model.joblib"
    )
    print(f"trained 2 models on {len(history)} reproducible synthetic cases")
