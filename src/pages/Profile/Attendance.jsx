import React from "react";

const Attendance = ({ attendedDays }) => {
  return (
    <div className="mt-4 p-4 rounded-xl bg-blue-50">
      <p className="font-medium text-blue-700">{attendedDays} kun kelgan</p>
    </div>
  );
};

export default Attendance;
