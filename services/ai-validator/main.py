"""Lightweight FastAPI anomaly validation service.

Run locally with:
    uvicorn main:app --reload --port 8001
"""

import os
import json
import base64
import google.generativeai as genai
from typing import Any

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest

app = FastAPI(title="Survey AI Validator", version="1.0.0")

class ImagePayload(BaseModel):
    image_base64: str
    mime_type: str
    fileName: str


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
        if row["age"] < 16 and row["employment_status"] == "employed":
            reasons.append("Rule 1: Underage employment detected.")
        if row["age"] < 60 and row["employment_status"] == "retired":
            reasons.append("Rule 2: Early retirement age anomaly.")
        if row["age"] < 0 or row["age"] > 100:
            reasons.append("Rule 3: Invalid age bounds (0-100).")
        if row["income"] < 0:
            reasons.append("Rule 4: Negative income reported.")
        if row["employment_status"] in ["unemployed", "student"] and row["income"] > 20000:
            reasons.append("Rule 5: High income reported for non-working status.")
        if row["employment_status"] == "employed" and row["income"] == 0:
            reasons.append("Rule 6: Zero income for employed status.")
        if row["age"] < 14 and row["education"] in ["Degree", "Master", "PhD"]:
            reasons.append("Rule 7: Higher education conflicts with young age.")
        if not row["region"] or not row["education"] or not row["employment_status"]:
            reasons.append("Rule 8: Missing essential survey fields.")
        if row["income"] > income_mean + (3 * income_std):
            reasons.append("Rule 9: Income exceeds 3 standard deviations from mean.")
            
        # Innovative ML/Stats Rules
        # Rule A: Benford's Law Check (First Digit)
        if row["income"] >= 10:
            first_digit = int(str(int(row["income"]))[0])
            if first_digit in [8, 9]:
                reasons.append("Benford's Law: High-end rare leading digit detected. Possible fabrication.")
                
        # Rule B: Age Heaping (Terminal Digit Preference)
        if row["age"] >= 20 and (row["age"] % 10 == 0 or row["age"] % 10 == 5):
            reasons.append("Age Heaping: Vague rounded age detected (ends in 0 or 5).")

        if row["model_flag"]:
            reasons.append("Rule 10: Isolation Forest detected multi-variate anomaly.")

        payload = records[index].model_dump()
        payload.pop("extra", None)
        payload["is_anomaly"] = bool(reasons)
        payload["anomaly_reason"] = " ".join(reasons) if reasons else ""
        output.append(payload)

    return output


@app.post("/validate")
def validate(records: list[SurveyRecord]) -> list[dict[str, Any]]:
    return validate_records(records)

@app.post("/validate-image")
def validate_image(payload: ImagePayload) -> dict[str, Any]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("No GEMINI_API_KEY found, using mock OCR data.")
        records = [
            SurveyRecord(
                record_id="IMG-001",
                enumerator_id="ENUM-102",
                region="South",
                age=12,
                income=85000,
                education="PhD",
                employment_status="employed"
            ),
            SurveyRecord(
                record_id="IMG-002",
                enumerator_id="ENUM-102",
                region="South",
                age=45,
                income=45000,
                education="Degree",
                employment_status="employed"
            )
        ]
    else:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = '''
Extract the survey data from this image into a JSON array of objects. 
The expected fields are: record_id, enumerator_id, region, age (number), income (number), education, and employment_status.
Only output the raw JSON array without markdown formatting.
        '''
        try:
            image_data = base64.b64decode(payload.image_base64)
            response = model.generate_content([
                prompt,
                {"mime_type": payload.mime_type, "data": image_data}
            ])
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
            data = json.loads(text)
            if isinstance(data, dict):
                data = [data]
            records = [SurveyRecord(**item) for item in data]
        except Exception as e:
            print(f"OCR Error: {e}")
            records = []
            
    validated = validate_records(records)
    
    return {
        "fileName": payload.fileName,
        "recordsProcessed": len(records),
        "records": validated
    }