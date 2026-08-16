import re

with open("artifacts/survey-validation/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove demoSummary, demoAnomalies, demoRules definitions
content = re.sub(r'const demoSummary = {.*?\n};\n+', '', content, flags=re.DOTALL)
content = re.sub(r'const demoAnomalies = \[.*?\n\];\n+', '', content, flags=re.DOTALL)
content = re.sub(r'const demoRules = \[.*?\n\];\n+', '', content, flags=re.DOTALL)

# 2. In DashboardPage
content = re.sub(
    r'const summaryQuery = useGetValidationSummary\(\{ query: \{ queryKey: getGetValidationSummaryQueryKey\(\) \} \}\);\n\s*const summary = summaryQuery\.data \?\? demoSummary;\n\s*const isDemo = !summaryQuery\.data;',
    '''const summaryQuery = useGetValidationSummary({ query: { queryKey: getGetValidationSummaryQueryKey() } });
  if (summaryQuery.isLoading) return <main className="content-wrap page-enter flex min-h-[50dvh] items-center justify-center">Loading live data...</main>;
  const summary = summaryQuery.data;
  if (!summary) return <main className="content-wrap page-enter flex min-h-[50dvh] items-center justify-center">No data found in database. Please upload a survey.</main>;''',
    content
)

content = content.replace(
    '''{isDemo && <span className="mono-font rounded-full border border-[#dbcec0] bg-[#f8f3e9] px-3 py-2 text-[9px] uppercase tracking-[.1em] text-[#8c755f]">Illustrative workspace</span>}''',
    ''
)

# 3. In RegionalChart, IngestionChart, ActivityPanel
content = content.replace("const rows = data?.length ? data : demoSummary.regionalAnomalies;", "const rows = data || [];")
content = content.replace("const rows = data?.length ? data : demoSummary.ingestionTrend;", "const rows = data || [];")
content = content.replace("const rows = data?.length ? data : demoSummary.activity;", "const rows = data || [];")

# 4. In AnomaliesPage
content = re.sub(
    r'const anomalyQuery = useGetAnomalies\((.*?)\);\n\s*const baseRows = anomalyQuery\.data \?\? demoAnomalies;\n\s*const rows = baseRows\.filter\((.*?)\);\n\s*const isDemo = !anomalyQuery\.data;',
    r'''const anomalyQuery = useGetAnomalies(\1);
  const baseRows = anomalyQuery.data || [];
  const rows = baseRows.filter(\2);
  const isDemo = false;''',
    content
)

# 5. In RulesPage
content = re.sub(
    r'const rulesQuery = useGetValidationRules\(\{ query: \{ queryKey: getGetValidationRulesQueryKey\(\) \} \}\);\n\s*const serverRules = rulesQuery\.data \?\? demoRules;',
    r'''const rulesQuery = useGetValidationRules({ query: { queryKey: getGetValidationRulesQueryKey() } });
  const serverRules = rulesQuery.data || [];''',
    content
)

with open("artifacts/survey-validation/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("App.jsx rewritten successfully.")
