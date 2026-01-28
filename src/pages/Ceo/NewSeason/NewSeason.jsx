import { Routes, Route, Navigate } from "react-router-dom";
import Departments from "./Departments";
import DepartmentView from "./DepartmentView";
import Overall from "./Overall";

const NewSeason = () => {
  return (
    <Routes>
      <Route path="/" element={<Departments />} />
      <Route path="departmentView/:id" element={<DepartmentView />} />
      <Route path="overall" element={<Overall />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default NewSeason;
