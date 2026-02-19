const mongoose = require("mongoose");

const budgetLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    expenseType: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    monthlyLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    alertThresholds: {
      caution: { type: Number, default: 60 }, // 60%
      warning: { type: Number, default: 80 }, // 80%
      critical: { type: Number, default: 100 }, // 100%
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Ensure unique budget per category per user
budgetLimitSchema.index({ userId: 1, expenseType: 1 }, { unique: true });

module.exports = mongoose.model("BudgetLimit", budgetLimitSchema);
