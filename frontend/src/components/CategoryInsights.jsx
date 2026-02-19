import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Target,
  Calendar,
  Settings,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp as TrendIcon,
  X,
  RefreshCw,
  Download,
  Search,
} from "lucide-react";
import axios from "axios";

const COLORS = [
  "#60A5FA",
  "#34D399",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EAB308",
  "#A855F7",
  "#F472B6",
];

const CategoryInsights = () => {
  const [insights, setInsights] = useState(null);
  const [budgetLimits, setBudgetLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minSpending, setMinSpending] = useState("");
  const [maxSpending, setMaxSpending] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // cards, chart, detailed
  const [chartType, setChartType] = useState("bar"); // bar, pie, area, line

  // Form States
  const [newBudget, setNewBudget] = useState({
    expenseType: "",
    monthlyLimit: "",
    notes: "",
  });
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const expenseTypes = [
    "Food & Dining",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Bills & Utilities",
    "Healthcare",
    "Education",
    "Travel & Vacation",
    "Personal Care",
    "Home & Garden",
    "Technology",
    "Insurance",
    "Banking & Finance",
    "Gifts & Donations",
    "Business",
    "Pets",
    "Sports & Fitness",
    "Subscriptions",
    "Maintenance & Repairs",
    "Other",
  ];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  useEffect(() => {
    loadInsights();
    loadBudgetLimits();
  }, [selectedYear, selectedMonth]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);

      const response = await axios.get(
        `http://localhost:5000/api/categories/insights?${params}`
      );
      setInsights(response.data);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetLimits = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/categories/budget"
      );
      setBudgetLimits(response.data.budgetLimits || []);
    } catch (error) {
      console.error("Error loading budget limits:", error);
    }
  };

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadInsights(), loadBudgetLimits()]);
    setRefreshing(false);
  }, [selectedYear, selectedMonth]);

  // Filter the category data based on all filters
  const filteredCategoryData = useMemo(() => {
    if (!insights?.category_analysis) return {};

    let filtered = Object.entries(insights.category_analysis);

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(([category]) =>
        selectedCategories.includes(category)
      );
    }

    // Filter by spending range
    if (minSpending) {
      filtered = filtered.filter(
        ([, data]) => data.total_spent >= parseFloat(minSpending)
      );
    }
    if (maxSpending) {
      filtered = filtered.filter(
        ([, data]) => data.total_spent <= parseFloat(maxSpending)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(([category]) =>
        category.toLowerCase().includes(query)
      );
    }

    return Object.fromEntries(filtered);
  }, [insights, selectedCategories, minSpending, maxSpending, searchQuery]);

  // Filter alerts based on severity
  const filteredAlerts = useMemo(() => {
    if (!insights?.alerts) return [];

    if (alertSeverity === "all") return insights.alerts;
    return insights.alerts.filter((alert) => alert.severity === alertSeverity);
  }, [insights?.alerts, alertSeverity]);

  const saveBudgetLimit = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/categories/budget",
        newBudget
      );
      setNewBudget({ expenseType: "", monthlyLimit: "", notes: "" });
      setShowBudgetForm(false);
      loadBudgetLimits();
      loadInsights();
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget limit");
    }
  };

  const deleteBudgetLimit = async (budgetId) => {
    if (window.confirm("Are you sure you want to delete this budget limit?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/categories/budget/${budgetId}`
        );
        loadBudgetLimits();
        loadInsights();
      } catch (error) {
        console.error("Error deleting budget:", error);
      }
    }
  };

  const clearAllFilters = () => {
    setSelectedYear("2025");
    setSelectedMonth("");
    setSelectedCategories([]);
    setMinSpending("");
    setMaxSpending("");
    setAlertSeverity("all");
    setSearchQuery("");
  };

  const exportData = () => {
    const dataStr = JSON.stringify(filteredCategoryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `category-insights-${selectedYear}-${
      selectedMonth || "all"
    }.json`;
    link.click();
  };

  // Prepare chart data
  const categoryChartData = Object.entries(filteredCategoryData).map(
    ([category, data]) => ({
      category:
        category.length > 12 ? category.substring(0, 12) + "..." : category,
      fullCategory: category,
      spent: data.total_spent,
      predicted: insights.predictions?.[category]?.predicted_amount || 0,
      budget:
        budgetLimits.find((b) => b.expenseType === category)?.monthlyLimit || 0,
      transactions: data.transaction_count,
      avgTransaction: data.average_transaction,
      trend: data.trend,
    })
  );

  const pieChartData = categoryChartData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const alertsByCategory =
    insights?.alerts?.reduce((acc, alert) => {
      acc[alert.category] = alert;
      return acc;
    }, {}) || {};

  const getAlertColor = (alert) => {
    if (!alert) return "border-gray-700";
    switch (alert.severity) {
      case "high":
        return "border-red-500";
      case "medium":
        return "border-yellow-500";
      case "low":
        return "border-blue-500";
      default:
        return "border-gray-700";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-400" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-xl">
          <p className="text-gray-200 font-medium mb-2">
            {payload[0]?.payload?.fullCategory || label}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              style={{ color: entry.color }}
              className="font-semibold"
            >
              {entry.name}: ₹{entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Analyzing your spending patterns...</p>
        </div>
      </div>
    );
  }

  if (!insights || !insights.success) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-white text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p>Failed to load category insights</p>
          <button
            onClick={refreshData}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Category Insights & Predictions
              </h1>
              <p className="text-gray-400 mt-2">
                {selectedYear && selectedMonth
                  ? `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`
                  : selectedYear
                  ? `Year ${selectedYear}`
                  : "All Time"}{" "}
                • {Object.keys(filteredCategoryData).length} categories
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={exportData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => setShowBudgetForm(!showBudgetForm)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Budgets
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-400" />
              Filters & View Options
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("chart")}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === "chart"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Charts
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
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Spending */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Min Spending
              </label>
              <input
                type="number"
                placeholder="₹0"
                value={minSpending}
                onChange={(e) => setMinSpending(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Spending */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max Spending
              </label>
              <input
                type="number"
                placeholder="₹∞"
                value={maxSpending}
                onChange={(e) => setMaxSpending(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Alert Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Alert Level
              </label>
              <select
                value={alertSeverity}
                onChange={(e) => setAlertSeverity(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Alerts</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Chart Type (if chart view) */}
            {viewMode === "chart" && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="line">Line Chart</option>
                </select>
              </div>
            )}
          </div>

          {/* Category Multi-Select */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {expenseTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedCategories((prev) =>
                      prev.includes(type)
                        ? prev.filter((cat) => cat !== type)
                        : [...prev, type]
                    );
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategories.includes(type)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters & Clear Button */}
          {(selectedYear ||
            selectedMonth ||
            selectedCategories.length > 0 ||
            minSpending ||
            maxSpending ||
            searchQuery ||
            alertSeverity !== "all") && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-400">Active filters:</span>
              {selectedYear && (
                <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm">
                  Year: {selectedYear}
                </span>
              )}
              {selectedMonth && (
                <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                  Month: {monthNames[parseInt(selectedMonth) - 1]}
                </span>
              )}
              {selectedCategories.length > 0 && (
                <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm">
                  Categories: {selectedCategories.length}
                </span>
              )}
              {(minSpending || maxSpending) && (
                <span className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded text-sm">
                  Range: ₹{minSpending || 0} - ₹{maxSpending || "∞"}
                </span>
              )}
              {searchQuery && (
                <span className="bg-pink-900/30 text-pink-300 px-2 py-1 rounded text-sm">
                  Search: "{searchQuery}"
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Alerts Section */}
        {filteredAlerts.length > 0 && (
          <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Budget Alerts ({filteredAlerts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === "high"
                      ? "bg-red-900/20 border-red-500"
                      : alert.severity === "medium"
                      ? "bg-yellow-900/20 border-yellow-500"
                      : "bg-blue-900/20 border-blue-500"
                  }`}
                >
                  <h3 className="font-semibold text-white">{alert.category}</h3>
                  <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">
                      ₹{alert.current_spending.toLocaleString()} / ₹
                      {alert.budget_limit.toLocaleString()}
                    </span>
                    <span
                      className={`font-bold ${
                        alert.severity === "high"
                          ? "text-red-400"
                          : alert.severity === "medium"
                          ? "text-yellow-400"
                          : "text-blue-400"
                      }`}
                    >
                      {alert.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Form */}
        {showBudgetForm && (
          <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-purple-500">
            <h2 className="text-xl font-bold text-white mb-4">
              Set Budget Limit
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={newBudget.expenseType}
                onChange={(e) =>
                  setNewBudget({ ...newBudget, expenseType: e.target.value })
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select Category</option>
                {expenseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Monthly Limit (₹)"
                value={newBudget.monthlyLimit}
                onChange={(e) =>
                  setNewBudget({ ...newBudget, monthlyLimit: e.target.value })
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newBudget.notes}
                onChange={(e) =>
                  setNewBudget({ ...newBudget, notes: e.target.value })
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={saveBudgetLimit}
                disabled={!newBudget.expenseType || !newBudget.monthlyLimit}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
              >
                Save Budget
              </button>
              <button
                onClick={() => setShowBudgetForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Content based on View Mode */}
        {viewMode === "chart" && (
          <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">
              {chartType === "bar" && "Spending Comparison"}
              {chartType === "pie" && "Spending Distribution"}
              {chartType === "area" && "Spending Trends"}
              {chartType === "line" && "Spending Analysis"}
            </h2>
            <ResponsiveContainer width="100%" height={500}>
              {chartType === "bar" && (
                <BarChart data={categoryChartData}>
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
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="spent" fill="#60A5FA" name="Current Spending" />
                  <Bar
                    dataKey="predicted"
                    fill="#34D399"
                    name="Predicted (30 days)"
                  />
                  <Bar dataKey="budget" fill="#F59E0B" name="Monthly Budget" />
                </BarChart>
              )}

              {chartType === "pie" && (
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="spent"
                    nameKey="fullCategory"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    innerRadius={60}
                    paddingAngle={2}
                    label={({ fullCategory, percent }) =>
                      `${fullCategory}: ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              )}

              {chartType === "area" && (
                <AreaChart data={categoryChartData}>
                  <defs>
                    <linearGradient
                      id="spentGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="#60A5FA"
                    fill="url(#spentGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              )}

              {chartType === "line" && (
                <LineChart data={categoryChartData}>
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
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="#60A5FA"
                    strokeWidth={3}
                    dot={{ fill: "#60A5FA", r: 6 }}
                    name="Current Spending"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#34D399"
                    strokeWidth={3}
                    dot={{ fill: "#34D399", r: 6 }}
                    name="Predicted"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Cards View */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Object.entries(filteredCategoryData).map(([category, data]) => {
              const alert = alertsByCategory[category];
              const prediction = insights.predictions?.[category];
              const budget = budgetLimits.find(
                (b) => b.expenseType === category
              );

              return (
                <div
                  key={category}
                  className={`bg-gray-900 rounded-xl p-6 border ${getAlertColor(
                    alert
                  )} hover:border-purple-500 transition-colors`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {category}
                    </h3>
                    {getTrendIcon(data.trend)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Spent:</span>
                      <span className="text-blue-400 font-semibold">
                        ₹{data.total_spent.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Transactions:</span>
                      <span className="text-white">
                        {data.transaction_count}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg/Transaction:</span>
                      <span className="text-white">
                        ₹{Math.round(data.average_transaction)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Avg:</span>
                      <span className="text-white">
                        ₹{Math.round(data.monthly_average)}
                      </span>
                    </div>

                    {prediction && (
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            30-day Prediction:
                          </span>
                          <span className="text-green-400 font-semibold">
                            ₹{prediction.predicted_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Confidence:</span>
                          <span className="text-gray-300">
                            {Math.round(prediction.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {budget && (
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Budget Limit:</span>
                          <span className="text-yellow-400 font-semibold">
                            ₹{budget.monthlyLimit.toLocaleString()}
                          </span>
                        </div>
                        {alert && (
                          <div className="mt-2 text-xs">
                            <div
                              className={`px-2 py-1 rounded text-center ${
                                alert.severity === "high"
                                  ? "bg-red-900 text-red-300"
                                  : alert.severity === "medium"
                                  ? "bg-yellow-900 text-yellow-300"
                                  : "bg-blue-900 text-blue-300"
                              }`}
                            >
                              {alert.percentage}% used
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {budget && (
                    <button
                      onClick={() => deleteBudgetLimit(budget._id)}
                      className="mt-4 text-xs text-red-400 hover:text-red-300"
                    >
                      Remove Budget
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Table View */}
        {viewMode === "detailed" && (
          <div className="mb-8 bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">
                      Category
                    </th>
                    <th className="text-right p-4 text-gray-400 font-medium">
                      Total Spent
                    </th>
                    <th className="text-right p-4 text-gray-400 font-medium">
                      Transactions
                    </th>
                    <th className="text-right p-4 text-gray-400 font-medium">
                      Avg/Transaction
                    </th>
                    <th className="text-right p-4 text-gray-400 font-medium">
                      Prediction
                    </th>
                    <th className="text-right p-4 text-gray-400 font-medium">
                      Budget
                    </th>
                    <th className="text-center p-4 text-gray-400 font-medium">
                      Trend
                    </th>
                    <th className="text-center p-4 text-gray-400 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(filteredCategoryData).map(
                    ([category, data]) => {
                      const alert = alertsByCategory[category];
                      const prediction = insights.predictions?.[category];
                      const budget = budgetLimits.find(
                        (b) => b.expenseType === category
                      );

                      return (
                        <tr
                          key={category}
                          className="border-b border-gray-800 hover:bg-gray-800/50"
                        >
                          <td className="p-4 font-medium text-white">
                            {category}
                          </td>
                          <td className="p-4 text-right text-blue-400 font-semibold">
                            ₹{data.total_spent.toLocaleString()}
                          </td>
                          <td className="p-4 text-right text-gray-300">
                            {data.transaction_count}
                          </td>
                          <td className="p-4 text-right text-gray-300">
                            ₹{Math.round(data.average_transaction)}
                          </td>
                          <td className="p-4 text-right text-green-400">
                            {prediction
                              ? `₹${prediction.predicted_amount.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="p-4 text-right text-yellow-400">
                            {budget
                              ? `₹${budget.monthlyLimit.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="p-4 text-center">
                            {getTrendIcon(data.trend)}
                          </td>
                          <td className="p-4 text-center">
                            {alert ? (
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  alert.severity === "high"
                                    ? "bg-red-900 text-red-300"
                                    : alert.severity === "medium"
                                    ? "bg-yellow-900 text-yellow-300"
                                    : "bg-blue-900 text-blue-300"
                                }`}
                              >
                                {alert.severity.toUpperCase()}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-white">
                  {Object.keys(filteredCategoryData).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Active Alerts</p>
                <p className="text-2xl font-bold text-white">
                  {filteredAlerts.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Budget Limits</p>
                <p className="text-2xl font-bold text-white">
                  {budgetLimits.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Time Period</p>
                <p className="text-lg font-bold text-white">
                  {selectedMonth
                    ? monthNames[parseInt(selectedMonth) - 1].substring(0, 3)
                    : "All"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryInsights;
