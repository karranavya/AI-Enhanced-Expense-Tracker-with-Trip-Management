import React from "react";
import TripRow from "./TripRow";

function RecentTrips({ trips = [], onDelete = () => {} }) {
  console.log("Trips received:", trips);

  if (!Array.isArray(trips)) {
    console.error("Error: trips is not an array!", trips);
    return <p className="text-red-500">Error loading trips</p>;
  }

  // Get latest 3 trips sorted by start date
  const latestTrips = [...trips]
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 3);

  return (
    <div className="bg-[#141414] rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Recent Trips</h2>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500">
            <th>Destination</th>
            <th>Start</th>
            <th>End</th>
            <th>Budget</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className="text-sm text-white">
          {latestTrips.length > 0 ? (
            latestTrips.map((trip) => (
              <TripRow key={trip._id} trip={trip} onDelete={onDelete} />
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">
                No recent trips to show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RecentTrips;
