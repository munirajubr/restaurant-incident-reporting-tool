# Restaurant Incident Reporting Tool (IncidentHub)

A full-stack, responsive, and secure incident management console designed for restaurant operations. This tool allows store/restaurant staff to submit day-to-day operational issues (POS system failures, delivery delays, inventory shortage, kitchen equipment problems, customer complaints) and enables managers/admins to review, track, and resolve them.

---

## 🚀 Tech Stack

- **Frontend**: React.js, Vite.js, React Router v6, Lucide Icons
- **Backend**: Node.js, Express.js, JSON Web Tokens (JWT) for secure authentication, Bcrypt.js for credential hashing, CORS
- **Database**: MongoDB (via Mongoose ODM)
- **Fallback Database**: Persistent Local JSON Storage (automatically boots if MongoDB is offline)
- **Styling**: Vanilla CSS designed with a premium warm gourmet orange-red (`#f25c22`) and charcoal-slate theme, glassmorphic auth elements, custom SVG chevron expansions, rotating spinner loaders, and responsive UI layout structures.

---

## 🛠️ Key Features

1. **🤖 Gemini AI Incident Resolution Engine (Concise & Self-Healing)**:
   - **Concise operational checks**: Dynamically calls Google Gemini AI using a self-healing candidate pipeline (`gemini-2.5-flash`, `gemini-2.0-flash`, or `gemini-1.5-flash`) to generate extremely concise operational resolution action steps (under 120 words with short one-sentence bullet points).
   - **Interactive Accordion Details**: Renders the entire AI resolution guide inside a custom collapsible card summary (`<details>`) utilizing a custom arrow SVG chevron (`M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z`) to indicate expansion. The text is parsed to auto-bold key subheadings (such as **Incident Resolution Plan** and **1. Immediate Action Plan:**) and globally strips all raw asterisks (`*`) and hash (`#`) symbols.
   - **Header Aligned Actions & Spinning Loader**: Features a borderless, backgroundless text button for "Generate Solution" and "Regenerate" neatly aligned inside the header summary. It utilizes event propagation isolation (`e.stopPropagation()`) so clicking it does not toggle accordion states. During loading, a dedicated rotating circular spinner (`.spinner-loader-small`) replaces linear bars for clean, smooth progress tracking.
   - **Status and Layout Constraints**: The entire AI resolution card is automatically hidden for solved/resolved incidents to keep screens clean. High-fidelity layouts include `flex-shrink: 0` overrides to prevent flex containers from squashing the guide when large base64 photo evidence attachments are loaded.
2. **🚨 Manager Alert Banners & Bell Notifications**:
   - Exclusive to Managers, a dynamic top-level **Console Warning Banner** displays active critical incidents requiring immediate operations attention.
   - A pulsing, glowing **Alerts Notification Bell** in the navbar updates in the background (every 15 seconds) showing active critical warnings count. Clicking the bell displays a dropdown panel with deep-links that inspect the warning instantly.
3. **📌 Active Pinned Incident Sorting**:
   - Automatically pins all unresolved Critical incidents (`status !== 'Resolved'` and `severity === 'Critical'`) to the absolute top of the table logs.
   - Features a custom crimson left-border glow and a glowing **📌 PINNED** badge to ensure critical alerts command immediate focus.
4. **🔐 Restricted Manager-Only Registration**:
   - Public "Create Account" paths are fully removed from the landing page.
   - Manager Dashboard contains a custom "Add User" slider drawer allowing managers to securely register new store staff or managers on the fly without breaking or resetting their own active login session.
5. **Resilient Offline Fallback & Offline Warning Handlers**:
   - Handshake handler automatically launches the system in **Persistent JSON Fallback Mode** (saving all logs inside `backend/data/*.json`) if MongoDB is offline.
   - Elegant toast alerts automatically warn the user of local network dropouts or "Failed to fetch" conditions.

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

## ☁️ Vercel Deployment Guide

This workspaces monorepo is deployed on Vercel as two separate projects — one for the frontend and one for the backend — each with its own domain.

- **Frontend**: Deployed as a standalone Vite project
- **Backend**: Deployed as a standalone Node.js/Express serverless project

---

### Deployment Steps

#### 1. Deploy the Backend
1. In the Vercel dashboard, import your repository.
2. Set the **Root Directory** to `backend` (or wherever your Express app lives).
3. Vercel will detect it as a Node.js project and deploy it as serverless endpoints.
4. Note the deployed URL (e.g. `https://your-backend.vercel.app`).

#### 2. Deploy the Frontend
1. Import the same repository again as a **new Vercel project**.
2. Set the **Root Directory** to `frontend` (or wherever your Vite app lives).
3. Add the following **Environment Variable** in Project Settings → Environment Variables:

---

### 💾 Database Write Fallback on Vercel
Both options include safety logic in `dbFallback.js` that detects the serverless Vercel environment (`process.env.VERCEL`) and redirects local JSON mock database writes to the writable `/tmp` directory, preventing `Read-only file system (EROFS)` crashes if MongoDB is offline.

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
