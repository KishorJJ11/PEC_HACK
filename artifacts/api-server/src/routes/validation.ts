import { Router, type IRouter, type Request } from "express";
import {
  CreateValidationRuleBody,
  GetAnomaliesQueryParams,
  UploadSurveyBody,
} from "@workspace/api-zod";

type Risk = "High" | "Medium" | "Low";
type ActivityTone = "blue" | "green" | "orange" | "red";

type AnomalyRecord = {
  id: string;
  recordId: string;
  enumeratorId: string;
  region: string;
  age: number;
  income: number;
  education: string;
  status: string;
  risk: Risk;
  reason: string;
  detectedAt: string;
  score: number;
};

type ValidationRule = {
  id: string;
  name: string;
  condition: string;
  action: string;
  status: "Active" | "Draft";
  createdAt: string;
};

const now = new Date();
const isoDaysAgo = (days: number) =>
  new Date(now.getTime() - days * 86_400_000).toISOString();

const anomalies: AnomalyRecord[] = [
  {
    id: "an-10492",
    recordId: "REC-10492",
    enumeratorId: "ENUM-088",
    region: "Northern",
    age: 15,
    income: 1_000_000,
    education: "Primary",
    status: "Flagged",
    risk: "High",
    reason:
      "Contextual anomaly: age 15 is inconsistent with reported annual income of ₹1,000,000.",
    detectedAt: isoDaysAgo(0),
    score: 0.98,
  },
  {
    id: "an-10476",
    recordId: "REC-10476",
    enumeratorId: "ENUM-042",
    region: "Western",
    age: 62,
    income: 12_500,
    education: "Postgraduate",
    status: "Flagged",
    risk: "Medium",
    reason:
      "Distribution anomaly: income is 3.4 standard deviations below the regional median for this profile.",
    detectedAt: isoDaysAgo(0),
    score: 0.87,
  },
  {
    id: "an-10431",
    recordId: "REC-10431",
    enumeratorId: "ENUM-019",
    region: "Southern",
    age: 28,
    income: 0,
    education: "Secondary",
    status: "Needs review",
    risk: "Low",
    reason:
      "Rule check: working-age respondent reports zero income while marked as employed.",
    detectedAt: isoDaysAgo(1),
    score: 0.69,
  },
  {
    id: "an-10388",
    recordId: "REC-10388",
    enumeratorId: "ENUM-105",
    region: "Eastern",
    age: 19,
    income: 840_000,
    education: "Secondary",
    status: "Flagged",
    risk: "High",
    reason:
      "Contextual anomaly: reported income is unusually high for age and education combination.",
    detectedAt: isoDaysAgo(1),
    score: 0.94,
  },
  {
    id: "an-10362",
    recordId: "REC-10362",
    enumeratorId: "ENUM-073",
    region: "Central",
    age: 44,
    income: 3_200_000,
    education: "Graduate",
    status: "Needs review",
    risk: "Medium",
    reason:
      "Distribution anomaly: income exceeds the 99th percentile for the local occupation cluster.",
    detectedAt: isoDaysAgo(2),
    score: 0.82,
  },
  {
    id: "an-10341",
    recordId: "REC-10341",
    enumeratorId: "ENUM-088",
    region: "Northern",
    age: 17,
    income: 450_000,
    education: "Secondary",
    status: "Flagged",
    risk: "High",
    reason:
      "Rule check: respondent is under 18 but has a positive income value.",
    detectedAt: isoDaysAgo(2),
    score: 0.91,
  },
  {
    id: "an-10294",
    recordId: "REC-10294",
    enumeratorId: "ENUM-056",
    region: "Western",
    age: 36,
    income: 7_500,
    education: "Secondary",
    status: "Needs review",
    risk: "Low",
    reason:
      "Pattern anomaly: repeated identical responses observed across three household fields.",
    detectedAt: isoDaysAgo(3),
    score: 0.61,
  },
];

const rules: ValidationRule[] = [
  {
    id: "rule-001",
    name: "Minor income guard",
    condition: "Age < 18",
    action: "Income must equal 0",
    status: "Active",
    createdAt: "12 Aug 2026",
  },
  {
    id: "rule-002",
    name: "Working age employment",
    condition: "Age >= 18",
    action: "Employment status is required",
    status: "Active",
    createdAt: "10 Aug 2026",
  },
  {
    id: "rule-003",
    name: "Education consistency",
    condition: "Age < 16",
    action: "Education must be Primary or below",
    status: "Draft",
    createdAt: "08 Aug 2026",
  },
];

const parseCsv = (csvContent: string) => {
  const lines = csvContent
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
};

const riskForScore = (score: number): Risk =>
  score >= 0.9 ? "High" : score >= 0.75 ? "Medium" : "Low";

