import { Routes, Route, Navigate } from "react-router-dom";
import Departments from "./Departments";
import DepartmentView from "./DepartmentView";

const NewSeason = () => {
  return (
    <Routes>
      <Route path="/" element={<Departments />} />
      <Route path="departmentView/:id" element={<DepartmentView />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default NewSeason;
