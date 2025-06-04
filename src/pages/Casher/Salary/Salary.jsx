import { Routes, Route } from "react-router-dom";
import SalaryPage from "./SalaryPage";
import SalaryDetails from "./SalaryDetails";
import Salary2 from "./Salary2";

const Salary = () => {
  return (
    <Routes>
      <Route path="*" element={<Salary2 />} />
      <Route path=":id" element={<SalaryDetails />} />
    </Routes>
  );
};

export default Salary;
