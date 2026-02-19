import axios from "axios";

const API_BASE_URL = "http://localhost:3001"; // Your backend URL

const predictionAPI = {
  // Train AI model
  trainModel: async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/predictions/train`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Make expense prediction
  predictExpense: async (predictionData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/predictions/predict`,
        predictionData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Compare all models
  compareModels: async (predictionData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/predictions/compare`,
        predictionData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Get prediction history
  getPredictionHistory: async (params = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/predictions/history`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Get AI status
  getAIStatus: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/predictions/status`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Get prediction analytics
  getAnalytics: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/predictions/analytics`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },
};

export default predictionAPI;
