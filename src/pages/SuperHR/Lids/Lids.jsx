import { Routes, Route } from "react-router-dom";
import Add from "./Add";
import LidsPage from "./LidsPage";

const Lids = () => {
  return (
    <Routes>
      <Route path="*" element={<LidsPage />} />
      <Route path="add" element={<Add />} />
    </Routes>
  );
};

export default Lids;
