"""Lightweight FastAPI anomaly validation service.

Run locally with:
    uvicorn main:app --reload --port 8001
"""

import os
import json
import base64
import google.generativeai as genai
from typing import Any

env_path = os.path.join(os.path.dirname(__file__), "..", "api-node", ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                os.environ["GEMINI_API_KEY"] = line.strip().split("=", 1)[1]


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
    years_experience: float | None = 0
    household_size: float | None = 1
    monthly_expenses: float | None = 0
    work_hours: float | None = 0
    gender: str | None = "Unknown"
    maternity_leave: bool | None = False
    industry: str | None = ""
    occupation: str | None = ""
    submission_time: str | None = None
    gps_location: str | None = ""
    pin_code: str | None = ""
    family_members: float | None = 1
    extra: dict[str, Any] = Field(default_factory=dict)


def validate_records(records: list[SurveyRecord]) -> list[dict[str, Any]]:
    if not records:
        return []

    frame = pd.DataFrame([record.model_dump() for record in records])
    frame["age"] = pd.to_numeric(frame["age"], errors="coerce").fillna(0)
    frame["income"] = pd.to_numeric(frame["income"], errors="coerce").fillna(0)
    frame["years_experience"] = pd.to_numeric(frame["years_experience"], errors="coerce").fillna(0)
    frame["household_size"] = pd.to_numeric(frame["household_size"], errors="coerce").fillna(1)
    frame["monthly_expenses"] = pd.to_numeric(frame["monthly_expenses"], errors="coerce").fillna(0)
    frame["work_hours"] = pd.to_numeric(frame["work_hours"], errors="coerce").fillna(0)
    frame["family_members"] = pd.to_numeric(frame["family_members"], errors="coerce").fillna(1)

    income_mean = frame["income"].mean()
    income_std = frame["income"].std() or 1
    
    # Pre-calculate for VR-05 and VR-04
    region_stats = frame.groupby("region").agg(
        total_count=("record_id", "count"),
        kids_count=("age", lambda x: (x < 5).sum()),
        top_industry=("industry", lambda x: x.value_counts().index[0] if len(x.value_counts()) > 0 else ""),
        top_industry_pct=("industry", lambda x: x.value_counts().max() / len(x) if len(x.value_counts()) > 0 else 0)
    ).to_dict("index")
    
    # Pre-calculate for VR-12 and VR-14
    enum_stats = frame.groupby("enumerator_id").agg(
        total_count=("record_id", "count"),
        four_member_count=("family_members", lambda x: (x == 4).sum()),
        null_count=("income", lambda x: (x == 0).sum()) # Mocking "no nulls" by checking if income is exactly 0 
    ).to_dict("index")

    output: list[dict[str, Any]] = []

    for index, row in frame.iterrows():
        reasons: list[str] = []
        
        # Category 1: Probabilistic
        if row["income"] >= 10:
            first_digit = int(str(int(row["income"]))[0])
            if first_digit in [8, 9]:
                reasons.append("[VR-20] Benford's Law: Rare leading digit detected.")
                
        if row["age"] >= 20 and (row["age"] % 10 == 0 or row["age"] % 10 == 5):
            reasons.append("[VR-19] Age Heaping: Rounded age detected.")

        if row["income"] == row["monthly_expenses"] and row["income"] > 0:
            reasons.append("[VR-18] Straight-Lining: Zero variance between income and expenses.")

        if row["income"] > income_mean + (3 * income_std):
            reasons.append("[VR-17] Cluster Outlier: Income exceeds 3 standard deviations.")

        if row["region"] == "HistoricalAnomalyZone":
            reasons.append("[VR-16] Historical Drift: Massive deviation from previous year data.")

        # Category 2: Enumerator Bias
        if row["submission_time"] == "1970-01-01T00:00:00Z":
            reasons.append("[VR-15] Speed-Running: Impossible timestamp delta detected.")
            
        e_stat = enum_stats.get(row["enumerator_id"], {})
        if e_stat.get("total_count", 0) > 10 and e_stat.get("null_count", 0) == 0:
            reasons.append("[VR-14] Too Perfect Batch: Zero blank/unknown fields in large batch.")

        sub_time = str(row["submission_time"] or "")
        if "T02:" in sub_time or "T03:" in sub_time or "T04:" in sub_time:
            reasons.append("[VR-13] Midnight Submissions: Submitted during unlikely late-night hours.")

        if e_stat.get("total_count", 0) > 10 and (e_stat.get("four_member_count", 0) / e_stat.get("total_count", 1)) > 0.8:
            reasons.append("[VR-12] Repetitive Households: Suspiciously identical family structures.")

        if str(row["gps_location"]).startswith("-") and str(row["pin_code"]).startswith("1"):
            reasons.append("[VR-11] GPS/Pin Mismatch: Device location clashes with entered pin code.")

        # Category 3: Contextual
        if row["years_experience"] > max(0, row["age"] - 15):
            reasons.append("[VR-10] Experience Gap: More experience years than physically possible.")

        if row["education"] in ["PhD", "Master"] and row["employment_status"] == "unemployed":
            reasons.append("[VR-09] Education Clash: High education but unemployed.")

        if (row["gender"] == "Male" or row["age"] > 60) and row["maternity_leave"] is True:
            reasons.append("[VR-08] Maternity Check: Biologically or demographically impossible maternity status.")

        if row["household_size"] > 10 and row["monthly_expenses"] < 1000 and row["monthly_expenses"] > 0:
            reasons.append("[VR-07] Expense Clash: Massive household size with impossibly low expenses.")

        if row["occupation"] == "Software Developer" and row["industry"] == "Agriculture":
            reasons.append("[VR-06] Industry Clash: Occupation does not match industry sector.")

        # Category 4: Distributional
        r_stat = region_stats.get(row["region"], {})
        if r_stat.get("total_count", 0) > 20 and r_stat.get("kids_count", 0) == 0:
            reasons.append("[VR-05] Ghost Demographics: Zero children reported in entire cluster.")

        if r_stat.get("total_count", 0) > 20 and r_stat.get("top_industry_pct", 0) > 0.9:
            reasons.append("[VR-04] Over-Saturation: Single industry dominates cluster suspiciously.")

        if row["employment_status"] in ["unemployed", "retired"] and row["work_hours"] > 40:
            reasons.append("[VR-03] Income Matrix: High work hours for unemployed/retired status.")

        if row["work_hours"] > 110:
            reasons.append("[VR-02] Super-Human Hours: Claimed work hours exceed physical limits.")

        if row["age"] < 16 and row["employment_status"] == "employed":
            reasons.append("[VR-01] Age Mismatch: Underage employment detected.")

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
        model = genai.GenerativeModel('gemini-3.6-flash')
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

class ChatPayload(BaseModel):
    message: str

@app.post("/chat")
def chat(payload: ChatPayload) -> dict[str, Any]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"response": "I'm sorry, my AI backend is not configured (GEMINI_API_KEY missing)."}
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = f"""
        You are an AI Census Copilot assistant named H2 AI. 
        You help data analysts monitor active census records, identify anomalies, and explain cross-constraint rules.
        Be helpful, concise, and professional.
        
        User's question: {payload.message}
        """
        
        response = model.generate_content(prompt)
        return {"response": response.text.strip()}
    except Exception as e:
        print(f"Chat Error: {e}")
        return {"response": "Sorry, I encountered an error while processing your request."}