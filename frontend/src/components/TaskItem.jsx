import React from "react";

function TaskItem({ icon, text, count }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-gray-400">{icon}</span>
        <span>{text}</span>
      </div>
      <span className="font-semibold">{count}</span>
    </div>
  );
}

export default TaskItem;
