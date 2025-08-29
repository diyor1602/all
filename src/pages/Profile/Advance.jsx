import React from "react";

const Advance = ({ userData }) => {
  const amount =
    userData.salaryPayments?.find((p) => p.type === "advance")?.amount || 0;
  return (
    <div className="mt-4 p-4 rounded-xl bg-orange-50">
      <p className="font-medium text-orange-700">Avans: {amount} so'm</p>
    </div>
  );
};

export default Advance;
