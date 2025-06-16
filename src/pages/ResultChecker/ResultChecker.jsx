import { Routes, Route, Navigate } from "react-router-dom";
import Result from "./Result/Result";
import ResultView from "./Result/ResultView";

const ResultChecker = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="/result" element={<Result />} />
      <Route path="/result/:id" element={<ResultView />} />
    </Routes>
  );
};

export default ResultChecker;
