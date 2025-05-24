import { Routes, Route } from "react-router-dom";
import OutcomePage from "./OutcomePage";
import Add from "./Add";

const Outcome = () => {
  return (
    <Routes>
      <Route path="add" element={<Add />} />
      <Route path="*" element={<OutcomePage />} />
    </Routes>
  );
};

export default Outcome;
