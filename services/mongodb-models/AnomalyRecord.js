import mongoose from "mongoose";

const anomalyRecordSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, index: true },
    enumeratorId: { type: String, required: true, index: true },
    region: { type: String, required: true },
    age: { type: Number, required: true },
    income: { type: Number, required: true },
    education: { type: String, default: "" },
    status: { type: String, required: true },
    risk: { type: String, enum: ["Critical", "High", "Medium", "Low"], required: true },
    reason: { type: String, required: true },
    score: { type: Number, min: 0, max: 1, required: true },
    notificationStatus: { type: String, enum: ["Pending", "Notified", "Auto-Removed", "Resolved"], default: "Pending" },
    notifiedAt: { type: Date },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const AnomalyRecord =
  mongoose.models.AnomalyRecord ||
  mongoose.model("AnomalyRecord", anomalyRecordSchema);