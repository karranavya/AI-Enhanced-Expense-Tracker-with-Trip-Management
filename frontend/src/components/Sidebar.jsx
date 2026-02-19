import React from "react";
import { Link } from "react-router-dom";
import logo from "../../public/images/logo.jpg";

// Fix: Use only lucide-react icons, not recharts PieChart
import {
  Home,
  CreditCard,
  Plane,
  CheckSquare,
  BarChart2,
  Brain,
  BarChart3,
} from "lucide-react";

function Sidebar() {
  return (
    <div className="w-64 fixed h-full bg-[#141414] p-6 flex flex-col">
      {/* Profile Section */}
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-lg font-semibold">Username</h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1">
        <Link
          to="/"
          className="flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-[#1a1a1a] border-l-2 border-yellow-500"
        >
          <Home size={20} className="text-yellow-400" />
          <span>Home</span>
        </Link>

        <Link
          to="/expenses"
          className="flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-[#1a1a1a] border-l-2 border-orange-500"
        >
          <CreditCard size={20} className="text-orange-400" />
          <span>Expenses</span>
        </Link>

        <Link
          to="/trips"
          className="flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-[#1a1a1a] border-l-2 border-red-500"
        >
          <Plane size={20} className="text-red-400" />
          <span>Trips</span>
        </Link>

        <Link
          to="/approvals"
          className="flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-[#1a1a1a] border-l-2 border-pink-500"
        >
          <CheckSquare size={20} className="text-pink-400" />
          <span>Approvals</span>
        </Link>

        <Link
          to="/tracking"
          className="flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-[#1a1a1a] border-l-2 border-purple-500"
        >
          <BarChart2 size={20} className="text-purple-400" />
          <span>Analytics</span>
        </Link>

        {/* Category Insights Link - Fixed: Use BarChart3 instead of PieChart */}
        <Link
          to="/category-insights"
          className="flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-[#1a1a1a] border-l-2 border-violet-500"
        >
          <Brain size={20} className="text-violet-400" />
          <span>Category Insights</span>
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;
