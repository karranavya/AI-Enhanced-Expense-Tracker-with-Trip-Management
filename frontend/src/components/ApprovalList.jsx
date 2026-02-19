import React, { useEffect, useState } from "react";
import ApprovalRow from "./ApprovalRow";
import { Link } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import { getApprovals } from "../services/approvalService";

function ApprovalList() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    const data = await getApprovals();
    setApprovals(data);
    setLoading(false);
  };

  const months = [
    ...new Set(
      approvals.map((a) => {
        const d = new Date(a.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
      })
    ),
  ]
    .sort()
    .reverse();

  const filteredApprovals = selectedMonth
    ? approvals.filter((a) => {
        const d = new Date(a.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}` === selectedMonth;
      })
    : approvals;

  const sortedApprovals = [...filteredApprovals].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === "date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }

    if (sortConfig.key === "amount") {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalCleared = sortedApprovals.filter((a) => a.approved).length;
  const totalAmount = sortedApprovals.reduce(
    (sum, a) => sum + parseFloat(a.amount),
    0
  );

  const requestSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const SortHeader = ({ column, label }) => (
    <th>
      <button
        onClick={() => requestSort(column)}
        className="flex items-center gap-1 hover:text-white transition-colors"
      >
        {label}
        <ArrowUpDown
          className={`h-4 w-4 ${
            sortConfig.key === column ? "text-blue-500" : "text-gray-500"
          }`}
        />
      </button>
    </th>
  );

  return (
    <div className="bg-[#141414] p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Approvals</h2>
        <div className="flex gap-4 items-center">
          <div className="bg-green-900/30 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-400">Cleared:</p>
            <p className="text-xl font-semibold text-green-400">
              {totalCleared}
            </p>
          </div>
          <div className="bg-blue-900/30 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-400">Total:</p>
            <p className="text-xl font-semibold text-blue-400">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Months</option>
            {months.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(`${y}-${mo}-01`).toLocaleString(
                "default",
                {
                  month: "long",
                  year: "numeric",
                }
              );
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-blue-400">Loading approvals...</p>
      ) : sortedApprovals.length > 0 ? (
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b border-gray-700">
            <tr>
              <SortHeader column="person" label="Person" />
              <SortHeader column="transactionType" label="Type" />
              <SortHeader column="date" label="Date" />
              <SortHeader column="amount" label="Amount" />
              <SortHeader column="approved" label="Status" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedApprovals.map((approval) => (
              <ApprovalRow key={approval._id} approval={approval} />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400">No approvals to show.</p>
      )}

      <Link
        to="/add-approval"
        className="fixed bottom-6 right-6 bg-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
      >
        + New Approval
      </Link>
    </div>
  );
}

export default ApprovalList;
