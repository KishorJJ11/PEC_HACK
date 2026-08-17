import requests
import os
import time

csv_file_path = os.path.join("services", "ai-validator", "10000_records.csv")

with open(csv_file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

header = lines[0]
records = lines[1:]
batch_size = 1000

print(f"Total records to insert: {len(records)}")

for i in range(0, min(1000, len(records)), batch_size):
    batch = records[i:i+batch_size]
    import random
    
    tampered_batch = []
    for line in batch:
        parts = line.strip().split(',')
        if len(parts) < 7:
            tampered_batch.append(line)
            continue
            
        # record_id, enumerator_id, region, age, income, education, employment_status
        if random.random() < 0.15:
            scenario = random.randint(1, 4)
            if scenario == 1:
                # VR-20 & VR-18: Fabrication
                parts[3] = str(random.randint(20, 50)) # age
                parts[4] = str(random.choice([80000, 90000, 850000, 950000])) # income
            elif scenario == 2:
                # VR-09: Education Clash
                parts[4] = str(random.randint(20000, 50000)) # income
                parts[5] = "PhD"
                parts[6] = "unemployed"
            elif scenario == 3:
                # VR-01: Underage Employed
                parts[3] = str(random.randint(10, 14))
                parts[4] = str(random.randint(1000, 5000))
                parts[6] = "employed"
            else:
                # VR-08: Senior Employed
                parts[3] = str(random.randint(82, 95))
                parts[4] = str(random.randint(50000, 200000))
                parts[6] = "employed"
        elif random.random() < 0.2:
            # Medium Anomalies (Age heaping)
            parts[3] = str(random.choice([20, 25, 30, 35, 40, 45, 50, 55, 60]))
            
        tampered_batch.append(",".join(parts) + "\n")
        
    csv_content = header + "".join(tampered_batch)
    
    payload = {
        "fileName": f"batch_{i//batch_size}.csv",
        "csvContent": csv_content
    }
    
    print(f"Uploading batch {i//batch_size + 1}...")
    try:
        response = requests.post("http://127.0.0.1:5000/api/upload", json=payload)
        if response.status_code == 200:
            print(f"Success! {response.json()}")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
    time.sleep(1) # Small pause between batches
