const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make optional since you might not have user system yet
    },
    predictedAmount: {
      type: Number,
      required: true,
    },
    actualAmount: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    predictionDate: {
      type: Date,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    method: {
      type: String,
      enum: ["auto", "linear", "polynomial", "time_series", "ensemble"],
      default: "auto",
    },
    factors: {
      type: Object,
      default: {},
    },
    spendingLevel: {
      type: String,
      enum: ["low", "medium", "high", "very_high"],
      required: true,
    },
    recommendations: [
      {
        type: String,
      },
    ],
    isValidated: {
      type: Boolean,
      default: false,
    },
    accuracy: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
predictionSchema.index({ predictionDate: -1 });
predictionSchema.index({ category: 1 });

module.exports = mongoose.model("Prediction", predictionSchema);
