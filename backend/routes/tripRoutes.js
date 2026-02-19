const express = require("express");
const router = express.Router();
const Trip = require("../models/tripModel");

// ✅ Get all trips
router.get("/", async (req, res) => {
  try {
    const trips = await Trip.find().sort({ startDate: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add a new trip
router.post("/", async (req, res) => {
  try {
    const { destination, startDate, endDate, budget, notes } = req.body;
    const newTrip = new Trip({
      destination,
      startDate,
      endDate,
      budget,
      notes,
    });
    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// ✅ Delete a trip
router.delete("/:id", async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

module.exports = router;
