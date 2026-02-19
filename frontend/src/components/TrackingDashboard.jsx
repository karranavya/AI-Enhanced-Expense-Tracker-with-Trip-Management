import React, { useMemo, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  Calendar,
  Tag,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

function formatMonth(dateStr) {
  let date;

  // Handle dd/mm/yyyy or dd-mm-yyyy
  if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split(/[\/-]/);
    date = new Date(`${year}-${month}-${day}`);
  } else {
    date = new Date(dateStr);
  }

  if (isNaN(date.getTime())) {
    console.error("Invalid date:", dateStr);
    return dateStr;
  }

  return date.toLocaleString("default", { month: "short" });
}

function getYear(dateStr) {
  let date;

  if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split(/[\/-]/);
    date = new Date(`${year}-${month}-${day}`);
  } else {
    date = new Date(dateStr);
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  return date.getFullYear();
}

function TrackingDashboard({ expenses = [], trips = [] }) {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("overview"); // overview, detailed, comparison

  // ✅ ADD: Helper function to get current month index
  const getCurrentMonthIndex = () => {
    const now = new Date();
    return now.getMonth(); // 0-11 (November = 10)
  };

  // ✅ ENHANCED: Get current month data with year awareness
  const getCurrentMonthData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // If filtering by specific year
    if (selectedYear !== "all") {
      const yearNum = parseInt(selectedYear);
      if (yearNum === currentYear) {
        // Current year: only show up to current month
        return { monthsToShow: currentMonth + 1, isCurrentYear: true };
      } else if (yearNum < currentYear) {
        // Past year: show all 12 months
        return { monthsToShow: 12, isCurrentYear: false };
      } else {
        // Future year: show no months (shouldn't happen)
        return { monthsToShow: 0, isCurrentYear: false };
      }
    } else {
      // "All years": show up to current month of current year
      return { monthsToShow: currentMonth + 1, isCurrentYear: true };
    }
  };

  // Process the data to ensure it's an array
  const processedExpenses = useMemo(() => {
    console.log("TrackingDashboard received expenses:", expenses);

    if (expenses && typeof expenses === "object" && expenses.expenses) {
      return Array.isArray(expenses.expenses) ? expenses.expenses : [];
    }
    if (Array.isArray(expenses)) {
      return expenses;
    }
    return [];
  }, [expenses]);

  const processedTrips = useMemo(() => {
    console.log("TrackingDashboard received trips:", trips);

    if (trips && typeof trips === "object" && trips.trips) {
      return Array.isArray(trips.trips) ? trips.trips : [];
    }
    if (Array.isArray(trips)) {
      return trips;
    }
    return [];
  }, [trips]);

  // Get available years and categories
  const availableYears = useMemo(() => {
    const years = new Set();

    processedExpenses.forEach((expense) => {
      const year = getYear(expense.date);
      if (year) years.add(year);
    });

    processedTrips.forEach((trip) => {
      const year = getYear(trip.startDate);
      if (year) years.add(year);
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [processedExpenses, processedTrips]);

  const availableCategories = useMemo(() => {
    const categories = new Set();
    processedExpenses.forEach((expense) => {
      const category = expense.expenseType || expense.subject || "Other";
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [processedExpenses]);

  // Filter data based on selections
  const filteredExpenses = useMemo(() => {
    return processedExpenses.filter((expense) => {
      const expenseYear = getYear(expense.date);
      const expenseCategory = expense.expenseType || expense.subject || "Other";

      const yearMatch =
        selectedYear === "all" || expenseYear === parseInt(selectedYear);
      const categoryMatch =
        selectedCategory === "all" || expenseCategory === selectedCategory;

      return yearMatch && categoryMatch;
    });
  }, [processedExpenses, selectedYear, selectedCategory]);

  const filteredTrips = useMemo(() => {
    return processedTrips.filter((trip) => {
      const tripYear = getYear(trip.startDate);
      const yearMatch =
        selectedYear === "all" || tripYear === parseInt(selectedYear);
      return yearMatch;
    });
  }, [processedTrips, selectedYear]);

  // Group data by month
  const expensesByMonth = useMemo(() => {
    const grouped = {};
    filteredExpenses.forEach((e) => {
      try {
        const month = formatMonth(e.date);
        const amount = parseFloat(e.amount) || 0;
        grouped[month] = (grouped[month] || 0) + amount;
      } catch (error) {
        console.error("Error processing expense:", e, error);
      }
    });
    return grouped;
  }, [filteredExpenses]);

  const tripsByMonth = useMemo(() => {
    const grouped = {};
    filteredTrips.forEach((t) => {
      try {
        const month = formatMonth(t.startDate);
        grouped[month] = (grouped[month] || 0) + 1;
      } catch (error) {
        console.error("Error processing trip:", t, error);
      }
    });
    return grouped;
  }, [filteredTrips]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    filteredExpenses.forEach((expense) => {
      const category = expense.expenseType || expense.subject || "Other";
      const amount = parseFloat(expense.amount) || 0;
      breakdown[category] = (breakdown[category] || 0) + amount;
    });

    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Create data for all 12 months
  const allMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // ✅ MODIFIED: Create data only up to current month (or all months for past years)
  const mergedData = useMemo(() => {
    const { monthsToShow, isCurrentYear } = getCurrentMonthData();

    // Only include relevant months based on current date and selected year
    const relevantMonths = allMonths.slice(0, monthsToShow);

    const data = relevantMonths.map((month) => ({
      month,
      amount: expensesByMonth[month] || 0,
      trips: tripsByMonth[month] || 0,
    }));

    console.log("📅 Chart data:", {
      selectedYear,
      monthsToShow,
      isCurrentYear,
      relevantMonths,
      dataPoints: data.length,
    });

    return data;
  }, [expensesByMonth, tripsByMonth, selectedYear]);

  // Calculate totals and averages
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + (parseFloat(expense.amount) || 0),
      0
    );
  }, [filteredExpenses]);

  const totalTrips = filteredTrips.length;

  // ✅ FIXED: Calculate averages based on relevant month count
  const { monthsToShow } = getCurrentMonthData();
  const avgExpensePerMonth = totalExpenses / monthsToShow;
  const avgTripsPerMonth = totalTrips / monthsToShow;
  const avgExpensePerTransaction = totalExpenses / filteredExpenses.length || 0;

  // ✅ IMPROVED: Month-over-month growth calculation
  // ✅ FIXED: Month-over-month growth calculation with better logic
  const monthlyGrowth = useMemo(() => {
    // Get the last two months that have data
    const monthsWithData = mergedData.filter((month) => month.amount > 0);

    if (monthsWithData.length < 2) return 0;

    const lastMonth = monthsWithData[monthsWithData.length - 1]; // November
    const prevMonth = monthsWithData[monthsWithData.length - 2]; // October

    console.log("📈 Growth Calculation:", {
      lastMonth: lastMonth.month,
      lastAmount: lastMonth.amount,
      prevMonth: prevMonth.month,
      prevAmount: prevMonth.amount,
    });

    if (prevMonth.amount === 0) return 0;

    const growth =
      ((lastMonth.amount - prevMonth.amount) / prevMonth.amount) * 100;

    console.log("📊 Calculated Growth:", growth.toFixed(2) + "%");

    return growth;
  }, [mergedData]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedYear("all");
    setSelectedCategory("all");
  }, []);

  // Colors for pie chart
  const COLORS = [
    "#60A5FA",
    "#34D399",
    "#F87171",
    "#FBBF24",
    "#A78BFA",
    "#FB7185",
    "#4ADE80",
    "#38BDF8",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl">
          <p className="text-gray-200 font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              style={{ color: entry.color }}
              className="font-semibold"
            >
              {entry.name}:{" "}
              {entry.dataKey === "amount"
                ? `₹${entry.value.toLocaleString()}`
                : `${entry.value} ${entry.value === 1 ? "trip" : "trips"}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-black min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            Expense & Trip Analytics Dashboard
          </h1>

          {/* Data Status Info */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm">
              📊 Showing: {filteredExpenses.length} expenses,{" "}
              {filteredTrips.length} trips
              {(selectedYear !== "all" || selectedCategory !== "all") && (
                <span className="text-blue-400 ml-2">
                  (filtered from {processedExpenses.length} expenses,{" "}
                  {processedTrips.length} trips)
                </span>
              )}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              📈 Chart shows {mergedData.length} months of data
              {selectedYear === "all" && " (up to current month)"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Year Filter */}
              {availableYears.length > 0 && (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-32"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-40"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("overview")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "overview"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setViewMode("detailed")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "detailed"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Detailed
                </button>
                <button
                  onClick={() => setViewMode("comparison")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "comparison"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Categories
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedYear !== "all" || selectedCategory !== "all") && (
              <button
                onClick={clearFilters}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {(selectedYear !== "all" || selectedCategory !== "all") && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Active filters:
              </span>
              {selectedYear !== "all" && (
                <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm border border-blue-700">
                  Year: {selectedYear}
                </span>
              )}
              {selectedCategory !== "all" && (
                <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm border border-purple-700">
                  Category: {selectedCategory}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-blue-400 font-semibold text-sm uppercase tracking-wide">
                  Total Expenses
                </h4>
                <p className="text-2xl font-bold text-white mt-2">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredExpenses.length} transactions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-green-400 font-semibold text-sm uppercase tracking-wide">
                  Total Trips
                </h4>
                <p className="text-2xl font-bold text-white mt-2">
                  {totalTrips}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalTrips === 1 ? "trip" : "trips"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-purple-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-purple-400 font-semibold text-sm uppercase tracking-wide">
                  Avg per Transaction
                </h4>
                <p className="text-2xl font-bold text-white mt-2">
                  ₹
                  {avgExpensePerTransaction.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">per expense</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-orange-400 font-semibold text-sm uppercase tracking-wide">
                  Monthly Average
                </h4>
                <p className="text-2xl font-bold text-white mt-2">
                  ₹
                  {avgExpensePerMonth.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  per month ({monthsToShow} months)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
                  Monthly Growth
                </h4>
                <p className="text-2xl font-bold text-white mt-2 flex items-center gap-1">
                  {monthlyGrowth > 0 && (
                    <TrendingUp className="h-5 w-5 text-red-400" />
                  )}
                  {monthlyGrowth < 0 && (
                    <TrendingDown className="h-5 w-5 text-green-400" />
                  )}
                  {monthlyGrowth === 0 && (
                    <Minus className="h-5 w-5 text-gray-400" />
                  )}
                  <span
                    className={
                      monthlyGrowth > 0
                        ? "text-red-400"
                        : monthlyGrowth < 0
                        ? "text-green-400"
                        : "text-gray-400"
                    }
                  >
                    {monthlyGrowth > 0 ? "+" : ""}
                    {Math.abs(monthlyGrowth).toFixed(1)}%
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  vs last month
                  {(() => {
                    const monthsWithData = mergedData.filter(
                      (m) => m.amount > 0
                    );
                    if (monthsWithData.length >= 2) {
                      const current =
                        monthsWithData[monthsWithData.length - 1].month;
                      const previous =
                        monthsWithData[monthsWithData.length - 2].month;
                      return ` (${current} vs ${previous})`;
                    }
                    return "";
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        {filteredExpenses.length === 0 && filteredTrips.length === 0 && (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {processedExpenses.length === 0
                ? "No Data Available"
                : "No Data for Selected Filters"}
            </h3>
            <p className="text-gray-400 mb-6">
              {processedExpenses.length === 0
                ? "Add some expenses and trips to see your analytics dashboard."
                : "Try adjusting your filters to see more data."}
            </p>
            <div className="flex gap-4 justify-center">
              {processedExpenses.length === 0 ? (
                <>
                  <a
                    href="/add-expense"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Expense
                  </a>
                  <a
                    href="/trips"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Trip
                  </a>
                </>
              ) : (
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Charts - Only show if we have data */}
        {(filteredExpenses.length > 0 || filteredTrips.length > 0) && (
          <div className="space-y-8">
            {/* Overview Mode */}
            {viewMode === "overview" && (
              <>
                {/* Combined Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Monthly Trend Analysis
                    {(selectedYear !== "all" || selectedCategory !== "all") && (
                      <span className="text-lg font-normal text-gray-400 ml-2">
                        ({selectedYear !== "all" ? selectedYear : "All Years"}
                        {selectedCategory !== "all" && ` • ${selectedCategory}`}
                        )
                      </span>
                    )}
                  </h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart
                      data={mergedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <defs>
                        <linearGradient
                          id="expenseGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#60A5FA"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#60A5FA"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                        axisLine={{ stroke: "#6B7280" }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                        axisLine={{ stroke: "#6B7280" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{
                          paddingTop: "20px",
                          color: "#9CA3AF",
                        }}
                      />
                      {filteredExpenses.length > 0 && (
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#60A5FA"
                          fill="url(#expenseGradient)"
                          name="Monthly Expenses (₹)"
                          strokeWidth={3}
                        />
                      )}
                      {filteredTrips.length > 0 && (
                        <Line
                          type="monotone"
                          dataKey="trips"
                          stroke="#34D399"
                          name="Monthly Trips"
                          strokeWidth={3}
                          dot={{ fill: "#34D399", strokeWidth: 2, r: 6 }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Detailed Mode */}
            {viewMode === "detailed" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Expenses Chart */}
                {filteredExpenses.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">
                      Monthly Expenses Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart
                        data={mergedData}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="month"
                          stroke="#9CA3AF"
                          tick={{ fill: "#9CA3AF", fontSize: 12 }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: "#9CA3AF", fontSize: 12 }}
                          tickFormatter={(value) =>
                            `₹${value.toLocaleString()}`
                          }
                        />
                        <Tooltip
                          formatter={(value) => [
                            `₹${value.toLocaleString()}`,
                            "Expenses",
                          ]}
                          labelStyle={{ color: "#E5E7EB" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#60A5FA"
                          name="Expenses"
                          strokeWidth={3}
                          dot={{
                            fill: "#60A5FA",
                            r: 6,
                            stroke: "#1F2937",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 8,
                            stroke: "#60A5FA",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Trips Chart */}
                {filteredTrips.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">
                      Monthly Trips
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={mergedData}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="month"
                          stroke="#9CA3AF"
                          tick={{ fill: "#9CA3AF", fontSize: 12 }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: "#9CA3AF", fontSize: 12 }}
                          allowDecimals={false}
                          domain={[
                            0,
                            Math.max(...mergedData.map((d) => d.trips)) + 1,
                          ]}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const tripCount = payload[0].value;
                              return (
                                <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-xl">
                                  <p className="text-gray-200 font-medium">
                                    {label}
                                  </p>
                                  <p className="font-semibold text-green-400">
                                    {tripCount}{" "}
                                    {tripCount === 1 ? "trip" : "trips"}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="trips"
                          fill="#34D399"
                          name="Trips"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Categories Mode */}
            {viewMode === "comparison" && categoryBreakdown.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Pie Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">
                    Expense Distribution by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={40}
                        paddingAngle={2}
                        label={({ category, percent }) =>
                          `${category}: ${(percent * 100).toFixed(1)}%`
                        }
                        labelLine={false}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `₹${value.toLocaleString()}`,
                          "Amount",
                        ]}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#E5E7EB",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Bar Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">
                    Category Spending Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={categoryBreakdown}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="category"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          `₹${value.toLocaleString()}`,
                          "Amount",
                        ]}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#E5E7EB",
                        }}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Data Summary Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-4">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                {viewMode === "comparison"
                  ? "Category Breakdown"
                  : "Monthly Summary"}
                {(selectedYear !== "all" || selectedCategory !== "all") && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    (Filtered View)
                  </span>
                )}
              </h3>
              <div className="overflow-x-auto">
                {viewMode === "comparison" ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-gray-400">
                          Category
                        </th>
                        <th className="text-right p-2 text-gray-400">
                          Amount (₹)
                        </th>
                        <th className="text-right p-2 text-gray-400">
                          % of Total
                        </th>
                        <th className="text-right p-2 text-gray-400">
                          Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryBreakdown.map((category, index) => {
                        const categoryExpenses = filteredExpenses.filter(
                          (e) =>
                            (e.expenseType || e.subject || "Other") ===
                            category.category
                        );
                        const percentage =
                          (category.amount / totalExpenses) * 100;

                        return (
                          <tr
                            key={category.category}
                            className="border-b border-gray-800"
                          >
                            <td className="p-2 text-white font-medium flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                              {category.category}
                            </td>
                            <td className="p-2 text-right text-blue-400">
                              ₹{category.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2 text-right text-green-400">
                              {percentage.toFixed(1)}%
                            </td>
                            <td className="p-2 text-right text-gray-300">
                              {categoryExpenses.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-gray-400">Month</th>
                        <th className="text-right p-2 text-gray-400">
                          Expenses (₹)
                        </th>
                        <th className="text-right p-2 text-gray-400">Trips</th>
                        <th className="text-right p-2 text-gray-400">
                          Avg per Day
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergedData
                        .filter((month) => month.amount > 0 || month.trips > 0)
                        .map((monthData) => (
                          <tr
                            key={monthData.month}
                            className="border-b border-gray-800"
                          >
                            <td className="p-2 text-white font-medium">
                              {monthData.month}
                            </td>
                            <td className="p-2 text-right text-blue-400">
                              ₹{monthData.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2 text-right text-green-400">
                              {monthData.trips}{" "}
                              {monthData.trips === 1 ? "trip" : "trips"}
                            </td>
                            <td className="p-2 text-right text-purple-400">
                              ₹
                              {Math.round(monthData.amount / 30).toLocaleString(
                                "en-IN"
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackingDashboard;
