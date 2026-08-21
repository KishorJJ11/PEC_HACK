import requests
import random
import time
from datetime import datetime, timedelta

def generate_csv_batch(batch_index, batch_size):
    headers = [
        "record_id", "enumerator_id", "region", "age", "income", "education", 
        "employment_status", "years_experience", "household_size", "monthly_expenses", 
        "work_hours", "gender", "maternity_leave", "industry", "occupation", 
        "submission_time", "gps_location", "pin_code", "family_members"
    ]
    
    rows = [",".join(headers)]
    
    for i in range(batch_size):
        rec_id = f"REC-{batch_index * batch_size + i + 1:05d}"
        
        # Base normal data
        enum_id = f"ENUM-{random.randint(100, 105)}" # Tight pool to trigger grouping anomalies easily
        region = random.choice(["North", "South", "East", "West", "Central"])
        age = random.randint(18, 59)
        # 10% chance of missing income
        income = 0 if random.random() < 0.1 else random.randint(5000, 50000)
        education = random.choice(["High School", "Diploma", "Degree"])
        emp_status = random.choice(["employed", "unemployed", "retired"])
        y_exp = max(0, age - 20)
        hh_size = random.randint(1, 6)
        expenses = random.randint(2000, 20000)
        hours = random.randint(0, 50) if emp_status == "employed" else 0
        gender = random.choice(["Male", "Female"])
        mat_leave = "false"
        industry = random.choice(["Tech", "Healthcare", "Retail", "Finance", "Construction"])
        occupation = random.choice(["Teacher", "Developer", "Farmer", "Clerk"])
        
        # Random historical time in past 14 days, during day time
        days_ago = random.randint(0, 14)
        hour = random.randint(8, 20)
        sub_time = (datetime.utcnow() - timedelta(days=days_ago)).replace(hour=hour, minute=0, second=0).isoformat() + "Z"
        
        gps = "12.97,77.59"
        pin = "560001"
        fam_members = hh_size
        
        # 30% chance of injecting a specific anomaly
        if random.random() < 0.3:
            anomaly_type = random.randint(1, 20)
            
            if anomaly_type == 20: income = 850000 # VR-20
            elif anomaly_type == 19: age = 30 # VR-19
            elif anomaly_type == 18: expenses = income # VR-18
            elif anomaly_type == 17: income = 9999999 # VR-17
            elif anomaly_type == 16: region = "HistoricalAnomalyZone" # VR-16
            elif anomaly_type == 15: sub_time = "1970-01-01T00:00:00Z" # VR-15
            elif anomaly_type == 14: # VR-14 
                # Already normal, but let's ensure income = 0 doesn't happen
                income = max(100, income) 
            elif anomaly_type == 13: sub_time = (datetime.utcnow() - timedelta(days=1)).replace(hour=3).isoformat() + "Z" # VR-13
            elif anomaly_type == 12: fam_members = 4; enum_id = "ENUM-COPY-CAT" # VR-12
            elif anomaly_type == 11: gps = "-12.9,77.5"; pin = "110001" # VR-11
            elif anomaly_type == 10: y_exp = age - 5 # VR-10
            elif anomaly_type == 9: education = "PhD"; emp_status = "unemployed" # VR-09
            elif anomaly_type == 8: gender = "Male"; mat_leave = "true" # VR-08
            elif anomaly_type == 7: hh_size = 12; expenses = 500 # VR-07
            elif anomaly_type == 6: industry = "Agriculture"; occupation = "Software Developer" # VR-06
            elif anomaly_type == 5: region = "GhostZone"; age = random.randint(20, 50) # VR-05
            elif anomaly_type == 4: region = "TechZone"; industry = "Tech" # VR-04
            elif anomaly_type == 3: emp_status = "unemployed"; hours = 45 # VR-03
            elif anomaly_type == 2: hours = 120 # VR-02
            elif anomaly_type == 1: age = 12; emp_status = "employed" # VR-01

        # VR-14 Force: Make one enumerator completely perfect
        if enum_id == "ENUM-100":
            income = max(100, income)

        # VR-05 Force: GhostZone never has kids
        if region == "GhostZone":
            age = max(20, age)
            
        # VR-04 Force: TechZone is 100% Tech
        if region == "TechZone":
            industry = "Tech"

        row = [
            rec_id, enum_id, region, str(age), str(income), education, emp_status,
            str(y_exp), str(hh_size), str(expenses), str(hours), gender,
            mat_leave, industry, occupation, sub_time, gps, pin, str(fam_members)
        ]
        rows.append(",".join(row))
        
    return "\n".join(rows)

print(f"Generating and inserting 1000 records with full 20-Rule anomalies...")

csv_content = generate_csv_batch(0, 1000)
payload = {
    "fileName": "hackathon_demo_batch.csv",
    "csvContent": csv_content
}

try:
    response = requests.post("http://127.0.0.1:5000/api/upload", json=payload)
    if response.status_code == 200:
        print(f"Success! {response.json()}")
    else:
        print(f"Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"Failed to connect to backend: {e}")
