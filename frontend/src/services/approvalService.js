// services/approvalService.js
const API_URL = "http://localhost:5000/api/approvals";

export const getApprovals = async () => {
  const res = await fetch(API_URL);
  return res.json();
};

export const addApproval = async (approval) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(approval),
  });
  if (!res.ok) {
    const errorData = await res.json();
    console.error("Server responded with error:", errorData);
    throw new Error("Submit failed");
  }
  return res.json();
};

export const updateApproval = async (id, updatedData) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) {
    throw new Error("Update failed");
  }
  return res.json();
};

export const deleteApproval = async (id) => {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
};
