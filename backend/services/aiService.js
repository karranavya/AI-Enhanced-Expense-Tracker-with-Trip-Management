const axios = require("axios");
const Expense = require("../models/Expense");

class AIService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:3001";
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Train AI model with user's expense data
   */
  async trainModel() {
    try {
      console.log("🤖 Starting AI model training...");

      // Fetch all expenses for training
      const expenses = await Expense.find({}).lean();

      if (expenses.length === 0) {
        throw new Error("No expense data found for training");
      }

      console.log(`📊 Found ${expenses.length} expenses for training`);

      // Format data for AI service
      const formattedData = expenses.map((expense) => ({
        subject: expense.subject || "general",
        to: expense.to || "unknown",
        date: expense.date
          ? expense.date.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        amount: expense.amount ? expense.amount.toString() : "0",
      }));

      // Remove invalid entries
      const validData = formattedData.filter(
        (exp) => exp.subject && exp.to && exp.date && parseFloat(exp.amount) > 0
      );

      if (validData.length < 3) {
        throw new Error(
          "Insufficient valid expense data for training (minimum 3 required)"
        );
      }

      console.log(`🎯 Training with ${validData.length} valid expenses`);

      // Send training request to AI service
      const response = await axios.post(
        `${this.aiServiceUrl}/train`,
        {
          expenses: validData,
          force_retrain: true,
        },
        {
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ AI model training completed successfully");
      return {
        success: true,
        message: "AI model trained successfully",
        trainingData: response.data,
        dataSize: validData.length,
      };
    } catch (error) {
      console.error("❌ AI Service Training Error:", error.message);

      if (error.code === "ECONNREFUSED") {
        throw new Error(
          "AI service is not running. Please start the Python AI service on port 5000."
        );
      }

      throw new Error(
        `Failed to train AI model: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }

  /**
   * Get expense prediction from AI service
   */
  async predictExpense(predictionData) {
    try {
      console.log("🔮 Getting expense prediction:", predictionData);

      // Validate input
      if (!predictionData.subject || !predictionData.to) {
        throw new Error(
          "Subject and recipient (to) are required for prediction"
        );
      }

      // Ensure date is in correct format
      const predictionInput = {
        subject: predictionData.subject.toLowerCase(),
        to: predictionData.to.toLowerCase(),
        date: predictionData.date || new Date().toISOString().split("T")[0],
        method: predictionData.method || "auto",
      };

      const response = await axios.post(
        `${this.aiServiceUrl}/predict`,
        predictionInput,
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const prediction = response.data;

      if (prediction.error) {
        throw new Error(prediction.error);
      }

      console.log(
        `✅ Prediction: ₹${prediction.predicted_amount} (${
          prediction.confidence * 100
        }% confidence)`
      );

      return {
        success: true,
        prediction: {
          predictedAmount: prediction.predicted_amount,
          confidence: prediction.confidence,
          method: prediction.method_used || "auto",
          category: prediction.factors_used?.category || "other",
          spendingLevel: prediction.spending_level || "medium",
          recommendations: prediction.recommendations || [],
          factors: prediction.factors_used || {},
        },
      };
    } catch (error) {
      console.error("❌ AI Service Prediction Error:", error.message);

      if (error.code === "ECONNREFUSED") {
        throw new Error(
          "AI service is not running. Please start the Python AI service on port 5000."
        );
      }

      throw new Error(
        `Failed to get prediction: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }

  /**
   * Compare predictions from all models
   */
  async compareModels(predictionData) {
    try {
      console.log("📈 Comparing all model predictions...");

      const predictionInput = {
        subject: predictionData.subject.toLowerCase(),
        to: predictionData.to.toLowerCase(),
        date: predictionData.date || new Date().toISOString().split("T")[0],
      };

      const response = await axios.post(
        `${this.aiServiceUrl}/predict/compare`,
        predictionInput,
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        comparison: response.data,
      };
    } catch (error) {
      console.error("❌ Model Comparison Error:", error.message);
      throw new Error(
        `Failed to compare models: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }

  /**
   * Get AI model status
   */
  async getModelStatus() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/models/status`, {
        timeout: 5000,
      });

      return {
        success: true,
        status: response.data,
      };
    } catch (error) {
      console.error("❌ AI Service Status Error:", error.message);
      return {
        success: false,
        error:
          error.code === "ECONNREFUSED"
            ? "AI service not running"
            : error.message,
        status: { orchestrator_trained: false },
      };
    }
  }

  /**
   * Check if AI service is healthy
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000,
      });

      return {
        success: true,
        health: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.code === "ECONNREFUSED"
            ? "AI service not running"
            : error.message,
        health: { status: "unhealthy" },
      };
    }
  }
}

module.exports = new AIService();
