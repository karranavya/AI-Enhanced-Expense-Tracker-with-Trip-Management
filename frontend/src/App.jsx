import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AddExpense from "./components/AddExpense";
import ExpenseList from "./components/ExpenseList";
// import RecentTrips from "./components/RecentTrips";
// import RecentExpenses from "./components/RecentExpenses";
// import QuickAccess from "./components/QuickAccess";
import HomeDashboard from "./components/HomeDashboard";
import AddTrip from "./components/AddTrip";
import TripList from "./components/TripList";
import ApprovalList from "./components/ApprovalList";
import AddApproval from "./components/AddApproval";
import TrackingDashboard from "./components/TrackingDashboard";
import PredictionsPage from "./components/PredictionPage";
import CategoryInsights from "./components/CategoryInsights";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);

  const deleteTrip = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/trips/${id}`, {
        method: "DELETE",
      });
      fetchTrips(); // Refresh the list
    } catch (err) {
      alert("Error deleting trip");
    }
  };

  // Fetch expenses from the backend
  const fetchExpenses = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/expenses");
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  // Fetch trips from the backend
  const fetchTrips = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/trips");
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  };

  // Add a new expense
  const addExpense = async (newExpense) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/add-expense",
        newExpense
      );
      setExpenses((prevExpenses) => [...prevExpenses, response.data]);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  // Add a new trip
  const addTrip = async (newTrip) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/add-trip",
        newTrip
      );
      setTrips((prevTrips) => [...prevTrips, response.data]);
    } catch (error) {
      console.error("Error adding trip:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchTrips();
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-[#000000] text-gray-300">
        <Sidebar />
        <div className="ml-64 flex-1 p-8">
          <Routes>
            <Route
              path="/"
              element={
                <HomeDashboard
                  expenses={expenses}
                  trips={trips}
                  onDeleteTrip={deleteTrip}
                />
              }
            />
            <Route
              path="/add-expense"
              element={<AddExpense addExpense={addExpense} />}
            />
            <Route
              path="/expenses"
              element={
                <ExpenseList
                  expenses={expenses}
                  fetchExpenses={fetchExpenses}
                />
              }
            />
            <Route path="/add-trip" element={<AddTrip addTrip={addTrip} />} />
            <Route
              path="/trips"
              element={<TripList trips={trips} fetchTrips={fetchTrips} />}
            />
            <Route path="/approvals" element={<ApprovalList />} />
            <Route path="/add-approval" element={<AddApproval />} />
            <Route path="/add-approval/:id" element={<AddApproval />} />
            <Route
              path="/tracking"
              element={<TrackingDashboard expenses={expenses} trips={trips} />}
            />

            <Route path="/category-insights" element={<CategoryInsights />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
