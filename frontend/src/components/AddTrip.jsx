import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  ArrowLeft,
  Plane,
} from "lucide-react";

function AddTrip() {
  const [form, setForm] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!form.destination.trim()) {
      setError("Destination is required");
      return false;
    }
    if (!form.startDate) {
      setError("Start date is required");
      return false;
    }
    if (!form.endDate) {
      setError("End date is required");
      return false;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setError("End date must be after start date");
      return false;
    }
    if (!form.budget || parseFloat(form.budget) <= 0) {
      setError("Budget must be a positive number");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: parseFloat(form.budget),
        }),
      });

      if (response.ok) {
        navigate("/trips");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add trip");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/trips"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trips
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-3 rounded-full">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Add New Trip</h1>
          </div>
          <p className="text-gray-400">
            Plan your next adventure and track your travel budget.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Destination */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <MapPin className="h-4 w-4 text-blue-400" />
                Destination
              </label>
              <input
                type="text"
                name="destination"
                value={form.destination}
                placeholder="e.g., Paris, France"
                onChange={handleChange}
                required
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Calendar className="h-4 w-4 text-green-400" />
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Calendar className="h-4 w-4 text-red-400" />
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                Budget (₹)
              </label>
              <input
                type="number"
                name="budget"
                value={form.budget}
                placeholder="e.g., 50000"
                onChange={handleChange}
                min="0"
                step="100"
                required
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <FileText className="h-4 w-4 text-purple-400" />
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={form.notes}
                placeholder="Add any additional notes about your trip..."
                onChange={handleChange}
                rows={3}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/trips")}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding Trip...
                </>
              ) : (
                <>
                  <Plane className="h-4 w-4" />
                  Add Trip
                </>
              )}
            </button>
          </div>
        </form>

        {/* Trip Duration Preview */}
        {form.startDate && form.endDate && (
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-blue-300 text-sm">
              Trip Duration:{" "}
              {Math.ceil(
                (new Date(form.endDate) - new Date(form.startDate)) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              days
            </p>
            {form.budget && (
              <p className="text-green-300 text-sm mt-1">
                Daily Budget: ₹
                {(
                  parseFloat(form.budget) /
                  Math.ceil(
                    (new Date(form.endDate) - new Date(form.startDate)) /
                      (1000 * 60 * 60 * 24)
                  )
                ).toFixed(0)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddTrip;
