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

To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Environment Configurations
A centralized environment file has been created in the root directory: `.env`. 
You can customize the ports or connection keys:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_incidents
JWT_SECRET=supersecretrestaurantincidentreportingtoolkey_12345
JWT_EXPIRES_IN=7d
```

### 2. Launch the Backend Server
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Launch the development server:
   ```bash
   npm run dev
   ```
   *The server will start on http://localhost:5000/.*
   *Note: If MongoDB is running on your machine, it will connect. If not, it will display a warning and activate the local JSON DB fallback dynamically.*

### 3. Launch the Frontend React App
1. Open a new, separate terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the frontend packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client console will start. Click the local link displayed (usually http://localhost:5173/) to launch the app!*

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
