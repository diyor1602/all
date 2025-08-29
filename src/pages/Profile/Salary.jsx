import React from "react";

const Salary = ({ amount }) => {
  return (
    <div className="mt-4 p-4 rounded-xl bg-purple-50">
      <p className="font-medium text-purple-700">Maosh: {amount} so'm</p>
    </div>
  );
};

export default Salary;
