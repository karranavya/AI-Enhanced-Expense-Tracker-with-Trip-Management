import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  Filter,
  Plus,
  Search,
  X,
  Calendar,
  Tag,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import ExpenseRow from "./ExpenseRow";

function ExpenseList({ expenses, fetchExpenses }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30); // Fixed at 50 items per page
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Prevent infinite loops
  const isInitialMount = useRef(true);
  const hasDataLoaded = useRef(false);

  // Enhanced date parsing function
  const parseExpenseDate = useCallback((dateInput) => {
    if (!dateInput) return null;

    try {
      if (typeof dateInput === "string") {
        if (dateInput.includes("T") || dateInput.includes("Z")) {
          return new Date(dateInput);
        }
        if (dateInput.includes("/")) {
          const [day, month, year] = dateInput.split("/");
          return new Date(year, month - 1, day);
        }
        if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(dateInput);
        }
      }

      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error("Error parsing date:", dateInput, error);
      return null;
    }
  }, []);

  // Handle the case where expenses might be undefined or not an array
  const expenseArray = useMemo(() => {
    if (expenses && typeof expenses === "object") {
      if (expenses.expenses && Array.isArray(expenses.expenses)) {
        return expenses.expenses;
      }
      if (Array.isArray(expenses)) {
        return expenses;
      }
    }
    if (Array.isArray(expenses)) {
      return expenses;
    }
    return [];
  }, [expenses]);

  // Get unique years from expenses
  const years = useMemo(() => {
    if (!expenseArray.length) return [];

    const yearSet = new Set();

    expenseArray.forEach((expense) => {
      const date = parseExpenseDate(expense.date);
      if (date && !isNaN(date.getTime())) {
        yearSet.add(date.getFullYear().toString());
      }
    });

    return Array.from(yearSet).sort().reverse();
  }, [expenseArray, parseExpenseDate]);

  // Get unique months from expenses for selected year
  const months = useMemo(() => {
    if (!expenseArray.length) return [];

    const monthSet = new Set();

    const filteredExpenses = selectedYear
      ? expenseArray.filter((expense) => {
          const date = parseExpenseDate(expense.date);
          return (
            date &&
            !isNaN(date.getTime()) &&
            date.getFullYear().toString() === selectedYear
          );
        })
      : expenseArray;

    filteredExpenses.forEach((expense) => {
      const date = parseExpenseDate(expense.date);
      if (date && !isNaN(date.getTime())) {
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        monthSet.add(yearMonth);
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [expenseArray, selectedYear, parseExpenseDate]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!expenseArray.length) return [];

    return [
      ...new Set(
        expenseArray
          .map((expense) => expense.expenseType || expense.subject || "Other")
          .filter(Boolean)
      ),
    ].sort();
  }, [expenseArray]);

  // Filter expenses (local filtering)
  const filteredExpenses = useMemo(() => {
    let filtered = expenseArray;

    if (selectedYear) {
      filtered = filtered.filter((expense) => {
        const date = parseExpenseDate(expense.date);
        return (
          date &&
          !isNaN(date.getTime()) &&
          date.getFullYear().toString() === selectedYear
        );
      });
    }

    if (selectedMonth) {
      filtered = filtered.filter((expense) => {
        const date = parseExpenseDate(expense.date);
        if (date && !isNaN(date.getTime())) {
          const expenseMonth = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
          return expenseMonth === selectedMonth;
        }
        return false;
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter((expense) => {
        const category = expense.expenseType || expense.subject || "Other";
        return category === selectedCategory;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((expense) => {
        const searchableFields = [
          expense.expenseType || expense.subject || "",
          expense.description || "",
          expense.to || "",
          expense.notes || "",
          expense.amount?.toString() || "",
          expense.paymentMethod || "",
          ...(expense.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        return searchableFields.includes(query);
      });
    }

    return filtered;
  }, [
    expenseArray,
    selectedYear,
    selectedMonth,
    selectedCategory,
    searchQuery,
    parseExpenseDate,
  ]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    if (!sortConfig.key) return filteredExpenses;

    return [...filteredExpenses].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "date") {
        const aDate = parseExpenseDate(aValue);
        const bDate = parseExpenseDate(bValue);

        if (!aDate || !bDate) return 0;

        aValue = aDate;
        bValue = bDate;
      }

      if (sortConfig.key === "amount") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredExpenses, sortConfig, parseExpenseDate]);

  // 🔧 Frontend Pagination Logic
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageExpenses = sortedExpenses.slice(startIndex, endIndex);

  // Calculate total amount for current page
  const currentPageTotal = useMemo(() => {
    return currentPageExpenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);
  }, [currentPageExpenses]);

  // Calculate total amount for all filtered expenses
  const totalAmount = useMemo(() => {
    return sortedExpenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);
  }, [sortedExpenses]);

  const requestSort = useCallback((key) => {
    setSortConfig((prevConfig) => {
      let direction = "asc";
      if (prevConfig.key === key && prevConfig.direction === "asc") {
        direction = "desc";
      }
      return { key, direction };
    });
  }, []);

  // Simple fetch function - no pagination params
  const memoizedFetchExpenses = useCallback(async () => {
    if (!fetchExpenses || hasDataLoaded.current) return;

    try {
      setError(null);
      console.log("📡 Fetching all expenses...");

      await fetchExpenses();
      hasDataLoaded.current = true;
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError("Failed to load expenses. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);

  // Reset to first page when filters change
  const handleFilterChange = useCallback((filterType, value) => {
    setCurrentPage(1);

    switch (filterType) {
      case "category":
        setSelectedCategory(value);
        break;
      case "year":
        setSelectedYear(value);
        setSelectedMonth(""); // Reset month when year changes
        break;
      case "month":
        setSelectedMonth(value);
        break;
      case "search":
        setSearchQuery(value);
        break;
    }
  }, []);

  // Page navigation functions
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  // Initial load only
  useEffect(() => {
    if (isInitialMount.current && !hasDataLoaded.current) {
      isInitialMount.current = false;
      setLoading(true);
      memoizedFetchExpenses();
    }
  }, [memoizedFetchExpenses]);

  // Handle data loaded
  useEffect(() => {
    if (expenseArray.length > 0) {
      setLoading(false);
    }
  }, [expenseArray.length]);

  const clearAllFilters = useCallback(() => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedCategory("");
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const setCurrentYear = useCallback(() => {
    handleFilterChange("year", "2025");
  }, [handleFilterChange]);

  const clearSearch = useCallback(() => {
    handleFilterChange("search", "");
  }, [handleFilterChange]);

  // Enhanced ExpenseRow component
  const EnhancedExpenseRow = React.memo(({ expense, ...props }) => {
    const formattedDate = useMemo(() => {
      const date = parseExpenseDate(expense.date);
      if (date && !isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
      }
      return expense.date || "Invalid Date";
    }, [expense.date]);

    return <ExpenseRow {...props} date={formattedDate} />;
  });

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

  const handleRetry = useCallback(() => {
    hasDataLoaded.current = false;
    setLoading(true);
    setError(null);
    memoizedFetchExpenses();
  }, [memoizedFetchExpenses]);

  if (loading) {
    return (
      <div className="bg-[#141414] rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-500">Loading all expenses...</p>
          <p className="text-xs text-gray-500 mt-2">
            This may take a moment for large datasets
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#141414] rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] rounded-lg p-6">
      {/* Header with Title and Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Expense List
            {sortedExpenses.length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({sortedExpenses.length} total)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-400">
              {selectedYear ? `Viewing: ${selectedYear}` : "Viewing: All Years"}
              • Page {currentPage} of {totalPages}• Showing{" "}
              {currentPageExpenses.length} of {sortedExpenses.length}
            </p>
            {years.length > 0 && (
              <span className="text-xs text-gray-500">
                Available: {years.join(", ")}
              </span>
            )}
            {!selectedYear && years.includes("2025") && (
              <button
                onClick={setCurrentYear}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                Show 2025 Only
              </button>
            )}
            {selectedYear && (
              <button
                onClick={() => handleFilterChange("year", "")}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
              >
                Show All Years
              </button>
            )}
          </div>
        </div>

        {/* Total amount display */}
        <div className="bg-blue-900/30 px-4 py-3 rounded-lg border border-blue-800">
          <p className="text-sm text-gray-400">Page Total:</p>
          <p className="text-xl font-bold text-blue-400">
            ₹
            {currentPageTotal.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-500">
            Total: ₹{totalAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /> */}
          <input
            type="text"
            placeholder="Search expenses by description, category, merchant, amount..."
            value={searchQuery}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Year selector */}
        {years.length > 0 && (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
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

        {/* Month selector */}
        {months.length > 0 && (
          <select
            value={selectedMonth}
            onChange={(e) => handleFilterChange("month", e.target.value)}
            className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Months</option>
            {months.map((month) => {
              try {
                const [year, monthNum] = month.split("-");
                const monthName = new Date(
                  `${year}-${monthNum}-01`
                ).toLocaleString("default", { month: "long" });
                return (
                  <option key={month} value={month}>
                    {`${monthName} ${year}`}
                  </option>
                );
              } catch (error) {
                return (
                  <option key={month} value={month}>
                    {month}
                  </option>
                );
              }
            })}
          </select>
        )}

        {/* Category selector */}
        {categories.length > 0 && (
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear filters button */}
        <button
          onClick={clearAllFilters}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Clear Filters
        </button>
      </div>

      {/* Active filters display */}
      {(selectedYear || selectedMonth || selectedCategory || searchQuery) && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Active filters:
          </span>
          {selectedYear && (
            <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm border border-blue-700">
              Year: {selectedYear}
            </span>
          )}
          {selectedCategory && (
            <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm border border-purple-700">
              Category: {selectedCategory}
            </span>
          )}
          {selectedMonth && (
            <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm border border-green-700">
              Month:{" "}
              {(() => {
                try {
                  const [year, monthNum] = selectedMonth.split("-");
                  const monthName = new Date(
                    `${year}-${monthNum}-01`
                  ).toLocaleString("default", { month: "long" });
                  return `${monthName} ${year}`;
                } catch {
                  return selectedMonth;
                }
              })()}
            </span>
          )}
          {searchQuery && (
            <span className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded text-sm border border-yellow-700 max-w-xs truncate">
              Search: "{searchQuery}"
            </span>
          )}
        </div>
      )}

      {/* 🔧 SIMPLE PAGINATION CONTROLS - Top */}
      {totalPages > 1 && (
        <div className="mb-4 flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedExpenses.length)}{" "}
            of {sortedExpenses.length}
          </div>
        </div>
      )}

      {/* Show message when no expenses */}
      {expenseArray.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Expenses Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Start tracking your expenses by adding your first entry.
          </p>
          <Link
            to="/add-expense"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Your First Expense
          </Link>
        </div>
      )}

      {/* Expenses Table */}
      {expenseArray.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <SortHeader column="expenseType" label="Category" />
                  <SortHeader column="description" label="Description" />
                  <SortHeader column="to" label="To" />
                  <SortHeader column="date" label="Date" />
                  <SortHeader column="amount" label="Amount" />
                </tr>
              </thead>
              <tbody className="text-sm">
                {currentPageExpenses.length > 0 ? (
                  currentPageExpenses.map((expense, index) => (
                    <EnhancedExpenseRow
                      key={expense._id || expense.id || `${startIndex + index}`}
                      expense={expense}
                      expenseType={expense.expenseType || expense.subject}
                      description={expense.description || expense.subject}
                      to={expense.to}
                      amount={expense.amount}
                      paymentMethod={expense.paymentMethod}
                      tags={expense.tags}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl">🔍</div>
                        <p className="text-lg">
                          No expenses match your filters
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filters above.
                        </p>
                        <button
                          onClick={clearAllFilters}
                          className="mt-2 text-blue-400 hover:text-blue-300 underline text-sm"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 🔧 SIMPLE PAGINATION CONTROLS - Bottom */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 transition-colors font-medium"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous 50
              </button>

              <div className="flex items-center gap-2 text-white">
                <span className="text-sm">Page</span>
                <span className="bg-blue-600 px-3 py-1 rounded-lg font-bold">
                  {currentPage}
                </span>
                <span className="text-sm">of {totalPages}</span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 transition-colors font-medium"
              >
                Next 50
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Statistics - Overall filter stats */}
          {currentPageExpenses.length > 0 && (
            <div className="mt-6">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {selectedYear ||
                  selectedCategory ||
                  selectedMonth ||
                  searchQuery
                    ? "Filtered Statistics"
                    : "Overall Statistics"}
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedYear ||
                  selectedCategory ||
                  selectedMonth ||
                  searchQuery
                    ? `Stats for ${sortedExpenses.length} matching expenses`
                    : `Stats for all ${sortedExpenses.length} expenses`}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Total Expenses</p>
                  <p className="text-lg font-semibold text-white">
                    {sortedExpenses.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sortedExpenses.length !== expenseArray.length
                      ? `of ${expenseArray.length} total`
                      : "all records"}
                  </p>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Average Transaction</p>
                  <p className="text-lg font-semibold text-white">
                    ₹
                    {sortedExpenses.length > 0
                      ? (totalAmount / sortedExpenses.length).toLocaleString(
                          "en-IN",
                          { maximumFractionDigits: 0 }
                        )
                      : "0"}
                  </p>
                  <p className="text-xs text-gray-500">per transaction</p>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Highest Transaction</p>
                  <p className="text-lg font-semibold text-white">
                    ₹
                    {sortedExpenses.length > 0
                      ? Math.max(
                          ...sortedExpenses.map(
                            (e) => parseFloat(e.amount) || 0
                          )
                        ).toLocaleString("en-IN")
                      : "0"}
                  </p>
                  <p className="text-xs text-gray-500">maximum amount</p>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Total Amount</p>
                  <p className="text-lg font-semibold text-white">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedYear ||
                    selectedCategory ||
                    selectedMonth ||
                    searchQuery
                      ? "filtered total"
                      : "grand total"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Add Button */}
      <Link
        to="/add-expense"
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 z-10 group"
        title="Add New Expense"
      >
        <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
      </Link>
    </div>
  );
}

export default ExpenseList;