const logFor = (req: Request) => req.log;

const router: IRouter = Router();

router.get("/validation/summary", (req, res) => {
  const highRiskEnumerators = new Set(
    anomalies.filter((record) => record.risk === "High").map((record) => record.enumeratorId),
  ).size;
  const regionMap = new Map<string, { anomalies: number; total: number }>();
  [
    ["Northern", 10_284],
    ["Western", 8_991],
    ["Southern", 9_752],
    ["Eastern", 7_410],
    ["Central", 6_884],
  ].forEach(([region, total]) => regionMap.set(String(region), { anomalies: 0, total: Number(total) }));
  anomalies.forEach((record) => {
    const region = regionMap.get(record.region);
    if (region) region.anomalies += 1;
  });

  res.json({
    totalRecords: 48_321,
    totalAnomalies: 1_284,
    highRiskEnumerators,
    anomalyRate: 2.66,
    regionalAnomalies: [...regionMap.entries()].map(([region, data]) => ({ region, ...data })),
    ingestionTrend: [
      { label: "05 Aug", records: 4_200 },
      { label: "06 Aug", records: 7_840 },
      { label: "07 Aug", records: 6_100 },
      { label: "08 Aug", records: 9_620 },
      { label: "09 Aug", records: 8_450 },
      { label: "10 Aug", records: 10_220 },
      { label: "11 Aug", records: 11_891 },
    ],
    activity: [
      { id: "act-1", title: "Batch validation completed", detail: "Employment Survey · 11,891 records", time: "12 min ago", tone: "green" as ActivityTone },
      { id: "act-2", title: "High-risk cluster detected", detail: "Northern region · 24 enumerators", time: "38 min ago", tone: "red" as ActivityTone },
      { id: "act-3", title: "New rule published", detail: "Working age employment", time: "2 hrs ago", tone: "blue" as ActivityTone },
      { id: "act-4", title: "Review queue updated", detail: "18 records assigned to you", time: "Yesterday", tone: "orange" as ActivityTone },
    ],
  });
});

router.get("/anomalies", (req, res) => {
  const query = GetAnomaliesQueryParams.parse(req.query);
  const search = query.search?.toLowerCase().trim();
  const filtered = anomalies.filter((record) => {
    const matchesRisk = !query.risk || query.risk === "All" || record.risk === query.risk;
    const matchesSearch =
      !search ||
      [record.recordId, record.enumeratorId, record.region, record.reason]
        .join(" ")
        .toLowerCase()
        .includes(search);
    return matchesRisk && matchesSearch;
  });
  res.json(filtered);
});

router.post("/upload", (req, res) => {
  const body = UploadSurveyBody.parse(req.body);
  const records = parseCsv(body.csvContent);
  const generated = records.map((record, index) => {
    const age = Number(record.age ?? record.Age ?? 0);
    const income = Number(record.income ?? record.Income ?? 0);
    const score = age < 18 && income > 0 ? 0.96 : income > 500_000 ? 0.88 : 0.54;
    const isAnomaly = score >= 0.75;
    return {
      id: `upload-${Date.now()}-${index}`,
      recordId: record.record_id ?? record.recordId ?? `UPL-${index + 1}`,
      enumeratorId: record.enumerator_id ?? record.enumeratorId ?? "UNKNOWN",
      region: record.region ?? "Unspecified",
      age,
      income,
      education: record.education ?? "Not provided",
      status: isAnomaly ? "Flagged" : "Validated",
      risk: riskForScore(score),
      reason: age < 18 && income > 0
        ? `Contextual anomaly: age ${age} is inconsistent with reported income of ₹${income.toLocaleString("en-IN")}.`
        : `Distribution check: reported income is above the expected threshold for this sample.`,
      detectedAt: new Date().toISOString(),
      score,
    } satisfies AnomalyRecord;
  });
  anomalies.unshift(...generated.filter((record) => record.risk !== "Low"));
  logFor(req).info({ fileName: body.fileName, records: records.length }, "Survey upload processed");
  res.json({
    fileName: body.fileName,
    recordsProcessed: records.length,
    anomaliesFound: generated.filter((record) => record.risk !== "Low").length,
    highRiskCount: generated.filter((record) => record.risk === "High").length,
  });
});

router.get("/rules", (_req, res) => {
  res.json(rules);
});

router.post("/rules", (req, res) => {
  const body = CreateValidationRuleBody.parse(req.body);
  const rule: ValidationRule = {
    id: `rule-${String(rules.length + 1).padStart(3, "0")}`,
    name: body.name,
    condition: body.condition,
    action: body.action,
    status: "Active",
    createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  };
  rules.unshift(rule);
  res.status(201).json(rule);
});

export default router;