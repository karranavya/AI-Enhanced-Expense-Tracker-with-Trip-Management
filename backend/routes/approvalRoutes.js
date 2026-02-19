// routes/approvalRoutes.js
const express = require("express");
const router = express.Router();
const Approval = require("../models/Approval");

// Get all approvals
router.get("/", async (req, res) => {
  try {
    const approvals = await Approval.find().sort({ date: -1 });
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add a new approval
router.post("/", async (req, res) => {
  try {
    const newApproval = new Approval(req.body);
    await newApproval.save();
    res.status(201).json(newApproval);
  } catch (err) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Delete an approval
router.delete("/:id", async (req, res) => {
  try {
    await Approval.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Approval not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete" });
  }
});
// GET a single approval by ID
router.get("/:id", async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ error: "Approval not found" });
    res.json(approval);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// PUT update approval
router.put("/:id", async (req, res) => {
  try {
    const updated = await Approval.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Approval not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update approval" });
  }
});
module.exports = router;
