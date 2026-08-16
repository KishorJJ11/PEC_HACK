import mongoose from "mongoose";
import { AnomalyRecord } from "./../mongodb-models/AnomalyRecord.js";
import { UploadLog } from "./../mongodb-models/UploadLog.js";

async function clearDB() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/survey_validation");
  console.log("Clearing AnomalyRecords...");
  await AnomalyRecord.deleteMany({});
  console.log("Clearing UploadLogs...");
  await UploadLog.deleteMany({});
  console.log("Database cleared successfully!");
  process.exit(0);
}

clearDB();
