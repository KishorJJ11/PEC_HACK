import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { AnomalyRecord } from "../mongodb-models/AnomalyRecord.js";
import { UploadLog } from "../mongodb-models/UploadLog.js";
import { ValidationRule } from "../mongodb-models/ValidationRule.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";

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

function calculateRiskAndScore(row) {
  let score = 0.5;
  let risk = "Medium";
  const reason = row.anomaly_reason || "";
  
  if (reason.includes("Isolation Forest")) score += 0.3;
  if (reason.includes("Benford")) score += 0.2;
  if (Number(row.age) < 18 && Number(row.income) > 0) score += 0.4;
  
  score = Math.min(score + (reason.length * 0.005), 0.99);
  
  if (score > 0.85) risk = "Critical";
  else if (score > 0.7) risk = "High";
  else if (score < 0.4) risk = "Low";
  
  return { risk, score };
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
      .map((row) => {
        const { risk, score } = calculateRiskAndScore(row);
        return {
          recordId: row.record_id,
          enumeratorId: row.enumerator_id,
          region: row.region || "Unspecified",
          age: Number(row.age || 0),
          income: Number(row.income || 0),
          education: row.education || "",
          status: "Flagged",
          risk,
          reason: row.anomaly_reason,
          score,
        };
      });

    const saved = await AnomalyRecord.insertMany(documents);
    
    await UploadLog.create({
      fileName,
      recordsProcessed: sourceRows.length,
      anomaliesFound: saved.length,
      highRiskCount: saved.filter((row) => row.risk === "High").length,
    });

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

app.post("/api/upload-image", async (request, response, next) => {
  try {
    const { imageBase64, mimeType, fileName } = request.body;
    if (!imageBase64 || !mimeType || !fileName) {
      return response.status(400).json({ error: "imageBase64, mimeType, and fileName are required" });
    }

    const aiResponse = await fetch(`${aiServiceUrl}/validate-image`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64, mime_type: mimeType, fileName }),
    });

    if (!aiResponse.ok) {
      return response.status(502).json({ error: "AI validation service unavailable for images" });
    }

    const result = await aiResponse.json();
    const validatedRows = result.records || [];
    
    const documents = validatedRows
      .filter((row) => row.is_anomaly)
      .map((row) => {
        const { risk, score } = calculateRiskAndScore(row);
        return {
          recordId: row.record_id || "IMG-GEN",
          enumeratorId: row.enumerator_id || "Unknown",
          region: row.region || "Unspecified",
          age: Number(row.age || 0),
          income: Number(row.income || 0),
          education: row.education || "",
          status: "Flagged",
          risk,
          reason: row.anomaly_reason,
          score,
        };
      });

    if (documents.length > 0) {
      await AnomalyRecord.insertMany(documents);
    }
    
    await UploadLog.create({
      fileName,
      recordsProcessed: result.recordsProcessed,
      anomaliesFound: documents.length,
      highRiskCount: documents.filter((row) => row.risk === "High").length,
    });

    return response.json({
      fileName,
      recordsProcessed: result.recordsProcessed,
      anomaliesFound: documents.length,
      highRiskCount: documents.filter((row) => row.risk === "High").length,
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/ingest", async (request, response, next) => {
  try {
    const record = request.body;
    if (!record || !record.record_id) {
      return response.status(400).json({ error: "record_id is required" });
    }

    const aiResponse = await fetch(`${aiServiceUrl}/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify([toAiRecord(record)]),
    });

    if (!aiResponse.ok) {
      return response.status(502).json({ error: "AI validation service unavailable" });
    }

    const validatedRows = await aiResponse.json();
    const processedRecord = validatedRows[0];

    if (processedRecord && processedRecord.is_anomaly) {
      const { risk, score } = calculateRiskAndScore(processedRecord);
      const anomalyDoc = {
        recordId: processedRecord.record_id || "Unknown",
        enumeratorId: processedRecord.enumerator_id || "Unknown",
        region: processedRecord.region || "Unspecified",
        age: Number(processedRecord.age || 0),
        income: Number(processedRecord.income || 0),
        education: processedRecord.education || "",
        status: "Flagged",
        risk,
        reason: processedRecord.anomaly_reason,
        score,
      };
      await AnomalyRecord.create(anomalyDoc);
      
      await UploadLog.create({
        fileName: "Real-time API",
        recordsProcessed: 1,
        anomaliesFound: 1,
        highRiskCount: anomalyDoc.risk === "High" ? 1 : 0,
      });
    } else {
      await UploadLog.create({
        fileName: "Real-time API",
        recordsProcessed: 1,
        anomaliesFound: 0,
        highRiskCount: 0,
      });
    }

    return response.json({
      status: "success",
      is_anomaly: processedRecord.is_anomaly || false,
      reason: processedRecord.anomaly_reason || null,
      record: processedRecord
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
    return response.json(await AnomalyRecord.find(filter).sort({ detectedAt: -1 }).limit(100).lean());
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/anomalies/:id/notify", async (request, response, next) => {
  try {
    const anomaly = await AnomalyRecord.findByIdAndUpdate(
      request.params.id,
      { notificationStatus: "Notified", notifiedAt: new Date() },
      { new: true }
    );
    if (!anomaly) return response.status(404).json({ error: "Not found" });
    
    await UploadLog.create({
      fileName: `Notified Enumerator for ${anomaly.recordId}`,
      recordsProcessed: 0, anomaliesFound: 0, highRiskCount: 0
    });
    
    return response.json(anomaly);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/anomalies/auto-remove", async (request, response, next) => {
  try {
    const result = await AnomalyRecord.updateMany(
      { notificationStatus: "Notified" },
      { $set: { notificationStatus: "Auto-Removed", status: "Removed" } }
    );
    
    if (result.modifiedCount > 0) {
      await UploadLog.create({
        fileName: `Auto-removed ${result.modifiedCount} ignored anomalies`,
        recordsProcessed: 0, anomaliesFound: 0, highRiskCount: 0
      });
    }
    
    return response.json({ message: "Simulated 5 days passed", removed: result.modifiedCount });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/validation/summary", async (request, response, next) => {
  try {
    const logs = await UploadLog.find().lean();
    const totalRecords = logs.reduce((sum, log) => sum + log.recordsProcessed, 0);
    const totalAnomalies = await AnomalyRecord.countDocuments();
    const highRiskEnumerators = (await AnomalyRecord.distinct("enumeratorId", { risk: "High" })).length;
    const anomalyRate = totalRecords > 0 ? Number(((totalAnomalies / totalRecords) * 100).toFixed(2)) : 0;
    
    const regionStats = await AnomalyRecord.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } }
    ]);
    const regionalAnomalies = regionStats.map(stat => ({
      region: stat._id,
      anomalies: stat.count,
      total: stat.count * 15
    }));
    
    const recentLogs = await UploadLog.find().sort({ createdAt: -1 }).limit(7).lean();
    const ingestionTrend = recentLogs.reverse().map(log => ({
      label: new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      records: log.recordsProcessed
    }));
    
    const recentActivityLogs = await UploadLog.find().sort({ createdAt: -1 }).limit(10).lean();
    const activity = recentActivityLogs.map(log => {
      const timeDiffMs = Date.now() - new Date(log.createdAt).getTime();
      const minutesAgo = Math.floor(timeDiffMs / 60000);
      let timeStr = 'Just now';
      if (minutesAgo > 60) timeStr = `${Math.floor(minutesAgo/60)}h ago`;
      else if (minutesAgo > 0) timeStr = `${minutesAgo}m ago`;

      return {
        id: log._id.toString(),
        title: `Ingested ${log.fileName}`,
        detail: `Processed ${log.recordsProcessed} records, found ${log.anomaliesFound} anomalies.`,
        time: timeStr,
        tone: log.anomaliesFound > 0 ? 'orange' : 'green'
      };
    });
    return response.json({
      totalRecords,
      totalAnomalies,
      highRiskEnumerators,
      anomalyRate,
      regionalAnomalies,
      ingestionTrend,
      activity
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/rules", async (request, response, next) => {
  try {
    const rules = await ValidationRule.find().sort({ createdAt: -1 }).lean();
    return response.json(rules.map(r => ({ ...r, id: r._id.toString() })));
  } catch (error) {
    return next(error);
  }
});

app.post("/api/rules", async (request, response, next) => {
  try {
    const { name, condition, action, status } = request.body;
    const newRule = await ValidationRule.create({ name, condition, action, status });
    return response.json({ ...newRule.toObject(), id: newRule._id.toString() });
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