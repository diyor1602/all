import { Routes, Route } from "react-router-dom";
import New from "./New";
import OutcomePage from "./OutcomePage";

const Outcome = () => {
  return (
    <Routes>
      <Route path="*" element={<OutcomePage />} />
      <Route path="new" element={<New />} />
    </Routes>
  );
};

export default Outcome;
