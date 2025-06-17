import { Routes, Route, Navigate } from "react-router-dom";
import Result from "./Result/Result";
import ResultView from "./Result/ResultView";
import EmployeeResult from "./EmployeeResult/EmployeeResult";
import View from "./EmployeeResult/View";

const ResultChecker = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="/result" element={<Result />} />
      <Route path="/result/:id" element={<ResultView />} />
      <Route path="/employeeResult" element={<EmployeeResult />} />
      <Route path="/employeeResult/:id" element={<View />} />
    </Routes>
  );
};

export default ResultChecker;
