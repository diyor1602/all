import { Routes, Route } from "react-router-dom";
import IncomePage from "./IncomePage";
import Add from "./Add";

const Income = () => {
  return (
    <Routes>
      <Route path="add" element={<Add />} />
      <Route path="*" element={<IncomePage />} />
    </Routes>
  );
};

export default Income;
