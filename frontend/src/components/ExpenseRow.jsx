import React from "react";

function ExpenseRow({
  expenseType,
  description,
  to,
  date,
  amount,
  paymentMethod,
  tags,
}) {
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      <td className="p-3">
        <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs border border-blue-700">
          {expenseType || "Other"}
        </span>
      </td>
      <td className="p-3 text-white">
        <div>
          <p className="font-medium">{description}</p>
          {tags && tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-700 text-gray-300 px-1 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-gray-500 text-xs">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="p-3 text-gray-300">{to}</td>
      <td className="p-3 text-gray-300">{date}</td>
      <td className="p-3 text-right">
        <div>
          <p className="font-semibold text-green-400">
            ₹
            {parseFloat(amount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
          {paymentMethod && (
            <p className="text-xs text-gray-500">{paymentMethod}</p>
          )}
        </div>
      </td>
    </tr>
  );
}

export default ExpenseRow;
