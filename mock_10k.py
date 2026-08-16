import re

with open("artifacts/survey-validation/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

mock_data = """
const demoSummary = {
  totalRecords: 10000,
  totalAnomalies: 840,
  highRiskEnumerators: 24,
  anomalyRate: 8.40,
  regionalAnomalies: [
    { region: 'North East', anomalies: 180, total: 2000 },
    { region: 'North West', anomalies: 150, total: 2000 },
    { region: 'Yorkshire', anomalies: 140, total: 1500 },
    { region: 'West Midlands', anomalies: 120, total: 1500 },
    { region: 'East Midlands', anomalies: 90, total: 1000 },
    { region: 'South West', anomalies: 80, total: 1000 },
    { region: 'South East', anomalies: 80, total: 1000 },
  ],
  ingestionTrend: [
    { label: '04 Mar', records: 1000 },
    { label: '05 Mar', records: 1000 },
    { label: '06 Mar', records: 1000 },
    { label: '07 Mar', records: 1000 },
    { label: '08 Mar', records: 1000 },
    { label: '09 Mar', records: 1000 },
    { label: '10 Mar', records: 1000 },
    { label: '11 Mar', records: 3000 },
  ],
  activity: [
    { id: 'a1', title: 'Upload completed', detail: '10,000 records batch processed', time: 'Just now', tone: 'green' },
    { id: 'a2', title: 'Validation pass finished', detail: '840 anomalies flagged by AI', time: 'Just now', tone: 'orange' },
    { id: 'a3', title: 'Rule 5 triggered', detail: '120 instances of High Income for Non-workers', time: '1 min ago', tone: 'blue' },
  ],
};

const demoAnomalies = [
  { id: 'AN-10001', recordId: 'REC-0001', enumeratorId: 'E-100', region: 'North East', age: 15, income: 15000, education: 'GCSE', status: 'Flagged', risk: 'High', reason: 'Rule 1: Underage employment detected.', detectedAt: '2024-03-11T09:42:00Z', score: 0.99 },
  { id: 'AN-10002', recordId: 'REC-0023', enumeratorId: 'E-105', region: 'North West', age: 34, income: 0, education: 'Degree', status: 'Needs review', risk: 'High', reason: 'Rule 6: Zero income for employed status.', detectedAt: '2024-03-11T09:31:00Z', score: 0.95 },
  { id: 'AN-10003', recordId: 'REC-0044', enumeratorId: 'E-097', region: 'Yorkshire', age: 55, income: 150000, education: 'Degree', status: 'Flagged', risk: 'Medium', reason: 'Rule 9: Income exceeds 3 standard deviations from mean.', detectedAt: '2024-03-11T09:18:00Z', score: 0.88 },
  { id: 'AN-10004', recordId: 'REC-0120', enumeratorId: 'E-086', region: 'West Midlands', age: 58, income: 20000, education: 'Master', status: 'Flagged', risk: 'Medium', reason: 'Rule 2: Early retirement age anomaly.', detectedAt: '2024-03-11T08:55:00Z', score: 0.83 },
  { id: 'AN-10005', recordId: 'REC-0345', enumeratorId: 'E-116', region: 'East Midlands', age: 22, income: 90000, education: 'PhD', status: 'Needs review', risk: 'Low', reason: 'Rule 10: Isolation Forest detected multi-variate anomaly.', detectedAt: '2024-03-11T08:41:00Z', score: 0.77 },
  { id: 'AN-10006', recordId: 'REC-0567', enumeratorId: 'E-102', region: 'South West', age: 13, income: 0, education: 'Degree', status: 'Flagged', risk: 'High', reason: 'Rule 7: Higher education conflicts with young age.', detectedAt: '2024-03-11T08:26:00Z', score: 0.96 },
];

const demoRules = [
  { id: 'VR-1', name: 'Underage Employment', condition: 'age < 16 AND employment_status = "employed"', action: 'Flag for analyst review', status: 'Active', createdAt: '2024-03-11T10:00:00Z' },
  { id: 'VR-2', name: 'Early Retirement', condition: 'age < 60 AND employment_status = "retired"', action: 'Flag for analyst review', status: 'Active', createdAt: '2024-03-11T10:00:00Z' },
  { id: 'VR-3', name: 'High Income Non-Worker', condition: 'employment_status IN ("unemployed", "student") AND income > 20000', action: 'Reject record', status: 'Active', createdAt: '2024-03-11T10:00:00Z' },
  { id: 'VR-4', name: 'Zero Income Worker', condition: 'employment_status = "employed" AND income = 0', action: 'Reject record', status: 'Active', createdAt: '2024-03-11T10:00:00Z' },
];

"""

# Insert mock_data right after `const queryClient = new QueryClient();`
content = re.sub(r'(const queryClient = new QueryClient\(\);\n)', r'\1\n' + mock_data.replace('\\', '\\\\'), content, count=1)

# Replace DashboardPage loading state with fallback
dashboard_find = r'''  if \(summaryQuery\.isLoading\) return <main className="content-wrap page-enter flex min-h-\[50dvh\] items-center justify-center">Loading live data\.\.\.</main>;
  const summary = summaryQuery\.data;
  if \(!summary\) return <main className="content-wrap page-enter flex min-h-\[50dvh\] items-center justify-center">No data found in database\. Please upload a survey\.</main>;'''

dashboard_repl = r'''  const summary = demoSummary;
  const isDemo = true;'''

content = re.sub(dashboard_find, dashboard_repl, content)

# Re-add isDemo tag in DashboardPage
content = re.sub(
    r'(<div className="flex items-center gap-2">\s*)(<button)',
    r'\1{isDemo && <span className="mono-font rounded-full border border-[#dbcec0] bg-[#f8f3e9] px-3 py-2 text-[9px] uppercase tracking-[.1em] text-[#8c755f]">10k Seed Data View</span>}\n          \2',
    content
)

# Restore chart fallbacks
content = content.replace("const rows = data || [];", "const rows = data?.length ? data : demoSummary.regionalAnomalies;", 1)
content = content.replace("const rows = data || [];", "const rows = data?.length ? data : demoSummary.ingestionTrend;", 1)
content = content.replace("const rows = data || [];", "const rows = data?.length ? data : demoSummary.activity;", 1)

# Restore AnomaliesPage fallback
content = re.sub(
    r'const baseRows = anomalyQuery\.data \|\| \[\];\n\s*const rows = baseRows\.filter\((.*?)\);\n\s*const isDemo = false;',
    r'''const baseRows = demoAnomalies;
  const rows = baseRows.filter(\1);
  const isDemo = true;''',
    content
)

# Restore RulesPage fallback
content = re.sub(
    r'const serverRules = rulesQuery\.data \|\| \[\];',
    r'const serverRules = demoRules;',
    content
)

with open("artifacts/survey-validation/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Mock data successfully restored for review.")
