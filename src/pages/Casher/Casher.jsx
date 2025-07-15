import { Routes, Route, Navigate } from "react-router-dom";
import Income from "./Income/Income";
import Outcome from "./Outcome/Outcome";
import Balance from "./Balance/Balance";
import Requests from "./Requests/Requests";
import Transfer from "./Transfer/Transfer";
import Salary from "./Salary/Salary";
import Employees from "./Employees/Employees";
import Daily from "./Daily/Daily";
import Monthly from "./Monthly/Monthly";
import Tailor from "./Tailor/Tailor";

const Casher = () => {
  return (
    <Routes>
      <Route path="income/*" element={<Income />} />
      <Route path="outcome/*" element={<Outcome />} />
      <Route path="balance/*" element={<Balance />} />
      <Route path="requests/*" element={<Requests />} />
      <Route path="transfer" element={<Transfer />} />
      <Route path="salary/*" element={<Salary />} />
      <Route path="employees" element={<Employees />} />
      <Route path="daily" element={<Daily />} />
      <Route path="monthly" element={<Monthly />} />
      <Route path="tailor" element={<Tailor />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Casher;
