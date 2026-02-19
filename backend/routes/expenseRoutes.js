const express = require("express");
const Expense = require("../models/Expense");
const router = express.Router();

// Get all expenses with formatted dates and enhanced filtering
router.get("/expenses", async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      paymentMethod,
      minAmount,
      maxAmount,
      limit = 2000,
      page = 1,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // Filter by expense type/category
    if (category && category !== "all") {
      query.expenseType = category;
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const expenses = await Expense.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalExpenses = await Expense.countDocuments(query);
    const totalPages = Math.ceil(totalExpenses / parseInt(limit));

    // Format the expenses for response
    const formattedExpenses = expenses.map((expense) => {
      const date = new Date(expense.date);
      return {
        ...expense,
        date: `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`,
        formattedAmount: `₹${expense.amount.toLocaleString("en-IN")}`,
        // Add month name for easier grouping
        monthYear: `${date.toLocaleString("default", {
          month: "short",
        })} ${date.getFullYear()}`,
      };
    });

    res.json({
      expenses: formattedExpenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalExpenses,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      filters: {
        category,
        startDate,
        endDate,
        paymentMethod,
        minAmount,
        maxAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      message: "Error fetching expenses",
      error: error.message,
    });
  }
});

// Add a new expense (Updated for new schema)
router.post("/add-expense", async (req, res) => {
  try {
    const {
      expenseType,
      to,
      description,
      date,
      amount,
      paymentMethod,
      tags,
      isRecurring,
      notes,
    } = req.body;

    console.log("Received expense data:", req.body);

    // Validate required fields
    if (!expenseType || !to || !description || !date || !amount) {
      return res.status(400).json({
        message:
          "Missing required fields: expenseType, to, description, date, and amount are required!",
        received: { expenseType, to, description, date, amount },
      });
    }

    // Validate expense type against allowed enum values
    const validExpenseTypes = Expense.getExpenseTypes();
    if (!validExpenseTypes.includes(expenseType)) {
      return res.status(400).json({
        message: `Invalid expense type! Must be one of: ${validExpenseTypes.join(
          ", "
        )}`,
        received: expenseType,
      });
    }

    // Ensure amount is a valid positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount! Must be a positive number.",
        received: amount,
      });
    }

    // Ensure date is valid
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format!",
        received: date,
      });
    }

    // Create new expense with enhanced schema
    const newExpense = new Expense({
      expenseType,
      to: to.trim(),
      description: description.trim(),
      date: parsedDate,
      amount: parsedAmount,
      paymentMethod: paymentMethod || "Other",
      tags: Array.isArray(tags) ? tags.filter((tag) => tag.trim()) : [],
      isRecurring: Boolean(isRecurring),
      notes: notes ? notes.trim() : "",
    });

    const savedExpense = await newExpense.save();
    console.log("Expense saved successfully:", savedExpense._id);

    // Format the response
    const responseExpense = savedExpense.toObject();
    const responseDate = new Date(responseExpense.date);

    responseExpense.date = `${responseDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${(responseDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${responseDate.getFullYear()}`;

    responseExpense.formattedAmount = `₹${savedExpense.amount.toLocaleString(
      "en-IN"
    )}`;

    res.status(201).json({
      message: "Expense added successfully",
      expense: responseExpense,
      success: true,
    });
  } catch (error) {
    console.error("Error saving expense:", error);

    // Handle validation errors specifically
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      message: "Server error. Please try again.",
      error: error.message,
    });
  }
});

// Get expense types (New endpoint)
router.get("/expense-types", (req, res) => {
  try {
    const expenseTypes = Expense.getExpenseTypes();
    res.json({
      expenseTypes,
      message: "Expense types retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching expense types:", error);
    res.status(500).json({
      message: "Error fetching expense types",
      error: error.message,
    });
  }
});

// Get expenses grouped by category (New endpoint)
router.get("/expenses/by-category", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const categoryStats = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$expenseType",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          averageAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },
      {
        $project: {
          category: "$_id",
          totalAmount: { $round: ["$totalAmount", 2] },
          count: 1,
          averageAmount: { $round: ["$averageAmount", 2] },
          maxAmount: { $round: ["$maxAmount", 2] },
          minAmount: { $round: ["$minAmount", 2] },
          _id: 0,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Calculate percentages
    const totalSpending = categoryStats.reduce(
      (sum, cat) => sum + cat.totalAmount,
      0
    );
    const enrichedStats = categoryStats.map((stat) => ({
      ...stat,
      percentage:
        totalSpending > 0
          ? ((stat.totalAmount / totalSpending) * 100).toFixed(1)
          : 0,
      formattedTotal: `₹${stat.totalAmount.toLocaleString("en-IN")}`,
      formattedAverage: `₹${stat.averageAmount.toLocaleString("en-IN")}`,
    }));

    res.json({
      categoryStats: enrichedStats,
      totalCategories: categoryStats.length,
      totalSpending,
      message: "Category statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({
      message: "Error fetching category statistics",
      error: error.message,
    });
  }
});

// Get monthly expense summary (New endpoint)
router.get("/expenses/monthly-summary", async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlySummary = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          averageAmount: { $avg: "$amount" },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          totalAmount: { $round: ["$totalAmount", 2] },
          count: 1,
          averageAmount: { $round: ["$averageAmount", 2] },
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Fill in missing months with zero values
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const fullYearData = months.map((month) => {
      const existingData = monthlySummary.find((item) => item.month === month);
      return (
        existingData || {
          month,
          year: parseInt(year),
          totalAmount: 0,
          count: 0,
          averageAmount: 0,
        }
      );
    });

    res.json({
      monthlySummary: fullYearData,
      year: parseInt(year),
      message: "Monthly summary retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching monthly summary:", error);
    res.status(500).json({
      message: "Error fetching monthly summary",
      error: error.message,
    });
  }
});

// Search expenses (New endpoint)
router.get("/expenses/search", async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    const searchResults = await Expense.find({
      $or: [
        { description: searchRegex },
        { to: searchRegex },
        { expenseType: searchRegex },
        { notes: searchRegex },
      ],
    })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean();

    const formattedResults = searchResults.map((expense) => {
      const date = new Date(expense.date);
      return {
        ...expense,
        date: `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`,
        formattedAmount: `₹${expense.amount.toLocaleString("en-IN")}`,
      };
    });

    res.json({
      results: formattedResults,
      count: formattedResults.length,
      query: q,
      message: "Search completed successfully",
    });
  } catch (error) {
    console.error("Error searching expenses:", error);
    res.status(500).json({
      message: "Error searching expenses",
      error: error.message,
    });
  }
});

// Update expense (New endpoint)
router.put("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields if they're being updated
    if (
      updateData.amount &&
      (isNaN(updateData.amount) || updateData.amount <= 0)
    ) {
      return res.status(400).json({
        message: "Invalid amount! Must be a positive number.",
      });
    }

    if (updateData.expenseType) {
      const validExpenseTypes = Expense.getExpenseTypes();
      if (!validExpenseTypes.includes(updateData.expenseType)) {
        return res.status(400).json({
          message: `Invalid expense type! Must be one of: ${validExpenseTypes.join(
            ", "
          )}`,
        });
      }
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json({
      message: "Expense updated successfully",
      expense: updatedExpense,
      success: true,
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({
      message: "Error updating expense",
      error: error.message,
    });
  }
});

// Delete expense (New endpoint)
router.delete("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json({
      message: "Expense deleted successfully",
      deletedExpense,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({
      message: "Error deleting expense",
      error: error.message,
    });
  }
});

module.exports = router;
