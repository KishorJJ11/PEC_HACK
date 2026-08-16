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
    csv_content = header + "".join(batch)
    
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
