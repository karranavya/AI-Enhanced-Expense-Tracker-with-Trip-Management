import React from "react";
import ExpenseRow from "./ExpenseRow";

function RecentExpenses({ expenses }) {
  console.log("Expenses received:", expenses); // Debugging log

  if (!Array.isArray(expenses)) {
    console.error("Error: expenses is not an array!", expenses);
    return <p className="text-red-500">Error loading expenses</p>;
  }

  // Get latest 3 expenses (sorted by date)
  const latestExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div className="bg-[#141414] rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500">
            <th>Subject</th>
            <th>To</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {latestExpenses.map((expense, index) => (
            <ExpenseRow
              key={index}
              subject={expense.subject}
              to={expense.to}
              date={expense.date}
              amount={expense.amount}
              teamColor={expense.teamColor || "bg-blue-600"}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentExpenses;
