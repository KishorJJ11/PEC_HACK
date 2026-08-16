import re

more_data = """  { id: 'AN-10007', recordId: 'REC-0599', enumeratorId: 'E-112', region: 'North West', age: 72, income: 45000, education: 'GCSE', status: 'Flagged', risk: 'Medium', reason: 'Rule 2: Early retirement age anomaly.', detectedAt: '2024-03-11T08:20:00Z', score: 0.76 },
  { id: 'AN-10008', recordId: 'REC-0601', enumeratorId: 'E-134', region: 'South East', age: 14, income: 8000, education: 'A-level', status: 'Needs review', risk: 'High', reason: 'Rule 1: Underage employment detected.', detectedAt: '2024-03-11T08:15:00Z', score: 0.92 },
  { id: 'AN-10009', recordId: 'REC-0655', enumeratorId: 'E-099', region: 'East Midlands', age: 45, income: -500, education: 'Degree', status: 'Flagged', risk: 'High', reason: 'Rule 4: Negative income reported.', detectedAt: '2024-03-11T08:10:00Z', score: 0.99 },
  { id: 'AN-10010', recordId: 'REC-0712', enumeratorId: 'E-155', region: 'Yorkshire', age: 30, income: 0, education: 'Master', status: 'Needs review', risk: 'High', reason: 'Rule 6: Zero income for employed status.', detectedAt: '2024-03-11T08:05:00Z', score: 0.88 },
  { id: 'AN-10011', recordId: 'REC-0789', enumeratorId: 'E-088', region: 'South West', age: 29, income: 45000, education: '', status: 'Flagged', risk: 'Low', reason: 'Rule 8: Missing essential survey fields.', detectedAt: '2024-03-11T08:00:00Z', score: 0.65 },
  { id: 'AN-10012', recordId: 'REC-0801', enumeratorId: 'E-123', region: 'North East', age: 105, income: 25000, education: 'Degree', status: 'Needs review', risk: 'High', reason: 'Rule 3: Invalid age bounds (0-100).', detectedAt: '2024-03-11T07:55:00Z', score: 0.91 },
  { id: 'AN-10013', recordId: 'REC-0810', enumeratorId: 'E-090', region: 'West Midlands', age: 25, income: 180000, education: 'PhD', status: 'Flagged', risk: 'High', reason: 'Rule 9: Income exceeds 3 standard deviations from mean.', detectedAt: '2024-03-11T07:50:00Z', score: 0.84 },
  { id: 'AN-10014', recordId: 'REC-0855', enumeratorId: 'E-111', region: 'South East', age: 42, income: 22000, education: 'Degree', status: 'Needs review', risk: 'Medium', reason: 'Rule 10: Isolation Forest detected multi-variate anomaly.', detectedAt: '2024-03-11T07:45:00Z', score: 0.72 },
  { id: 'AN-10015', recordId: 'REC-0901', enumeratorId: 'E-125', region: 'North West', age: 15, income: 5000, education: 'GCSE', status: 'Flagged', risk: 'High', reason: 'Rule 1: Underage employment detected.', detectedAt: '2024-03-11T07:40:00Z', score: 0.94 },
  { id: 'AN-10016', recordId: 'REC-0922', enumeratorId: 'E-145', region: 'East Midlands', age: 50, income: -100, education: 'Degree', status: 'Needs review', risk: 'High', reason: 'Rule 4: Negative income reported.', detectedAt: '2024-03-11T07:35:00Z', score: 0.98 },
  { id: 'AN-10017', recordId: 'REC-0955', enumeratorId: 'E-078', region: 'Yorkshire', age: 61, income: 15000, education: 'GCSE', status: 'Flagged', risk: 'Low', reason: 'Rule 10: Isolation Forest detected multi-variate anomaly.', detectedAt: '2024-03-11T07:30:00Z', score: 0.68 },
  { id: 'AN-10018', recordId: 'REC-1011', enumeratorId: 'E-199', region: 'South West', age: 12, income: 0, education: 'PhD', status: 'Needs review', risk: 'High', reason: 'Rule 7: Higher education conflicts with young age.', detectedAt: '2024-03-11T07:25:00Z', score: 0.97 },
  { id: 'AN-10019', recordId: 'REC-1050', enumeratorId: 'E-120', region: 'North East', age: 44, income: 0, education: 'Degree', status: 'Flagged', risk: 'Medium', reason: 'Rule 6: Zero income for employed status.', detectedAt: '2024-03-11T07:20:00Z', score: 0.81 },
  { id: 'AN-10020', recordId: 'REC-1100', enumeratorId: 'E-133', region: 'West Midlands', age: -2, income: 12000, education: 'A-level', status: 'Needs review', risk: 'High', reason: 'Rule 3: Invalid age bounds (0-100).', detectedAt: '2024-03-11T07:15:00Z', score: 0.99 },
  { id: 'AN-10021', recordId: 'REC-1120', enumeratorId: 'E-140', region: 'South East', age: 28, income: 250000, education: 'Master', status: 'Flagged', risk: 'High', reason: 'Rule 9: Income exceeds 3 standard deviations from mean.', detectedAt: '2024-03-11T07:10:00Z', score: 0.89 },
"""

with open("artifacts/survey-validation/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Insert the lines before the closing bracket of demoAnomalies
content = re.sub(
    r'(const demoAnomalies = \[.*?)(];)', 
    r'\1' + more_data.replace('\\', '\\\\') + r'\2', 
    content, 
    flags=re.DOTALL
)

with open("artifacts/survey-validation/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Added more anomalies!")
