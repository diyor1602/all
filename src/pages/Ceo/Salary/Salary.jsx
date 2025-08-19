import { Routes, Route } from "react-router-dom";
import SalaryPage from "./SalaryPage";
import SalaryDetails from "./SalaryDetails";

const Salary = () => {
  return (
    <Routes>
      <Route path="*" element={<SalaryPage />} />
      <Route path=":id" element={<SalaryDetails />} />
    </Routes>
  );
};

export default Salary;
