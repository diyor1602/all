import React from "react";

const Salary = ({ userData }) => {
  const amount =
    userData.salaryPayments?.find((p) => p.type === "salary")?.amount || 0;
  return (
    <div className="mt-4 p-4 rounded-xl bg-purple-50">
      <p className="font-medium text-purple-700">Maosh: {amount} so'm</p>
    </div>
  );
};

export default Salary;
