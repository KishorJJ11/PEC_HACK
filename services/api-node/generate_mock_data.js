import mongoose from "mongoose";
import { AnomalyRecord } from "./../mongodb-models/AnomalyRecord.js";
import { UploadLog } from "./../mongodb-models/UploadLog.js";

async function generateData() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/survey_validation");
  console.log("Clearing DB...");
  await AnomalyRecord.deleteMany({});
  await UploadLog.deleteMany({});
  
  const regions = ["North", "South", "East", "West", "Central"];
  
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // 50 to 100 records per day
    const recordsProcessed = Math.floor(Math.random() * 51) + 50; 
    
    // 40% to 50% anomaly rate
    const rate = 0.40 + Math.random() * 0.10;
    const anomaliesFound = Math.floor(recordsProcessed * rate);
    
    // Distribution: Critical < High < Medium < Low
    let criticalCount = Math.floor(anomaliesFound * 0.05);
    let highCount = Math.floor(anomaliesFound * 0.15);
    let mediumCount = Math.floor(anomaliesFound * 0.30);
    // Ensure critical < high < medium < low
    if (criticalCount === 0 && anomaliesFound > 10) criticalCount = 1;
    if (highCount <= criticalCount && anomaliesFound > 10) highCount = criticalCount + 1;
    if (mediumCount <= highCount && anomaliesFound > 10) mediumCount = highCount + 1;
    
    let lowCount = anomaliesFound - criticalCount - highCount - mediumCount;
    if (lowCount <= mediumCount) {
        lowCount = mediumCount + 1; // force it to be highest
    }
    
    const anomalyDocs = [];
    const pushAnomaly = (risk, score) => {
      anomalyDocs.push({
        recordId: `REC-MOCK-${30-i}-${anomalyDocs.length}`,
        enumeratorId: `ENUM-${Math.floor(Math.random() * 50) + 1}`,
        region: regions[Math.floor(Math.random() * regions.length)],
        age: Math.floor(Math.random() * 40) + 20,
        income: Math.floor(Math.random() * 50000) + 10000,
        status: "Flagged",
        risk: risk,
        reason: `[VR-${Math.floor(Math.random() * 20) + 1}] Mock reason for ${risk}`,
        score: score,
        detectedAt: d,
      });
    };
    
    for (let j=0; j<criticalCount; j++) pushAnomaly("Critical", 0.90 + Math.random() * 0.09);
    for (let j=0; j<highCount; j++) pushAnomaly("High", 0.75 + Math.random() * 0.10);
    for (let j=0; j<mediumCount; j++) pushAnomaly("Medium", 0.55 + Math.random() * 0.15);
    for (let j=0; j<lowCount; j++) pushAnomaly("Low", 0.20 + Math.random() * 0.30);
    
    if (anomalyDocs.length > 0) {
      await AnomalyRecord.insertMany(anomalyDocs);
    }
    
    await UploadLog.collection.insertOne({
      fileName: `Historical_Extract_Day_${30-i}.csv`,
      recordsProcessed,
      anomaliesFound: anomalyDocs.length,
      highRiskCount: highCount,
      createdAt: d,
      updatedAt: d
    });
  }
  
  console.log("Mock data generated successfully!");
  process.exit(0);
}

generateData();
