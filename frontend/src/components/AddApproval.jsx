import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addApproval,
  updateApproval,
  getApprovals,
} from "../services/approvalService"; // ✅ Import service functions

function AddApproval() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    person: "",
    transactionType: "given",
    amount: "",
    date: "",
    approved: false,
  });

  const [loading, setLoading] = useState(isEditMode);

  // Fetch data in update mode
  useEffect(() => {
    if (isEditMode) {
      const fetchApprovalToEdit = async () => {
        try {
          const allApprovals = await getApprovals();
          const selected = allApprovals.find((item) => item._id === id);
          if (selected) {
            setFormData({
              person: selected.person || "",
              transactionType: selected.transactionType || "given",
              amount: selected.amount || "",
              date: selected.date?.slice(0, 10) || "",
              approved: selected.approved || false,
            });
          }
          setLoading(false);
        } catch (err) {
          console.error("Error loading approval for update:", err);
          setLoading(false);
        }
      };

      fetchApprovalToEdit();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateApproval(id, formData);
      } else {
        await addApproval(formData);
      }
      navigate("/approvals");
    } catch (error) {
      console.error("Error submitting approval:", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-[#1e1e1e] p-6 rounded-lg text-white mt-8">
      <h2 className="text-xl font-semibold mb-4">
        {isEditMode ? "Update Approval" : "Add Approval"}
      </h2>

      {loading ? (
        <p className="text-blue-400">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Person Name</label>
            <input
              type="text"
              name="person"
              value={formData.person}
              onChange={handleChange}
              required
              className="w-full p-2 bg-gray-800 rounded"
            />
          </div>

          <div>
            <label className="block text-sm">Transaction Type</label>
            <select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className="w-full p-2 bg-gray-800 rounded"
            >
              <option value="given">Given</option>
              <option value="taken">Taken</option>
            </select>
          </div>

          <div>
            <label className="block text-sm">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full p-2 bg-gray-800 rounded"
            />
          </div>

          <div>
            <label className="block text-sm">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full p-2 bg-gray-800 rounded"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="approved"
              checked={formData.approved}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm">Pending Cleared</label>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            {isEditMode ? "Update Approval" : "Add Approval"}
          </button>
        </form>
      )}
    </div>
  );
}

export default AddApproval;
