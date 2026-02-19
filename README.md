# 💸 AI-Enhanced Expense Tracker with Trip Management

> A full-stack, AI-powered expense management system with trip planning, approval tracking, analytics dashboards, and machine learning predictions — built with React, Node.js, MongoDB, and Flask.


## Overview

The **AI-Enhanced Expense Tracker with Trip Management** is a three-service full-stack application designed to help individuals and teams:

- Record, categorize, and analyze expenses
- Plan and manage trips with budget tracking
- Track money given or taken (approvals/lending)
- Visualize spending through interactive dashboards
- Predict future expenses using machine learning models

The system is split into three independent services that communicate over HTTP, making it easy to develop, test, and scale each part independently.

| Service | Technology | Port |
|---|---|---|
| **Frontend** | React (Vite) + TailwindCSS | `5173` |
| **Backend** | Node.js + Express + MongoDB | `5000` |
| **AI Service** | Python + Flask + scikit-learn | `3001` |

---

## Features

### 🧾 Expense Management

- Add, view, update, and delete expenses
- Categorize expenses (food, travel, utilities, entertainment, etc.)
- Track payment methods (cash, card, UPI, etc.)
- Advanced filtering by:
  - Category
  - Payment method
  - Date range
  - Amount range
- Keyword search across expense descriptions
- Aggregated views:
  - Monthly summaries
  - Category totals with percentage breakdowns

### ✈️ Trip Management

- Create trips with destination, start/end dates, total budget, and notes
- View all trips sorted by start date
- Delete trips when no longer needed
- Foundation for future trip-expense linking and budget utilization tracking

### ✅ Approvals (Given / Taken)

- Track money lent or borrowed with full context:
  - Person involved
  - Transaction type: **given** or **taken**
  - Amount and date
  - Approval/settlement status
- Full CRUD operations on approval records
- Filter and retrieve individual approvals by ID

### 📊 Analytics & Dashboard

- Interactive home dashboard with:
  - Time-range switching (week / month / year)
  - Recent expenses at a glance
  - Upcoming trips preview
  - Category-based spending alerts (e.g., high spend in "Dining")
  - Quick action buttons for common tasks
- Visual charts powered by **Chart.js** and **Recharts**

### 🤖 AI Prediction Service (Flask)

- Train machine learning models using your expense history
- Predict the next likely expense amount based on:
  - Subject/description
  - Person/recipient
  - Date/month
- Compare predictions across multiple ML models
- Auto-selects best model or allows manual model specification
- Returns predicted amount with a confidence score

---

## Tech Stack

### Frontend
- **React** with **Vite** for fast development
- **React Router** for client-side navigation
- **TailwindCSS** for responsive, utility-first styling
- **Chart.js** + **Recharts** for data visualization
- **Axios** for HTTP requests to backend and AI service

### Backend
- **Node.js** + **Express** for REST API
- **MongoDB** + **Mongoose** for data persistence and schema modeling
- **dotenv** for environment configuration
- **cors** for cross-origin resource sharing

### AI Service
- **Python 3.9+** runtime
- **Flask** + **Flask-CORS** for REST microservice
- **scikit-learn** for ML model training and prediction
- **pandas** + **numpy** for data processing
- **joblib** for model serialization and persistence

## Prerequisites

Make sure you have the following installed before getting started:

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | LTS (18+ recommended) | Required for backend + frontend |
| **npm** | Bundled with Node.js | Package manager |
| **Python** | 3.9+ | Required for AI service |
| **pip** | Latest | Python package manager |
| **MongoDB** | 6.0+ | Local install or MongoDB Atlas |
| **Git** | Any | For cloning the repo |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/karranavya/AI-Enhanced-Expense-Tracker-with-Trip-Management.git
cd AI-Enhanced-Expense-Tracker-with-Trip-Management
```

---

### 2. Start MongoDB

**Option A — Local MongoDB:**
```bash
mongod
```
The backend defaults to `mongodb://localhost:27017/expense-tracker` if no `MONGODB_URI` is set.

