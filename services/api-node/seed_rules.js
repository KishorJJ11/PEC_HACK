import mongoose from "mongoose";
import { ValidationRule } from "./../mongodb-models/ValidationRule.js";

const newRules = [
  { name: 'Benford’s Law (Fabrication Check)', condition: 'first_digit(income) NOT IN expected_distribution', action: 'Flag for analyst review', status: 'Active' },
  { name: 'Age Heaping (Terminal Digit)', condition: 'age % 10 IN (0, 5) AND frequency > 30%', action: 'Flag for analyst review', status: 'Active' },
  { name: 'Straight-Lining (Zero Variance)', condition: 'STDEV(survey_responses) < 0.1', action: 'Reject record', status: 'Draft' },
  { name: 'Cluster Outlier (Z-Score)', condition: 'Z_SCORE(income, cluster) > 3.0', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'Historical Drift Alert', condition: 'unemployment_rate > historical_rate * 1.5', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'Speed-Running (Timestamp)', condition: 'survey_duration_seconds < 120', action: 'Reject record', status: 'Active' },
  { name: 'The "Too Perfect" Batch', condition: 'missing_values_count = 0 in batch(100)', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'Midnight Submissions', condition: 'submission_hour BETWEEN 2 AND 4', action: 'Return to enumerator', status: 'Active' },
  { name: 'Repetitive Household Structures', condition: 'family_tree_hash == previous_15_hashes', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'GPS vs. Pin Code Mismatch', condition: 'DISTANCE(gps_coord, pin_code_centroid) > 50km', action: 'Reject record', status: 'Active' },
  { name: 'Experience vs. Age Gap', condition: 'years_experience > (age - 15)', action: 'Return to enumerator', status: 'Active' },
  { name: 'Education vs. Occupation Clash', condition: 'education = "PhD" AND occupation = "Unskilled"', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'Maternity/Pregnancy Check', condition: '(gender = "Male" OR age > 60) AND maternity = true', action: 'Reject record', status: 'Active' },
  { name: 'Household Size vs. Expenses', condition: 'household_size >= 10 AND monthly_food < 1000', action: 'Flag for analyst review', status: 'Active' },
  { name: 'Industry vs. Occupation', condition: 'occupation = "Software Developer" AND industry = "Agriculture"', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'The "Ghost Demographics" Check', condition: 'under_5_count = 0 in village AND regional_avg > 10%', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'Over-Saturation of Industry', condition: 'industry_concentration > 85%', action: 'Flag for analyst review', status: 'Draft' },
  { name: 'Income vs. Hours Worked Matrix', condition: 'employment_status = "Unemployed" AND weekly_hours > 20', action: 'Reject record', status: 'Active' },
  { name: 'Super-Human Work Hours', condition: 'total_weekly_hours > 110', action: 'Reject record', status: 'Active' },
  { name: 'Spouse Age Mismatch', condition: 'role = "Spouse" AND age < 16 AND head_age > 30', action: 'Flag for analyst review', status: 'Active' }
];

async function seedRules() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/survey_validation");
  console.log("Clearing old ValidationRules...");
  await ValidationRule.deleteMany({});
  
  console.log("Inserting new rules...");
  await ValidationRule.insertMany(newRules);
  
  console.log("20 validation rules successfully seeded to the database!");
  process.exit(0);
}

seedRules();
