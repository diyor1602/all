import { Routes, Route } from "react-router-dom";
import Departments from "./Departments";

const Calc = () => {
  return (
    <Routes>
      <Route path="*" element={<Departments />} />
    </Routes>
  );
};

export default Calc;
