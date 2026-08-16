# Survey Validation Platform - Setup & Enhancements

This document outlines the setup, bug fixes, and architectural enhancements made to the Survey Validation Codebase to get it fully functional with a dynamic frontend, Node.js backend, and Python FastAPI AI validator.

## 🛠️ Infrastructure & Setup Fixes

### 1. Monorepo & Dependencies Configuration
- **Windows Compatibility:** Updated the root `package.json` `preinstall` script to `npx only-allow pnpm` for better cross-platform support.
- **PNPM Workspace:** Fixed `pnpm-workspace.yaml` by including the `services/*` directory and removing platform-specific overrides that broke native binary installations on Windows.
- **MongoDB Models Package:** Created a `package.json` in `services/mongodb-models` to correctly expose `mongoose` as a dependency, resolving `ERR_MODULE_NOT_FOUND` errors when starting the Node.js API.

### 2. Frontend Configuration
- **Vite Setup:** Modified `vite.config.js` to remove strict environment variable requirements (`PORT` and `BASE_PATH`) so the development server can start smoothly on local environments.
- **API Proxy:** Configured a local proxy in `vite.config.js` (`/api` -> `http://localhost:5000`) to resolve the `baseRows.filter is not a function` error, ensuring the React app correctly routes API requests to the Node backend instead of serving `index.html`.

## 📦 Data Generation & Seeding

### 1. Synthetic Dataset Generator
- Created `services/ai-validator/generate_dataset.py` to generate a realistic 10,000-row CSV file (`10000_records.csv`).
- Data includes randomized anomalies (e.g., underage individuals with high incomes) to specifically test the AI Validator's `IsolationForest` model.

### 2. Batch DB Seeder
- Created `seed_db.py` in the root directory.
- Uploads the 10,000 records via the backend API in chunks of 1,000 records to prevent network timeouts and connection resets, processing them through the FastAPI AI service before saving to MongoDB.

## 🔗 Backend API Enhancements

### 1. Database Security
- Created a `.env` file in `services/api-node` to store the MongoDB Atlas URI securely (`MONGODB_URI`).
- Appended `.env` to the root `.gitignore`.
- Updated `services/api-node/package.json` scripts (`dev` and `start`) to natively load environment variables using Node's `--env-file=.env` flag.

### 2. Dynamic Dashboard Endpoints
- **Upload Tracking:** Introduced the `UploadLog` mongoose schema (`services/mongodb-models/UploadLog.js`) to track total records processed, anomalies found, and high-risk counts per upload.
- **Summary Endpoint (`GET /api/summary`):** Added a new endpoint in `server.js` that aggregates data from `UploadLog` and `AnomalyRecord` to return live statistics (Total Records, Anomaly Rate, Regional Distribution) to the frontend Dashboard.
- **Validation Rules Endpoints (`GET /api/rules`, `POST /api/rules`):** Added endpoints to dynamically fetch and create validation rules stored in MongoDB.

## 🚀 How to Run the Application

1. **Start the Python AI Validator:**
   ```bash
   cd services/ai-validator
   pip install -r requirements.txt
   uvicorn main:app --port 8001
   ```

2. **Start the Node.js API:**
   ```bash
   cd services/api-node
   # Make sure you update .env with your MongoDB Cluster Host before starting!
   pnpm run dev
   ```

3. **Start the Frontend UI:**
   ```bash
   cd artifacts/survey-validation
   pnpm run dev
   ```

4. **Seed the 10k Records:**
   ```bash
   python seed_db.py
   ```
