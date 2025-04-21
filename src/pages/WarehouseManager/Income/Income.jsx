import { Routes, Route } from "react-router-dom";
import New from "./New";
import IncomePage from "./IncomePage";

const Income = () => {
  return (
    <Routes>
      <Route path="*" element={<IncomePage />} />
      <Route path="new" element={<New />} />
    </Routes>
  );
};

export default Income;