**Option B — MongoDB Atlas (Cloud):**
Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), get your connection string, and set it in the backend `.env` file (see [Environment Variables](#environment-variables)).

---

### 3. Backend Setup (Node.js + Express)

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
NODE_ENV=development
```

Start the backend server:

```bash
# With auto-reload (recommended for development):
npx nodemon server.js

# Or with plain Node:
node server.js
```

The backend will be available at: **http://localhost:5000**

To verify it's running, visit: `http://localhost:5000/api/health`

---

### 4. AI Service Setup (Flask)

Open a **new terminal** and navigate to the AI service directory:

```bash
cd ai-service
```

Create and activate a Python virtual environment:

```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask service:

```bash
python app.py
```

The AI service will be available at: **http://127.0.0.1:3001**

To verify it's running, visit: `http://127.0.0.1:3001/health`

---

### 5. Frontend Setup (React + Vite)

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: **http://localhost:5173**

> **Note:** Vite's dev server uses port `5173` by default. The backend CORS configuration explicitly allows this origin.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `MONGODB_URI` | `mongodb://localhost:27017/expense-tracker` | MongoDB connection string |
| `NODE_ENV` | `development` | Environment mode |

### AI Service

The Flask service uses hardcoded defaults (`host=127.0.0.1`, `port=3001`). If you need to change the port, update `app.py` and make sure to update the corresponding API call URLs in the frontend.

---

## API Reference

### Backend API (Port 5000)

**Base URL:** `http://localhost:5000`

#### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns service status |

#### Expenses

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/expenses` | List all expenses (supports filters) |
| `POST` | `/api/add-expense` | Create a new expense |
| `PUT` | `/api/expenses/:id` | Update an existing expense |
| `DELETE` | `/api/expenses/:id` | Delete an expense |
| `GET` | `/api/expense-types` | Get all unique expense categories |
| `GET` | `/api/expenses/by-category` | Totals and percentages by category |
| `GET` | `/api/expenses/monthly-summary` | Aggregated monthly totals |
| `GET` | `/api/expenses/search?q=keyword` | Search expenses by keyword |

**Expense filter query parameters (for `GET /api/expenses`):**

| Parameter | Type | Description |
|---|---|---|
| `category` | string | Filter by expense category |
| `method` | string | Filter by payment method |
| `startDate` | date string | Filter from this date |
| `endDate` | date string | Filter up to this date |
| `minAmount` | number | Minimum amount filter |
| `maxAmount` | number | Maximum amount filter |

#### Trips

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips` | List all trips (sorted by start date) |
| `POST` | `/api/trips` | Create a new trip |
| `DELETE` | `/api/trips/:id` | Delete a trip by ID |

#### Approvals

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/approvals` | List all approvals |
| `POST` | `/api/approvals` | Create a new approval record |
| `GET` | `/api/approvals/:id` | Get a specific approval by ID |
| `PUT` | `/api/approvals/:id` | Update an approval (e.g., mark as settled) |
| `DELETE` | `/api/approvals/:id` | Delete an approval record |

---

### AI Service API (Port 3001)

**Base URL:** `http://127.0.0.1:3001`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check if AI service is running |
| `GET` | `/models/status` | View status of trained models |
| `POST` | `/train` | Train models on expense history |
| `POST` | `/predict` | Predict next expense amount |
| `POST` | `/predict/compare` | Compare predictions across all models |


---

## AI Prediction Workflow

The AI service follows a simple but effective pattern:

```
1. Frontend fetches expense history from backend
        ↓
2. Expense list is sent to AI service: POST /train
        ↓
3. AI service trains models on category, person, and month patterns
        ↓
4. User inputs a new expense context (description, person, date)
        ↓
5. Frontend sends: POST /predict
        ↓
6. AI service returns predicted amount + confidence score
        ↓
7. Frontend displays prediction to help user budget ahead
```

The `ExpensePredictor` orchestrator supports multiple model backends. When `"method": "auto"` is specified, the service automatically selects the best-performing model. Use `POST /predict/compare` to see predictions from all models side by side.

---

## Data Models

### Expense

| Field | Type | Description |
|---|---|---|
| `subject` | String | Description of the expense |
| `amount` | Number | Expense amount |
| `category` | String | Category (food, travel, utilities, etc.) |
| `date` | Date | Date of expense |
| `method` | String | Payment method (cash, card, UPI, etc.) |
| `to` | String | Payee or merchant |
| `notes` | String | Optional additional notes |

### Trip

| Field | Type | Description |
|---|---|---|
| `destination` | String | Trip destination |
| `startDate` | Date | Trip start date |
| `endDate` | Date | Trip end date |
| `budget` | Number | Planned budget for the trip |
| `notes` | String | Optional notes or itinerary details |

### Approval

| Field | Type | Description |
|---|---|---|
| `person` | String | Name of the other party |
| `type` | String | `"given"` or `"taken"` |
| `amount` | Number | Amount involved |
| `date` | Date | Date of the transaction |
| `approved` | Boolean | Whether it has been settled/approved |
| `notes` | String | Optional description |

---

## Troubleshooting

**CORS errors in the browser:**
The backend is configured to allow `http://localhost:5173` and a few other origins. If you're running the frontend on a different port, update the `cors` configuration in `backend/server.js` to include your origin.

**MongoDB connection failed:**
- Confirm MongoDB is running locally with `mongod` or that your Atlas cluster is accessible.
- Double-check the `MONGODB_URI` value in your `backend/.env` file.
- If using Atlas, make sure your IP address is whitelisted in the Atlas Network Access settings.

**AI service not responding:**
- Confirm the Flask service is running on port `3001`.
- Make sure you've activated the Python virtual environment before running `python app.py`.
- Verify all dependencies are installed: `pip install -r requirements.txt`.

**Frontend not loading data:**
- Confirm both the backend (`http://localhost:5000`) and MongoDB are running before starting the frontend.
- Check the browser console for any network errors pointing to failed API calls.

**Port conflicts:**
If any default port is already in use, change it in the respective `.env` file or startup command, and update the corresponding API base URL in the frontend's Axios configuration.

---



<div align="center">

Built with ❤️ using React, Node.js, MongoDB, and Flask

</div>
