import { Routes, Route, Navigate } from "react-router-dom";
import Departments from "./Departments";
import DepartmentView from "./DepartmentView";
import Overall from "./Overall";
import Overall2 from "./Overall2";

const NewSeason = () => {
  return (
    <Routes>
      <Route path="/" element={<Departments />} />
      <Route path="departmentView/:id" element={<DepartmentView />} />
      <Route path="overall" element={<Overall />} />
      <Route path="overall2" element={<Overall2 />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default NewSeason;
