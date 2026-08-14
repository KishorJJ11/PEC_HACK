import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { AnomalyRecord } from "../mongodb-models/AnomalyRecord.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

function parseCsv(csvContent) {
  const [headerLine, ...rows] = csvContent.trim().split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split(",").map((header) => header.trim());
  return rows.map((row) => {
    const values = row.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function toAiRecord(record) {
  return {
    record_id: record.record_id ?? record.recordId,
    enumerator_id: record.enumerator_id ?? record.enumeratorId,
    region: record.region,
    age: Number(record.age ?? 0),
    income: Number(record.income ?? record.annual_income ?? 0),
    education: record.education ?? "",
    employment_status: record.employment_status ?? record.status ?? "",
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.post("/api/upload", async (request, response, next) => {
  try {
    const { fileName, csvContent } = request.body;
    if (!fileName || !csvContent) {
      return response.status(400).json({ error: "fileName and csvContent are required" });
    }

    const sourceRows = parseCsv(csvContent);
    const aiResponse = await fetch(`${aiServiceUrl}/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sourceRows.map(toAiRecord)),
    });
    if (!aiResponse.ok) {
      return response.status(502).json({ error: "AI validation service unavailable" });
    }

    const validatedRows = await aiResponse.json();
    const documents = validatedRows
      .filter((row) => row.is_anomaly)
      .map((row) => ({
        recordId: row.record_id,
        enumeratorId: row.enumerator_id,
        region: row.region || "Unspecified",
        age: Number(row.age || 0),
        income: Number(row.income || 0),
        education: row.education || "",
        status: "Flagged",
        risk: Number(row.age) < 18 && Number(row.income) > 0 ? "High" : "Medium",
        reason: row.anomaly_reason,
        score: Number(row.age) < 18 && Number(row.income) > 0 ? 0.96 : 0.82,
      }));

    const saved = await AnomalyRecord.insertMany(documents);
    return response.json({
      fileName,
      recordsProcessed: sourceRows.length,
      anomaliesFound: saved.length,
      highRiskCount: saved.filter((row) => row.risk === "High").length,
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/anomalies", async (request, response, next) => {
  try {
    const filter = {};
    if (request.query.risk && request.query.risk !== "All") filter.risk = request.query.risk;
    if (request.query.search) {
      const search = String(request.query.search);
      filter.$or = [
        { recordId: new RegExp(search, "i") },
        { enumeratorId: new RegExp(search, "i") },
        { region: new RegExp(search, "i") },
      ];
    }
    return response.json(await AnomalyRecord.find(filter).sort({ detectedAt: -1 }).lean());
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  response.status(500).json({ error: error instanceof Error ? error.message : "Unexpected server error" });
});

await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/survey_validation");
app.listen(port, () => {
  process.stdout.write(`Survey validation API listening on ${port}\n`);
});