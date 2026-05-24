# Restaurant Incident Reporting Tool (IncidentHub)

A full-stack, responsive, and secure incident management console designed for restaurant operations. This tool allows store/restaurant staff to submit day-to-day operational issues (POS system failures, delivery delays, inventory shortage, kitchen equipment problems, customer complaints) and enables managers/admins to review, track, and resolve them.

---

## 🚀 Tech Stack

- **Frontend**: React.js, Vite.js, React Router v6, Lucide Icons
- **Backend**: Node.js, Express.js, JSON Web Tokens (JWT) for secure authentication, Bcrypt.js for credential hashing, CORS
- **Database**: MongoDB (via Mongoose ODM)
- **Fallback Database**: Persistent Local JSON Storage (automatically boots if MongoDB is offline)
- **Styling**: Vanilla CSS with Slate/Zinc colors, glassmorphic auth elements, and dynamic micro-animations.

---

## 🛠️ Key Features

1. **Secure Dual-Role Authentication**:
   - **Staff**: Can submit incident reports. Staff dashboards are locked to show only reports from their assigned store location.
   - **Manager**: Admin dashboard displays active counts, critical warnings, and cumulative statistics across all restaurant branches. Managers can inspect any report, modify statuses, write resolution logs, and delete logs.
2. **Dynamic Operations Center**:
   - Live KPI Metrics: Total, Active (Open + In Progress), Critical alerts, and Cumulative Resolution Rate.
   - Live filtering by Category, Severity, and Status.
   - Managers have an additional Location dropdown filter to audit specific store branches.
   - Live search matching incident titles and descriptions.
3. **Resilient Offline Fallback**:
   - Features a database handshake handler. If MongoDB is not active or installed on the system, the backend transparently launches in **Persistent JSON Fallback Mode**, saving all data directly inside `backend/data/*.json`. Endpoints and full CRUD tasks continue working seamlessly!

---

## ⚙️ Setup & Installation Instructions

This project is organized as an npm workspaces monorepo, which allows centralized dependency management during deployment while keeping local development modular and isolated.

To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Environment Configurations
A centralized environment file is located in the root directory: `.env`. 
You can customize the ports or connection keys:
```env
PORT=5000
MONGO_URI=replace_your_mongodb_url
JWT_SECRET=replace_yourjwtsecret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Launch the Backend Server Separately
1. Open a terminal, and navigate into the `backend` directory:
   ```bash
   cd backend
   ```
2. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://127.0.0.1:5000/`.*
   *Note: If MongoDB is active, the app will connect. Otherwise, it will automatically start in Persistent JSON Fallback mode.*

### 3. Launch the Frontend React App Separately
1. Open a separate terminal, and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the local packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The Vite client console will start. Click the local link displayed (usually `http://127.0.0.1:5173/`) to launch the app!*

---

## ☁️ Vercel Deployment Guide (Single-Domain Services)

This monorepo is configured for unified, single-domain Vercel deployment using **Vercel Services** (`experimentalServices`), routing the Vite React app and the Express API together:

- **Frontend**: Mounted at `/` (built using the Vite framework)
- **Backend API**: Mounted at `/_/backend` (served as serverless Node.js endpoints, responding at `/_/backend/api/...`)

### Configuration Details
1. **Workspaces Monorepo**: The root `package.json` specifies `"workspaces": ["frontend", "backend"]` alongside a root `package-lock.json`. This ensures that Vercel automatically detects the npm package manager, resolves dependencies correctly, and builds each service successfully.
2. **Vercel Manifest (`vercel.json`)**: Configures the services mapping (`entrypoint` and `routePrefix`) and pins the frontend framework as `vite`.
3. **Database Write Fallback**: The backend includes safety logic in `dbFallback.js` that detects the Vercel environment (`process.env.VERCEL`) and redirects local JSON mock database writes to the writable `/tmp` directory, preventing `Read-only file system (EROFS)` serverless crashes.

### Deployment Steps
To deploy the application to Vercel:
1. Link your repository in the Vercel dashboard.
2. **Crucial Setting**: Go to your Vercel Project Settings -> **General** -> scroll down to **Framework Preset** and select **"Services"** (instead of Vite or Other). This instructs Vercel to recognize the `experimentalServices` manifest in `vercel.json`.
3. Trigger the deployment. Vercel will install dependencies, build both services, and route the backend to `/_/backend` and the frontend to `/` under a single domain.

---

## 💡 Assumptions Made

1. **User Identity Binding**: When restaurant staff register, they are bound to a specific store location (e.g. Downtown Plaza). Any incident they report automatically defaults to that location to save form entry time and keep audits consistent.
2. **Access Security**: Staff should only focus on their store's logs. Only managers have permission to view across multiple locations, write resolution notes, delete records, or change statuses.
3. **Mock Fallback database**: To ensure standard reviews run without requiring complex MongoDB configurations, we assumed a high-fidelity JSON data layer is best to prevent connection failures.

---

## 📦 External Libraries & Services

- **bcryptjs**: Safe credential hashing in Node.js.
- **jsonwebtoken**: User identity tokenization for session tracking.
- **lucide-react**: Lightweight SVG React icons representing categories, statuses, and locations.
- **react-router-dom**: Responsive multi-page routing.
