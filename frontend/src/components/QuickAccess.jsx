import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, Receipt, FileText, Plane } from "lucide-react";

function QuickAccess() {
  return (
    <div className="mt-6 bg-[#141414] rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
      <div className="grid grid-cols-4 gap-4">
        <button className="bg-purple-700 p-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
          <CreditCard />
          <Link to="/add-expense">
            <span>+ New expense</span>
          </Link>
        </button>
        <button className="bg-blue-700 p-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Receipt />
          <Link to="/add-approval">
            <span>+ Pending Expense</span>
          </Link>
        </button>

        <button className="bg-red-700 p-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plane />
          <Link to="/add-trip">
            <span>+ Create trip</span>
          </Link>
        </button>
      </div>
    </div>
  );
}

export default QuickAccess;
