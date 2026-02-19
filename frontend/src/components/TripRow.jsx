import React from "react";
import { Trash2, MapPin, Calendar } from "lucide-react";

function TripRow({ trip, onDelete }) {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const isUpcoming = startDate > new Date();
  const isActive = startDate <= new Date() && endDate >= new Date();

  const getStatusColor = () => {
    if (isActive) return "bg-green-600";
    if (isUpcoming) return "bg-blue-600";
    return "bg-gray-600";
  };

  const getStatusText = () => {
    if (isActive) return "Active";
    if (isUpcoming) return "Upcoming";
    return "Completed";
  };

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-white">{trip.destination}</p>
            {trip.notes && (
              <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                {trip.notes}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="p-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4 text-green-400" />
          {startDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </td>

      <td className="p-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4 text-red-400" />
          {endDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </td>

      <td className="p-4">
        <div className="text-white font-semibold">
          ₹{parseFloat(trip.budget).toLocaleString("en-IN")}
        </div>
        <div className="text-xs text-gray-400">
          ₹{Math.round(trip.budget / duration).toLocaleString("en-IN")}/day
        </div>
      </td>

      <td className="p-4">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full text-white ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {duration} {duration === 1 ? "day" : "days"}
        </div>
      </td>

      <td className="p-4">
        <button
          onClick={() => onDelete(trip._id)}
          className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors text-sm font-medium bg-red-900/20 hover:bg-red-900/40 px-3 py-1 rounded-lg"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </td>
    </tr>
  );
}

export default TripRow;
