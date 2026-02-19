import React from "react";
import { useNavigate } from "react-router-dom";

function ApprovalRow({ approval }) {
  const navigate = useNavigate();

  return (
    <tr className="border-b border-gray-800 text-white">
      <td className="py-2">{approval.person}</td>
      <td className="py-2 capitalize">{approval.transactionType}</td>
      <td className="py-2">{new Date(approval.date).toLocaleDateString()}</td>
      <td className="py-2">₹{approval.amount.toFixed(2)}</td>
      <td className="py-2">
        {approval.approved ? (
          <span className="text-green-400">Cleared</span>
        ) : (
          <span className="text-yellow-400">Pending</span>
        )}
      </td>
      <td className="py-2">
        <button
          onClick={() => navigate(`/add-approval/${approval._id}`)}
          className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs"
        >
          Update
        </button>
      </td>
    </tr>
  );
}

export default ApprovalRow;
