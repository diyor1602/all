import { Routes, Route } from "react-router-dom";
import Add from "./Add";
import Edit from "./Edit";
import LidsPage from "./LidsPage";

const Lids = () => {
  return (
    <Routes>
      <Route path="*" element={<LidsPage />} />
      <Route path="add" element={<Add />} />
      <Route path="edit/:id" element={<Edit />} />
    </Routes>
  );
};

export default Lids;
