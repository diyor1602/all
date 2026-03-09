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
import Calc from "./Calc/Calc";
import OverCalc from "./OverCalc/OverCalc";
import NewSeason from "./NewSeason/NewSeason";
import Settings from "./Settings/Settings";

const Ceo = () => {
  return (
    <Routes>
      <Route path="income" element={<Income />} />
      <Route path="outcome/*" element={<Outcome />} />
      <Route path="balance/*" element={<Balance />} />
      <Route path="requests/*" element={<Requests />} />
      <Route path="transfer" element={<Transfer />} />
      <Route path="salary/*" element={<Salary />} />
      <Route path="employees" element={<Employees />} />
      <Route path="daily" element={<Daily />} />
      <Route path="monthly" element={<Monthly />} />
      <Route path="calc/*" element={<Calc />} />
      <Route path="overcalc/*" element={<OverCalc />} />
      <Route path="newSeason/*" element={<NewSeason />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Ceo;
