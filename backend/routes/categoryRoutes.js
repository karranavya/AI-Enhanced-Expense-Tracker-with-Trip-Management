const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const BudgetLimit = require("../models/BudgetLimit");
const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3001";

// Get category-wise spending analysis
router.get("/analysis", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Get expenses from database
    const expenses = await Expense.find(dateFilter).lean();

    // Format expenses for AI service
    const formattedExpenses = expenses.map((expense) => ({
      expenseType: expense.expenseType,
      amount: expense.amount,
      date: expense.date.toISOString().split("T")[0],
      description: expense.description,
      to: expense.to,
    }));

    // Get AI analysis
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/analyze-categories`,
      {
        expenses: formattedExpenses,
      }
    );

    // Get budget limits
    const budgetLimits = await BudgetLimit.find({ isActive: true }).lean();
    const budgetMap = {};
    budgetLimits.forEach((budget) => {
      budgetMap[budget.expenseType] = {
        monthly_limit: budget.monthlyLimit,
        alert_thresholds: budget.alertThresholds,
      };
    });

    // Get budget alerts
    const alertResponse = await axios.post(
      `${AI_SERVICE_URL}/api/budget-alerts`,
      {
        category_analysis: aiResponse.data.category_analysis,
        budget_limits: budgetMap,
      }
    );

    res.json({
      success: true,
      analysis: aiResponse.data.category_analysis,
      budget_limits: budgetMap,
      alerts: alertResponse.data.alerts,
      total_expenses: expenses.length,
      date_range: { startDate, endDate },
    });
  } catch (error) {
    console.error("Category analysis error:", error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error || error.message,
    });
  }
});

// Get comprehensive category insights
router.get("/insights", async (req, res) => {
  try {
    // Get all expenses
    const expenses = await Expense.find({}).lean();

    // Format for AI service
    const formattedExpenses = expenses.map((expense) => ({
      expenseType: expense.expenseType,
      amount: expense.amount,
      date: expense.date.toISOString().split("T")[0],
      description: expense.description,
      to: expense.to,
    }));

    // Get budget limits
    const budgetLimits = await BudgetLimit.find({ isActive: true }).lean();
    const budgetMap = {};
    budgetLimits.forEach((budget) => {
      budgetMap[budget.expenseType] = {
        monthly_limit: budget.monthlyLimit,
        alert_thresholds: budget.alertThresholds,
      };
    });

    // Get comprehensive insights from AI
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/category-insights`,
      {
        expenses: formattedExpenses,
        budget_limits: budgetMap,
      }
    );

    res.json({
      success: true,
      ...aiResponse.data,
    });
  } catch (error) {
    console.error("Category insights error:", error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error || error.message,
    });
  }
});

// Set budget limits
router.post("/budget", async (req, res) => {
  try {
    const { expenseType, monthlyLimit, alertThresholds, notes } = req.body;

    if (!expenseType || !monthlyLimit) {
      return res.status(400).json({
        success: false,
        message: "Expense type and monthly limit are required",
      });
    }

    // Update or create budget limit
    const budgetLimit = await BudgetLimit.findOneAndUpdate(
      { expenseType },
      {
        expenseType,
        monthlyLimit,
        alertThresholds: alertThresholds || {
          caution: 60,
          warning: 80,
          critical: 100,
        },
        notes,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Budget limit set successfully",
      budgetLimit,
    });
  } catch (error) {
    console.error("Set budget error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get budget limits
router.get("/budget", async (req, res) => {
  try {
    const budgetLimits = await BudgetLimit.find({ isActive: true }).sort({
      expenseType: 1,
    });

    res.json({
      success: true,
      budgetLimits,
    });
  } catch (error) {
    console.error("Get budget limits error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete budget limit
router.delete("/budget/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await BudgetLimit.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Budget limit deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
