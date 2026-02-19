const mongoose = require("mongoose");

// Define comprehensive expense categories
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

// Enhanced expense schema
const expenseSchema = new mongoose.Schema(
  {
    expenseType: {
      type: String,
      enum: expenseTypes,
      required: true,
      default: "Other",
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Additional useful fields
    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "Credit Card",
        "Debit Card",
        "UPI",
        "Net Banking",
        "Cheque",
        "Other",
      ],
      default: "Other",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Add indexes for better query performance
expenseSchema.index({ expenseType: 1, date: -1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ amount: -1 });

// Static method to get expense types
expenseSchema.statics.getExpenseTypes = function () {
  return expenseTypes;
};

// Instance method to format amount
expenseSchema.methods.getFormattedAmount = function () {
  return `₹${this.amount.toLocaleString("en-IN")}`;
};

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
