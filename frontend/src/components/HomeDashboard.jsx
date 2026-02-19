import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Plane,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  AlertTriangle,
  Plus,
  Eye,
  BarChart3,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function HomeDashboard({ expenses = [], trips = [], onDeleteTrip = () => {} }) {
  const [timeRange, setTimeRange] = useState("month");

  // ✅ FIXED: Date parsing function for DD/MM/YYYY format
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle ISO format (trips use this)
    if (dateStr.includes("T") || dateStr.includes("-")) {
      return new Date(dateStr);
    }

    // Handle DD/MM/YYYY format (expenses use this)
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }

    // Fallback to normal parsing
    return new Date(dateStr);
  };

  // Process expenses data
  const expenseArray = useMemo(() => {
    let processedExpenses = [];

    if (Array.isArray(expenses)) {
      processedExpenses = expenses;
    } else if (expenses && typeof expenses === "object" && expenses.expenses) {
      processedExpenses = expenses.expenses;
    }

    return processedExpenses;
  }, [expenses]);

  // Process trips data
  const tripArray = useMemo(() => {
    let processedTrips = [];

    if (Array.isArray(trips)) {
      processedTrips = trips;
    } else if (trips && typeof trips === "object" && trips.trips) {
      processedTrips = trips.trips;
    }

    return processedTrips;
  }, [trips]);

  // Date ranges calculation
  const dateRanges = useMemo(() => {
    const now = new Date();

    // Current month: November 1, 2025 to November 30, 2025
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Current week: Sunday to Saturday
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Current year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    return {
      month: { start: startOfMonth, end: endOfMonth },
      week: { start: startOfWeek, end: endOfWeek },
      year: { start: startOfYear, end: endOfYear },
    };
  }, []);

  // ✅ FIXED: Better filtering with proper date parsing
  const getFilteredData = (data, timeRange) => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const { start, end } = dateRanges[timeRange];

    return data.filter((item) => {
      const dateStr = item.date || item.startDate || item.createdAt;
      const itemDate = parseDate(dateStr);

      if (!itemDate || isNaN(itemDate.getTime())) {
        return false;
      }

      return itemDate >= start && itemDate <= end;
    });
  };

  const filteredExpenses = getFilteredData(expenseArray, timeRange);
  const filteredTrips = getFilteredData(tripArray, timeRange);

  // ✅ ENHANCED: Calculate metrics properly
  const metrics = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + (parseFloat(exp.amount) || 0),
      0
    );

    const totalTrips = filteredTrips.length;
    const totalTripBudget = filteredTrips.reduce(
      (sum, trip) => sum + (parseFloat(trip.budget) || 0),
      0
    );

    // Previous period calculation
    const getPreviousPeriodExpenses = () => {
      let prevStart, prevEnd;
      const now = new Date();

      if (timeRange === "month") {
        const prevMonth = now.getMonth() - 1;
        const year = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const month = prevMonth < 0 ? 11 : prevMonth;
        prevStart = new Date(year, month, 1);
        prevEnd = new Date(year, month + 1, 0);
      } else if (timeRange === "week") {
        const prevWeekStart = new Date(dateRanges.week.start);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(prevWeekStart);
        prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
        prevStart = prevWeekStart;
        prevEnd = prevWeekEnd;
      } else {
        prevStart = new Date(now.getFullYear() - 1, 0, 1);
        prevEnd = new Date(now.getFullYear() - 1, 11, 31);
      }

      return expenseArray.filter((exp) => {
        const expDate = parseDate(exp.date);
        return expDate && expDate >= prevStart && expDate <= prevEnd;
      });
    };

    const prevPeriodExpenses = getPreviousPeriodExpenses();
    const prevTotal = prevPeriodExpenses.reduce(
      (sum, exp) => sum + (parseFloat(exp.amount) || 0),
      0
    );
    const expenseGrowth =
      prevTotal > 0 ? ((totalExpenses - prevTotal) / prevTotal) * 100 : 0;

    // Categories calculation
    const categories = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.expenseType || exp.category || exp.subject || "Other";
      categories[cat] = (categories[cat] || 0) + (parseFloat(exp.amount) || 0);
    });

    const sortedCategories = Object.entries(categories).sort(
      ([, a], [, b]) => b - a
    );
    const topCategory = sortedCategories[0];

    return {
      totalExpenses,
      totalTrips,
      totalTripBudget,
      expenseGrowth,
      avgExpense:
        filteredExpenses.length > 0
          ? totalExpenses / filteredExpenses.length
          : 0,
      topCategory: topCategory ? topCategory[0] : "None",
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      transactionCount: filteredExpenses.length,
      categories: sortedCategories,
    };
  }, [filteredExpenses, filteredTrips, expenseArray, timeRange, dateRanges]);

  // Category alert
  const categoryAlert = useMemo(() => {
    if (
      timeRange === "month" &&
      metrics.topCategory &&
      metrics.topCategory !== "None"
    ) {
      const percentage =
        metrics.totalExpenses > 0
          ? (metrics.topCategoryAmount / metrics.totalExpenses) * 100
          : 0;

      if (percentage > 40) {
        return {
          show: true,
          message: `High spending alert: ${
            metrics.topCategory
          } accounts for ${percentage.toFixed(1)}% of your monthly expenses!`,
          category: metrics.topCategory,
          percentage: percentage.toFixed(1),
        };
      }
    }
    return { show: false };
  }, [metrics, timeRange]);

  // Upcoming trips
  const upcomingTrips = useMemo(() => {
    const now = new Date();
    return tripArray
      .filter((trip) => {
        const startDate = parseDate(trip.startDate);
        return startDate && !isNaN(startDate.getTime()) && startDate > now;
      })
      .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))
      .slice(0, 5);
  }, [tripArray]);

  // Next trip alert
  const nextTripAlert = useMemo(() => {
    if (upcomingTrips.length > 0) {
      const nextTrip = upcomingTrips[0];
      const startDate = parseDate(nextTrip.startDate);
      const daysUntil = Math.ceil(
        (startDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 7) {
        return {
          show: true,
          message: `Your trip to ${
            nextTrip.destination
          } is coming up in ${daysUntil} day${daysUntil > 1 ? "s" : ""}!`,
          destination: nextTrip.destination,
          days: daysUntil,
        };
      }
    }
    return { show: false };
  }, [upcomingTrips]);

  // Recent data
  const recentExpenses = expenseArray
    .filter((exp) => exp.date && parseDate(exp.date))
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    .slice(0, 5);

  const recentTrips = tripArray
    .filter((trip) => trip.startDate && parseDate(trip.startDate))
    .sort((a, b) => parseDate(b.startDate) - parseDate(a.startDate))
    .slice(0, 3);

  // Format currency
  const formatCurrency = (amount) =>
    `₹${Math.abs(amount).toLocaleString("en-IN")}`;

  // Growth indicator
  const GrowthIndicator = ({ value }) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-red-400" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-green-400" />;
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  // Debug log
  console.log("📊 FINAL DASHBOARD METRICS:", {
    timeRange,
    filteredExpenses: filteredExpenses.length,
    totalAmount: metrics.totalExpenses,
    topCategory: metrics.topCategory,
    upcomingTrips: upcomingTrips.length,
  });

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Welcome back! 👋
              </h1>
              <p className="text-gray-400 mt-2">
                Here's your financial overview for{" "}
                {timeRange === "month"
                  ? "this month"
                  : timeRange === "week"
                  ? "this week"
                  : "this year"}
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {["week", "month", "year"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    timeRange === range
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Alert */}
        {categoryAlert.show && (
          <div className="mb-6 bg-gradient-to-r from-orange-900 to-red-900 border border-orange-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
              <div>
                <p className="text-orange-100 font-semibold">Spending Alert</p>
                <p className="text-orange-200 text-sm">
                  {categoryAlert.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Trip Alert */}
        {nextTripAlert.show && (
          <div className="mb-6 bg-gradient-to-r from-indigo-900 to-blue-900 border border-indigo-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Plane className="h-6 w-6 text-indigo-400" />
              <div>
                <p className="text-indigo-100 font-semibold">Trip Reminder</p>
                <p className="text-indigo-200 text-sm">
                  {nextTripAlert.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Expenses */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-blue-400">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <GrowthIndicator value={metrics.expenseGrowth} />
            </div>
            <h3 className="text-blue-400 font-semibold text-sm uppercase tracking-wide">
              Total Expenses
            </h3>
            <p className="text-3xl font-bold text-white mt-2">
              {formatCurrency(metrics.totalExpenses)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {metrics.transactionCount} transactions
              {metrics.expenseGrowth !== 0 && (
                <span
                  className={`ml-2 ${
                    metrics.expenseGrowth > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {metrics.expenseGrowth > 0 ? "+" : ""}
                  {metrics.expenseGrowth.toFixed(1)}%
                </span>
              )}
            </p>
          </div>

          {/* Total Trips */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-green-400">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-600 p-3 rounded-full">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <MapPin className="h-4 w-4 text-green-400" />
            </div>
            <h3 className="text-green-400 font-semibold text-sm uppercase tracking-wide">
              Total Trips
            </h3>
            <p className="text-3xl font-bold text-white mt-2">
              {metrics.totalTrips}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(metrics.totalTripBudget)} budget
            </p>
          </div>

          {/* Upcoming Trips */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-indigo-400">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-600 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
            <h3 className="text-indigo-400 font-semibold text-sm uppercase tracking-wide">
              Upcoming Trips
            </h3>
            <p className="text-3xl font-bold text-white mt-2">
              {upcomingTrips.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {upcomingTrips.length > 0
                ? `Next: ${upcomingTrips[0].destination}`
                : "No trips planned"}
            </p>
          </div>

          {/* Average Expense */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-purple-400">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-600 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <Target className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-purple-400 font-semibold text-sm uppercase tracking-wide">
              Avg per Transaction
            </h3>
            <p className="text-3xl font-bold text-white mt-2">
              {formatCurrency(metrics.avgExpense)}
            </p>
            <p className="text-xs text-gray-400 mt-1">per expense</p>
          </div>

          {/* Top Category */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-600 p-3 rounded-full">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-4 w-4 text-yellow-400" />
            </div>
            <h3 className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
              Top Category
            </h3>
            <p className="text-xl font-bold text-white mt-2 truncate">
              {metrics.topCategory}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(metrics.topCategoryAmount)}
              {metrics.totalExpenses > 0 && (
                <span className="ml-1">
                  (
                  {(
                    (metrics.topCategoryAmount / metrics.totalExpenses) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/add-expense"
              className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-4 rounded-lg flex items-center gap-3 transition-all transform hover:scale-105 group"
            >
              <CreditCard className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
              <div>
                <p className="font-semibold text-white">Add Expense</p>
                <p className="text-xs text-blue-100">Track new spending</p>
              </div>
            </Link>

            <Link
              to="/add-trip"
              className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 p-4 rounded-lg flex items-center gap-3 transition-all transform hover:scale-105 group"
            >
              <Plane className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
              <div>
                <p className="font-semibold text-white">Plan Trip</p>
                <p className="text-xs text-green-100">Create new journey</p>
              </div>
            </Link>

            <Link
              to="/expenses"
              className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 p-4 rounded-lg flex items-center gap-3 transition-all transform hover:scale-105 group"
            >
              <Eye className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold text-white">View Expenses</p>
                <p className="text-xs text-purple-100">See all transactions</p>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 p-4 rounded-lg flex items-center gap-3 transition-all transform hover:scale-105 group"
            >
              <BarChart3 className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
              <div>
                <p className="font-semibold text-white">Analytics</p>
                <p className="text-xs text-yellow-100">View insights</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity & Upcoming Trips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Expenses */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Recent Expenses
              </h2>
              <Link
                to="/expenses"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense, index) => (
                  <div
                    key={expense._id || index}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {expense.description || expense.subject || "Expense"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {expense.to} •{" "}
                          {parseDate(expense.date)?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {expense.expenseType || expense.subject || "Other"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">No recent expenses</p>
                <Link
                  to="/add-expense"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Add your first expense
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Trips */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-400" />
                Upcoming Trips
              </h2>
              <Link
                to="/add-trip"
                className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Trip
              </Link>
            </div>

            {upcomingTrips.length > 0 ? (
              <div className="space-y-3">
                {upcomingTrips.map((trip, index) => {
                  const startDate = parseDate(trip.startDate);
                  const endDate = parseDate(trip.endDate);
                  const daysUntil = startDate
                    ? Math.ceil(
                        (startDate - new Date()) / (1000 * 60 * 60 * 24)
                      )
                    : 0;
                  const duration =
                    startDate && endDate
                      ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
                      : 0;

                  return (
                    <div
                      key={trip._id || index}
                      className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border-l-2 border-green-400"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <p className="font-medium text-white truncate">
                          {trip.destination}
                        </p>
                        {daysUntil <= 7 && daysUntil > 0 && (
                          <span className="bg-orange-600 text-white px-2 py-1 text-xs rounded-full">
                            Soon!
                          </span>
                        )}
                      </div>

                      {startDate && endDate && (
                        <p className="text-sm text-gray-400 mb-2">
                          {startDate.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -
                          {endDate.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {daysUntil > 0 && (
                            <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
                              {daysUntil} day{daysUntil !== 1 ? "s" : ""} away
                            </span>
                          )}
                          {duration > 0 && (
                            <span className="text-xs text-gray-500">
                              {duration} day{duration !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-green-400">
                          {formatCurrency(trip.budget)}
                        </span>
                      </div>

                      {trip.notes && (
                        <p className="text-xs text-gray-500 mt-2 truncate">
                          📝 {trip.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">No upcoming trips</p>
                <p className="text-gray-500 text-sm mb-4">
                  Plan your next adventure!
                </p>
                <Link
                  to="/add-trip"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Plan Trip
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Trips Overview */}
        {recentTrips.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-400" />
                Recent Trips
              </h2>
              <Link
                to="/trips"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentTrips.map((trip, index) => {
                const startDate = parseDate(trip.startDate);
                const endDate = parseDate(trip.endDate);
                const duration =
                  startDate && endDate
                    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
                    : 0;
                const isActive =
                  startDate &&
                  endDate &&
                  startDate <= new Date() &&
                  endDate >= new Date();
                const isCompleted = endDate && endDate < new Date();

                return (
                  <div
                    key={trip._id || index}
                    className="p-4 bg-gray-800 rounded-lg border-l-4 border-blue-400 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white truncate">
                        {trip.destination}
                      </h3>
                      {isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : isCompleted ? (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-400" />
                      )}
                    </div>

                    {startDate && endDate && (
                      <p className="text-sm text-gray-400 mb-2">
                        {startDate.toLocaleDateString()} -{" "}
                        {endDate.toLocaleDateString()}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            isActive
                              ? "bg-green-900 text-green-300"
                              : isCompleted
                              ? "bg-gray-700 text-gray-300"
                              : "bg-blue-900 text-blue-300"
                          }`}
                        >
                          {isActive
                            ? "Active"
                            : isCompleted
                            ? "Completed"
                            : "Upcoming"}
                        </span>
                        {duration > 0 && (
                          <span className="text-xs text-gray-500">
                            {duration} days
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(trip.budget)}
                      </span>
                    </div>

                    {trip.notes && (
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        {trip.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeDashboard;
