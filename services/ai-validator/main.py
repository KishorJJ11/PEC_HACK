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

    income_mean = frame["income"].mean()
    income_std = frame["income"].std() or 1
    output: list[dict[str, Any]] = []

    for index, row in frame.iterrows():
        reasons: list[str] = []
        
        # VR-20: Benford's Law (Fabrication Check)
        if row["income"] >= 10:
            first_digit = int(str(int(row["income"]))[0])
            if first_digit in [8, 9]:
                reasons.append("[VR-20] Benford's Law: Rare leading digit detected.")
                
        # VR-19: Age Heaping (Terminal Digit)
        if row["age"] >= 20 and (row["age"] % 10 == 0 or row["age"] % 10 == 5):
            reasons.append("[VR-19] Age Heaping: Rounded age detected.")

        # VR-17: Cluster Outlier (Z-Score)
        if row["income"] > income_mean + (3 * income_std):
            reasons.append("[VR-17] Cluster Outlier: Income exceeds 3 standard deviations.")

        # VR-09: Education vs. Occupation Clash
        if row["education"] in ["PhD", "Master"] and row["employment_status"] == "unemployed":
            reasons.append("[VR-09] Education Clash: High education but unemployed.")

        # VR-03: Income vs. Hours Worked Matrix (Proxy)
        if row["employment_status"] == "unemployed" and row["income"] > 10000:
            reasons.append("[VR-03] Income Matrix: High income for unemployed status.")

        # VR-01: Age Mismatch / Underage
        if row["age"] < 16 and row["employment_status"] == "employed":
            reasons.append("[VR-01] Age Mismatch: Underage employment detected.")

        # VR-18: Straight-Lining / Round Number Fabrication
        if row["income"] > 0 and row["income"] % 10000 == 0:
            reasons.append("[VR-18] Fabrication: Suspiciously perfect round number for income.")
            
        # VR-08: Demographic Logical Clash (Senior)
        if row["age"] > 80 and row["employment_status"] == "employed":
            reasons.append("[VR-08] Demographic Clash: Extreme senior age for active employment.")
            
        # VR-06: Industry vs Occupation Clash (Extreme Poverty)
        if row["employment_status"] == "employed" and row["income"] < 1000:
            reasons.append("[VR-06] Industry Clash: Employed but reporting near-zero income.")

        payload = records[index].model_dump()
        payload.pop("extra", None)
        payload["is_anomaly"] = bool(reasons)
        payload["anomaly_reason"] = " | ".join(reasons) if reasons else ""
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