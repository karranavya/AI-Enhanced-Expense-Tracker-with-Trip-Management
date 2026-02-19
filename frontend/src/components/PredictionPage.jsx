import React, { useState, useEffect } from "react";
import { Brain, Zap, TrendingUp, BarChart3 } from "lucide-react";
import predictionAPI from "../services/predictionApi";

const PredictionsPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    to: "",
    date: new Date().toISOString().split("T")[0],
    method: "auto",
  });
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const response = await predictionAPI.getPredictionHistory();
      setPredictions(response.predictions || []);
    } catch (error) {
      console.error("Failed to load predictions:", error);
    }
  };

  const makePrediction = async () => {
    setLoading(true);
    try {
      const response = await predictionAPI.predictExpense(formData);
      setCurrentPrediction(response.prediction);
      await loadPredictions();
    } catch (error) {
      alert(`Prediction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const compareModels = async () => {
    setLoading(true);
    try {
      const response = await predictionAPI.compareModels(formData);
      setComparison(response.comparison);
    } catch (error) {
      alert(`Comparison failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="text-purple-400" size={32} />
          <h1 className="text-3xl font-bold text-white">
            AI Expense Predictions
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prediction Form */}
          <div className="bg-gray-900 rounded-xl p-6 border border-purple-500">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="text-purple-400" />
              Make Prediction
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Expense subject (e.g., lunch, movie, taxi)"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />

              <input
                type="text"
                placeholder="Recipient/Vendor (e.g., restaurant, cinema, uber)"
                value={formData.to}
                onChange={(e) =>
                  setFormData({ ...formData, to: e.target.value })
                }
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />

              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />

              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData({ ...formData, method: e.target.value })
                }
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value="auto">Auto (Best Model)</option>
                <option value="linear">Linear Regression</option>
                <option value="polynomial">Polynomial Regression</option>
                <option value="time_series">Time Series</option>
              </select>

              <div className="flex gap-4">
                <button
                  onClick={makePrediction}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-3 rounded-lg font-semibold"
                >
                  {loading ? "Predicting..." : "Get Prediction"}
                </button>

                <button
                  onClick={compareModels}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-lg font-semibold"
                >
                  Compare Models
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Single Prediction Result */}
            {currentPrediction && (
              <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-6 border border-green-500">
                <h3 className="text-lg font-bold text-white mb-4">
                  Prediction Result
                </h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    ₹{currentPrediction.predictedAmount?.toLocaleString()}
                  </div>
                  <div className="text-gray-300 mb-4">
                    Confidence:{" "}
                    {Math.round((currentPrediction.confidence || 0) * 100)}%
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Category:</span>
                      <div className="text-white">
                        {currentPrediction.category}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Level:</span>
                      <div className="text-white">
                        {currentPrediction.spendingLevel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Model Comparison */}
            {comparison && (
              <div className="bg-gray-900 rounded-xl p-6 border border-blue-500">
                <h3 className="text-lg font-bold text-white mb-4">
                  Model Comparison
                </h3>
                <div className="space-y-3">
                  {Object.entries(comparison.predictions || {}).map(
                    ([model, pred]) => (
                      <div
                        key={model}
                        className="flex justify-between items-center p-3 bg-gray-800 rounded-lg"
                      >
                        <span className="text-gray-300 capitalize">
                          {model}
                        </span>
                        <div className="text-right">
                          <div className="text-white font-bold">
                            ₹{pred.predicted_amount?.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {Math.round((pred.confidence || 0) * 100)}%
                            confidence
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {comparison.statistics && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">
                      Statistics:
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Average:</span>
                        <span className="text-white ml-2">
                          ₹
                          {Math.round(
                            comparison.statistics.average_prediction
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Variance:</span>
                        <span className="text-white ml-2">
                          ₹
                          {Math.round(
                            comparison.statistics.variance
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Predictions */}
        {predictions.length > 0 && (
          <div className="mt-8 bg-gray-900 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Recent Predictions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.slice(0, 6).map((pred) => (
                <div
                  key={pred._id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-white font-semibold">
                      {pred.subject}
                    </div>
                    <div className="text-green-400 font-bold">
                      ₹{pred.predictedAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">To: {pred.to}</div>
                  <div className="text-gray-400 text-sm">
                    {new Date(pred.predictionDate).toLocaleDateString()}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        pred.confidence > 0.8
                          ? "bg-green-900 text-green-300"
                          : pred.confidence > 0.6
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {Math.round(pred.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionsPage;
