import mongoose from "mongoose";

const uploadLogSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    recordsProcessed: { type: Number, required: true, default: 0 },
    anomaliesFound: { type: Number, required: true, default: 0 },
    highRiskCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const UploadLog =
  mongoose.models.UploadLog || mongoose.model("UploadLog", uploadLogSchema);
