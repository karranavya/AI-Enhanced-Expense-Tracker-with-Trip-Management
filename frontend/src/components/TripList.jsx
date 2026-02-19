import React, { useState, useEffect, useMemo } from "react";
import TripRow from "./TripRow";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  Filter,
  Plus,
  Search,
  X,
  Calendar,
  MapPin,
  Plane,
} from "lucide-react";

function TripList() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "desc",
  });

  const fetchTrips = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/trips");
      const data = await res.json();
      setTrips(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load trips");
      setLoading(false);
    }
  };

  const deleteTrip = async (id) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        await fetch(`http://localhost:5000/api/trips/${id}`, {
          method: "DELETE",
        });
        fetchTrips();
      } catch (err) {
        alert("Error deleting trip");
      }
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Get unique years and months
  const { years, months } = useMemo(() => {
    const yearsSet = new Set();
    const monthsSet = new Set();

    trips.forEach((trip) => {
      const date = new Date(trip.startDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      yearsSet.add(year);
      monthsSet.add(`${year}-${month}`);
    });

    return {
      years: Array.from(yearsSet).sort((a, b) => b - a),
      months: Array.from(monthsSet).sort().reverse(),
    };
  }, [trips]);

  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const date = new Date(trip.startDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const yearMonth = `${year}-${month}`;

      // Year filter
      if (selectedYear && year.toString() !== selectedYear) return false;

      // Month filter
      if (selectedMonth && yearMonth !== selectedMonth) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          trip.destination.toLowerCase().includes(query) ||
          trip.notes?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [trips, selectedYear, selectedMonth, searchQuery]);

  // Sort trips
  const sortedTrips = useMemo(() => {
    if (!sortConfig.key) return filteredTrips;

    return [...filteredTrips].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (["startDate", "endDate"].includes(sortConfig.key)) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortConfig.key === "budget") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTrips, sortConfig]);

  const totalBudget = sortedTrips.reduce(
    (sum, trip) => sum + parseFloat(trip.budget),
    0
  );
  const avgBudget =
    sortedTrips.length > 0 ? totalBudget / sortedTrips.length : 0;

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const clearFilters = () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSearchQuery("");
  };

  const SortHeader = ({ column, label }) => (
    <th className="p-3 text-left">
      <button
        onClick={() => requestSort(column)}
        className="flex items-center gap-1 hover:text-white transition-colors text-gray-400 font-medium"
      >
        {label}
        <ArrowUpDown
          className={`h-4 w-4 ${
            sortConfig.key === column ? "text-blue-500" : "text-gray-500"
          }`}
        />
      </button>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-black min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-500">Loading trips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Trips</h1>
              <p className="text-gray-400">
                {trips.length > 0
                  ? `${trips.length} total trips`
                  : "Start planning your adventures"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-blue-400">
            <h4 className="text-blue-400 font-semibold text-sm uppercase tracking-wide">
              Total Trips
            </h4>
            <p className="text-2xl font-bold text-white mt-2">
              {sortedTrips.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {sortedTrips.length !== trips.length &&
                `of ${trips.length} total`}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-green-400">
            <h4 className="text-green-400 font-semibold text-sm uppercase tracking-wide">
              Total Budget
            </h4>
            <p className="text-2xl font-bold text-white mt-2">
              ₹{totalBudget.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-gray-500 mt-1">across filtered trips</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-purple-400">
            <h4 className="text-purple-400 font-semibold text-sm uppercase tracking-wide">
              Average Budget
            </h4>
            <p className="text-2xl font-bold text-white mt-2">
              ₹{avgBudget.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">per trip</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-yellow-400">
            <h4 className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
              Next Trip
            </h4>
            <p className="text-lg font-bold text-white mt-2">
              {(() => {
                const upcomingTrips = sortedTrips.filter(
                  (trip) => new Date(trip.startDate) > new Date()
                );
                if (upcomingTrips.length > 0) {
                  const nextTrip = upcomingTrips.sort(
                    (a, b) => new Date(a.startDate) - new Date(b.startDate)
                  )[0];
                  return nextTrip.destination;
                }
                return "None planned";
              })()}
            </p>
            <p className="text-xs text-gray-500 mt-1">upcoming destination</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by destination or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Year Filter */}
            {years.length > 0 && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedMonth(""); // Reset month when year changes
                  }}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Filter */}
            {months.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {months
                  .filter(
                    (month) => !selectedYear || month.startsWith(selectedYear)
                  )
                  .map((month) => {
                    const [year, monthNum] = month.split("-");
                    const monthName = new Date(
                      `${year}-${monthNum}-01`
                    ).toLocaleString("default", { month: "long" });
                    return (
                      <option key={month} value={month}>
                        {`${monthName} ${year}`}
                      </option>
                    );
                  })}
              </select>
            )}

            {/* Clear Filters */}
            {(selectedYear || selectedMonth || searchQuery) && (
              <button
                onClick={clearFilters}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Filters */}
          {(selectedYear || selectedMonth || searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Active filters:
              </span>
              {selectedYear && (
                <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm border border-blue-700">
                  Year: {selectedYear}
                </span>
              )}
              {selectedMonth && (
                <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm border border-green-700">
                  Month:{" "}
                  {(() => {
                    const [year, monthNum] = selectedMonth.split("-");
                    const monthName = new Date(
                      `${year}-${monthNum}-01`
                    ).toLocaleString("default", { month: "long" });
                    return `${monthName} ${year}`;
                  })()}
                </span>
              )}
              {searchQuery && (
                <span className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded text-sm border border-yellow-700">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Trips Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {trips.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Trips Yet
              </h3>
              <p className="text-gray-400 mb-6">
                Start planning your adventures by adding your first trip.
              </p>
              <Link
                to="/add-trip"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
              >
                <Plane className="h-5 w-5" />
                Plan Your First Trip
              </Link>
            </div>
          ) : sortedTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No trips match your filters
              </h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your search or filters above.
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <SortHeader column="destination" label="Destination" />
                    <SortHeader column="startDate" label="Start Date" />
                    <SortHeader column="endDate" label="End Date" />
                    <SortHeader column="budget" label="Budget" />
                    <th className="p-3 text-left text-gray-400 font-medium">
                      Duration
                    </th>
                    <th className="p-3 text-left text-gray-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {sortedTrips.map((trip) => (
                    <TripRow key={trip._id} trip={trip} onDelete={deleteTrip} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        <Link
          to="/add-trip"
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 z-10 group"
          title="Add New Trip"
        >
          <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default TripList;
