"""Lightweight FastAPI anomaly validation service.

Run locally with:
    uvicorn main:app --reload --port 8001
"""

from typing import Any

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest

app = FastAPI(title="Survey AI Validator", version="1.0.0")


class SurveyRecord(BaseModel):
    record_id: str | None = None
    enumerator_id: str | None = None
    region: str | None = None
    age: float | None = None
    income: float | None = None
    education: str | None = None
    employment_status: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


def validate_records(records: list[SurveyRecord]) -> list[dict[str, Any]]:
    if not records:
        return []

    frame = pd.DataFrame([record.model_dump() for record in records])
    frame["age"] = pd.to_numeric(frame["age"], errors="coerce").fillna(0)
    frame["income"] = pd.to_numeric(frame["income"], errors="coerce").fillna(0)
    frame["income_log"] = (frame["income"].clip(lower=0) + 1).map(__import__("math").log)

    if len(frame) >= 4:
        detector = IsolationForest(
            contamination="auto",
            random_state=42,
            n_estimators=100,
        )
        frame["model_flag"] = detector.fit_predict(frame[["age", "income_log"]]) == -1
    else:
        frame["model_flag"] = False

    income_mean = frame["income"].mean()
    income_std = frame["income"].std() or 1
    output: list[dict[str, Any]] = []

    for index, row in frame.iterrows():
        reasons: list[str] = []
        if row["age"] < 18 and row["income"] > 0:
            reasons.append(
                f"Contextual anomaly: age {int(row['age'])} but income is {row['income']:,.0f}."
            )
        if row["income"] > income_mean + (2.5 * income_std):
            reasons.append("Distribution anomaly: income is well above the sample mean.")
        if row["model_flag"]:
            reasons.append("Pattern anomaly: the age/income combination is isolated from peers.")

        payload = records[index].model_dump()
        payload.pop("extra", None)
        payload["is_anomaly"] = bool(reasons)
        payload["anomaly_reason"] = " ".join(reasons) if reasons else ""
        output.append(payload)

    return output


@app.post("/validate")
def validate(records: list[SurveyRecord]) -> list[dict[str, Any]]:
    return validate_records(records)