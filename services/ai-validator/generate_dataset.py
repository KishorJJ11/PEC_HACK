import csv
import random
import uuid

regions = ['North East', 'North West', 'Yorkshire', 'West Midlands', 'East Midlands', 'South West', 'South East', 'London', 'Scotland', 'Wales']
educations = ['No formal qualification', 'GCSE', 'A-level', 'Degree', 'Master', 'PhD']
statuses = ['employed', 'unemployed', 'student', 'retired']

def generate_records(num_records):
    records = []
    for _ in range(num_records):
        record_id = f"HH-{random.choice(regions).split()[0].upper()}-{random.randint(1000, 9999)}"
        enumerator_id = f"E-{random.randint(1000, 1200)}"
        region = random.choice(regions)
        age = random.randint(16, 85)
        
        status = random.choice(statuses)
        if age < 18 and status == 'employed':
            # Create some anomalies for testing
            if random.random() < 0.2:
                income = random.randint(30000, 100000)
            else:
                income = random.randint(0, 5000)
        elif status == 'employed':
            income = random.randint(20000, 120000)
        elif status == 'retired':
            income = random.randint(10000, 40000)
        else:
            income = random.randint(0, 10000)
            
        education = random.choice(educations)
        
        records.append({
            'record_id': record_id,
            'enumerator_id': enumerator_id,
            'region': region,
            'age': age,
            'income': income,
            'education': education,
            'employment_status': status
        })
    return records

if __name__ == '__main__':
    filename = '10000_records.csv'
    records = generate_records(10000)
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['record_id', 'enumerator_id', 'region', 'age', 'income', 'education', 'employment_status'])
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Successfully generated {filename} with {len(records)} records.")
