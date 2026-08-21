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
    years_experience: { type: Number, default: 0 },
    household_size: { type: Number, default: 1 },
    monthly_expenses: { type: Number, default: 0 },
    work_hours: { type: Number, default: 0 },
    gender: { type: String, default: "Unknown" },
    maternity_leave: { type: Boolean, default: false },
    industry: { type: String, default: "" },
    occupation: { type: String, default: "" },
    submission_time: { type: Date },
    gps_location: { type: String, default: "" },
    pin_code: { type: String, default: "" },
    family_members: { type: Number, default: 1 },
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