const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema({
  person: { type: String, required: true },
  transactionType: { type: String, enum: ["given", "taken"], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  approved: { type: Boolean, default: false },
});

module.exports = mongoose.model("Approval", approvalSchema);
