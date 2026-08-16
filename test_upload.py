import requests

csv_content = """record_id,enumerator_id,region,age,income,education,employment_status
HH-1,E-1,North East,17,50000,GCSE,employed
HH-2,E-1,North East,40,20000,Degree,employed
"""

payload = {
    "fileName": "test.csv",
    "csvContent": csv_content
}

try:
    response = requests.post("http://localhost:5000/api/upload", json=payload)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
