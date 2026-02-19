import React from "react";

function QuickAccessButton({ icon, text, bgColor }) {
  return (
    <button
      className={`${bgColor} p-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export default QuickAccessButton;
