const express = require("express");
const router = express.Router();
const Prediction = require("../models/Prediction");
const AIService = require("../services/aiService");

// Train AI model with existing expense data
router.post("/train", async (req, res) => {
  try {
    console.log("🎓 Training AI model request received");

    const result = await AIService.trainModel();

    res.json({
      success: true,
      message: "AI model trained successfully",
      trainingResult: result,
    });
  } catch (error) {
    console.error("Training error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      error: "AI_TRAINING_FAILED",
    });
  }
});

// Make expense prediction
router.post("/predict", async (req, res) => {
  try {
    const { subject, to, date, method } = req.body;

    console.log("🔮 Prediction request:", { subject, to, date, method });

    // Validate input
    if (!subject || !to) {
      return res.status(400).json({
        success: false,
        message: "Subject and recipient (to) are required",
      });
    }

    // Get prediction from AI service
    const aiResult = await AIService.predictExpense({
      subject,
      to,
      date: date || new Date().toISOString().split("T")[0],
      method: method || "auto",
    });

    if (!aiResult.success) {
      throw new Error(aiResult.error || "Prediction failed");
    }

    const predictionData = aiResult.prediction;

    // Save prediction to database
    const newPrediction = new Prediction({
      predictedAmount: predictionData.predictedAmount,
      category: predictionData.category,
      subject: subject,
      to: to,
      predictionDate: new Date(date || new Date()),
      confidence: predictionData.confidence,
      method: predictionData.method,
      factors: predictionData.factors,
      spendingLevel: predictionData.spendingLevel,
      recommendations: predictionData.recommendations,
    });

    const savedPrediction = await newPrediction.save();

    res.json({
      success: true,
      prediction: {
        id: savedPrediction._id,
        predictedAmount: predictionData.predictedAmount,
        confidence: predictionData.confidence,
        category: predictionData.category,
        method: predictionData.method,
        spendingLevel: predictionData.spendingLevel,
        recommendations: predictionData.recommendations,
        factors: predictionData.factors,
      },
      message: "Prediction generated successfully",
    });
  } catch (error) {
    console.error("Prediction error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      error: "PREDICTION_FAILED",
    });
  }
});

// Compare all model predictions
router.post("/compare", async (req, res) => {
  try {
    const { subject, to, date } = req.body;

    if (!subject || !to) {
      return res.status(400).json({
        success: false,
        message: "Subject and recipient (to) are required",
      });
    }

    const comparison = await AIService.compareModels({
      subject,
      to,
      date: date || new Date().toISOString().split("T")[0],
    });

    res.json({
      success: true,
      comparison: comparison.comparison,
      message: "Model comparison completed",
    });
  } catch (error) {
    console.error("Comparison error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      error: "COMPARISON_FAILED",
    });
  }
});

// Get prediction history
router.get("/history", async (req, res) => {
  try {
    const { limit = 10, page = 1, category } = req.query;

    const query = {};
    if (category) {
      query.category = category;
    }

    const predictions = await Prediction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Prediction.countDocuments(query);

    res.json({
      success: true,
      predictions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("History error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Validate prediction accuracy (when actual expense is recorded)
router.put("/validate/:predictionId", async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { actualAmount } = req.body;

    if (!actualAmount || actualAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid actual amount is required",
      });
    }

    const prediction = await Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    // Calculate accuracy percentage
    const accuracy = Math.max(
      0,
      1 - Math.abs(actualAmount - prediction.predictedAmount) / actualAmount
    );

    prediction.actualAmount = actualAmount;
    prediction.accuracy = accuracy;
    prediction.isValidated = true;

    await prediction.save();

    res.json({
      success: true,
      message: "Prediction validated successfully",
      prediction: {
        id: prediction._id,
        predicted: prediction.predictedAmount,
        actual: actualAmount,
        accuracy: Math.round(accuracy * 100),
        accuracyLevel:
          accuracy > 0.8 ? "high" : accuracy > 0.6 ? "medium" : "low",
      },
    });
  } catch (error) {
    console.error("Validation error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get AI model status
router.get("/status", async (req, res) => {
  try {
    const statusResult = await AIService.getModelStatus();
    const healthResult = await AIService.checkHealth();

    res.json({
      success: true,
      aiService: {
        healthy: healthResult.success,
        trained: statusResult.status?.orchestrator_trained || false,
        modelDetails: statusResult.status || {},
        health: healthResult.health || {},
      },
    });
  } catch (error) {
    console.error("Status error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      aiService: {
        healthy: false,
        trained: false,
      },
    });
  }
});

// Get prediction analytics
router.get("/analytics", async (req, res) => {
  try {
    const totalPredictions = await Prediction.countDocuments();
    const validatedPredictions = await Prediction.countDocuments({
      isValidated: true,
    });

    // Get accuracy statistics
    const accuracyStats = await Prediction.aggregate([
      { $match: { isValidated: true, accuracy: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgAccuracy: { $avg: "$accuracy" },
          minAccuracy: { $min: "$accuracy" },
          maxAccuracy: { $max: "$accuracy" },
        },
      },
    ]);

    // Get category distribution
    const categoryStats = await Prediction.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPredicted: { $avg: "$predictedAmount" },
          avgConfidence: { $avg: "$confidence" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        totalPredictions,
        validatedPredictions,
        accuracy: accuracyStats[0] || {
          avgAccuracy: 0,
          minAccuracy: 0,
          maxAccuracy: 0,
        },
        categoryBreakdown: categoryStats,
        validationRate:
          totalPredictions > 0
            ? (validatedPredictions / totalPredictions) * 100
            : 0,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
