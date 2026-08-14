import mongoose from "mongoose";

const validationRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Active", "Draft"], default: "Active" },
  },
  { timestamps: true },
);

export const ValidationRule =
  mongoose.models.ValidationRule ||
  mongoose.model("ValidationRule", validationRuleSchema);