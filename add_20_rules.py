import re

new_rules = """const demoRules = [
  { id: 'VR-20', name: 'Benford’s Law (Fabrication Check)', condition: 'first_digit(income) NOT IN expected_distribution', action: 'Flag for analyst review', status: 'Active', createdAt: '2024-03-12T09:00:00Z' },
  { id: 'VR-19', name: 'Age Heaping (Terminal Digit)', condition: 'age % 10 IN (0, 5) AND frequency > 30%', action: 'Flag for analyst review', status: 'Active', createdAt: '2024-03-12T09:00:00Z' },
  { id: 'VR-18', name: 'Straight-Lining (Zero Variance)', condition: 'STDEV(survey_responses) < 0.1', action: 'Reject record', status: 'Draft', createdAt: '2024-03-12T09:00:00Z' },
  { id: 'VR-17', name: 'Cluster Outlier (Z-Score)', condition: 'Z_SCORE(income, cluster) > 3.0', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-12T09:00:00Z' },
  { id: 'VR-16', name: 'Historical Drift Alert', condition: 'unemployment_rate > historical_rate * 1.5', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-12T09:00:00Z' },
  { id: 'VR-15', name: 'Speed-Running (Timestamp)', condition: 'survey_duration_seconds < 120', action: 'Reject record', status: 'Active', createdAt: '2024-03-11T14:30:00Z' },
  { id: 'VR-14', name: 'The "Too Perfect" Batch', condition: 'missing_values_count = 0 in batch(100)', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-11T14:30:00Z' },
  { id: 'VR-13', name: 'Midnight Submissions', condition: 'submission_hour BETWEEN 2 AND 4', action: 'Return to enumerator', status: 'Active', createdAt: '2024-03-11T14:30:00Z' },
  { id: 'VR-12', name: 'Repetitive Household Structures', condition: 'family_tree_hash == previous_15_hashes', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-11T14:30:00Z' },
  { id: 'VR-11', name: 'GPS vs. Pin Code Mismatch', condition: 'DISTANCE(gps_coord, pin_code_centroid) > 50km', action: 'Reject record', status: 'Active', createdAt: '2024-03-11T14:30:00Z' },
  { id: 'VR-10', name: 'Experience vs. Age Gap', condition: 'years_experience > (age - 15)', action: 'Return to enumerator', status: 'Active', createdAt: '2024-03-10T11:15:00Z' },
  { id: 'VR-09', name: 'Education vs. Occupation Clash', condition: 'education = "PhD" AND occupation = "Unskilled"', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-10T11:15:00Z' },
  { id: 'VR-08', name: 'Maternity/Pregnancy Check', condition: '(gender = "Male" OR age > 60) AND maternity = true', action: 'Reject record', status: 'Active', createdAt: '2024-03-10T11:15:00Z' },
  { id: 'VR-07', name: 'Household Size vs. Expenses', condition: 'household_size >= 10 AND monthly_food < 1000', action: 'Flag for analyst review', status: 'Active', createdAt: '2024-03-10T11:15:00Z' },
  { id: 'VR-06', name: 'Industry vs. Occupation', condition: 'occupation = "Software Developer" AND industry = "Agriculture"', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-10T11:15:00Z' },
  { id: 'VR-05', name: 'The "Ghost Demographics" Check', condition: 'under_5_count = 0 in village AND regional_avg > 10%', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-09T08:45:00Z' },
  { id: 'VR-04', name: 'Over-Saturation of Industry', condition: 'industry_concentration > 85%', action: 'Flag for analyst review', status: 'Draft', createdAt: '2024-03-09T08:45:00Z' },
  { id: 'VR-03', name: 'Income vs. Hours Worked Matrix', condition: 'employment_status = "Unemployed" AND weekly_hours > 20', action: 'Reject record', status: 'Active', createdAt: '2024-03-09T08:45:00Z' },
  { id: 'VR-02', name: 'Super-Human Work Hours', condition: 'total_weekly_hours > 110', action: 'Reject record', status: 'Active', createdAt: '2024-03-09T08:45:00Z' },
  { id: 'VR-01', name: 'Spouse Age Mismatch', condition: 'role = "Spouse" AND age < 16 AND head_age > 30', action: 'Flag for analyst review', status: 'Active', createdAt: '2024-03-09T08:45:00Z' },
];"""

with open("artifacts/survey-validation/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace demoRules block
content = re.sub(r'const demoRules = \[.*?\];', new_rules, content, flags=re.DOTALL)

with open("artifacts/survey-validation/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("20 rules injected successfully.")
