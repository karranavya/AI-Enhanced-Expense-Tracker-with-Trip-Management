import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, FileText, CreditCard, Tag } from "lucide-react";

// Comprehensive expense types
const EXPENSE_TYPES = [
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

const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Net Banking",
  "Cheque",
  "Other",
];

// Common recipients for each expense type
const COMMON_RECIPIENTS = {
  "Food & Dining": [
    "Restaurant",
    "Food Delivery",
    "Grocery Store",
    "Cafe",
    "Fast Food",
    "Canteen",
  ],
  Transportation: [
    "Uber",
    "Ola",
    "Auto",
    "Bus",
    "Train",
    "Taxi",
    "Fuel Station",
    "Metro",
  ],
  Entertainment: [
    "Movie Theater",
    "Gaming",
    "Concert",
    "Sports Event",
    "Streaming Service",
    "Books",
  ],
  Shopping: [
    "Amazon",
    "Flipkart",
    "Mall",
    "Local Store",
    "Online Shopping",
    "Clothing Store",
  ],
  "Bills & Utilities": [
    "Electricity Board",
    "Water Department",
    "Gas Agency",
    "Internet Provider",
    "Mobile Operator",
  ],
  Healthcare: [
    "Hospital",
    "Clinic",
    "Pharmacy",
    "Doctor",
    "Lab Test",
    "Insurance",
  ],
  Education: [
    "School",
    "College",
    "Course Fee",
    "Books",
    "Online Learning",
    "Tuition",
  ],
  "Travel & Vacation": [
    "Hotel",
    "Flight",
    "Travel Agency",
    "Tour Package",
    "Accommodation",
  ],
  "Personal Care": ["Salon", "Spa", "Cosmetics", "Grooming", "Fitness"],
  "Home & Garden": [
    "Furniture",
    "Home Improvement",
    "Garden Supplies",
    "Appliances",
  ],
  Technology: ["Electronics Store", "Software", "Gadgets", "Repair Service"],
  Other: ["Miscellaneous", "General", "Unknown"],
};

function AddExpense({ addExpense }) {
  const [formData, setFormData] = useState({
    expenseType: "",
    to: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "",
    tags: "",
    isRecurring: false,
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const navigate = useNavigate();

  // Get common recipients based on selected expense type
  const getCommonRecipients = () => {
    return (
      COMMON_RECIPIENTS[formData.expenseType] || COMMON_RECIPIENTS["Other"]
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (
      !formData.expenseType ||
      !formData.to ||
      !formData.description ||
      !formData.amount
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const expensePayload = {
        expenseType: formData.expenseType,
        to: formData.to.trim(),
        description: formData.description.trim(),
        date: formData.date,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod || "Other",
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
        isRecurring: formData.isRecurring,
        notes: formData.notes.trim(),
      };

      console.log("Submitting expense:", expensePayload);

      const response = await fetch("http://localhost:5000/api/add-expense", {
        // Updated to port 3001
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expensePayload),
      });

      const responseData = await response.json();
      console.log("Response:", responseData);

      if (response.ok) {
        alert("Expense added successfully!");

        // Reset form
        setFormData({
          expenseType: "",
          to: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          amount: "",
          paymentMethod: "",
          tags: "",
          isRecurring: false,
          notes: "",
        });

        // Navigate back to expenses list
        navigate("/expenses");
      } else {
        alert(`Error: ${responseData.message || "Failed to add expense"}`);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert(`Network Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              Add New Expense
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Expense Type - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Expense Type *
              </label>
              <select
                name="expenseType"
                value={formData.expenseType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select expense type</option>
                {EXPENSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recipient/Vendor - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To (Recipient/Vendor) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    placeholder="Enter recipient name"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    list={`recipients-${formData.expenseType}`}
                    required
                  />
                  {/* Datalist for common recipients */}
                  {formData.expenseType && (
                    <datalist id={`recipients-${formData.expenseType}`}>
                      {getCommonRecipients().map((recipient) => (
                        <option key={recipient} value={recipient} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              {/* Amount - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Description - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the expense"
                maxLength="500"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <CreditCard className="inline w-4 h-4 mr-1" />
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select payment method</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                {showAdvanced ? "− Hide" : "+ Show"} Advanced Options
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="personal, work, urgent"
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Recurring Expense */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isRecurring"
                    className="ml-2 text-sm text-gray-300"
                  >
                    This is a recurring expense
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes or details..."
                    rows="3"
                    maxLength="1000"
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform transition duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Adding Expense...
                  </>
                ) : (
                  "Add Expense"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/expenses")}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            💡 Quick Tips:
          </h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>
              • Select the expense type first to get relevant recipient
              suggestions
            </li>
            <li>• Use tags to categorize expenses for better tracking</li>
            <li>
              • Mark recurring expenses to identify regular spending patterns
            </li>
            <li>• Add detailed descriptions for better expense analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AddExpense;
