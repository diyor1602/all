import { Routes, Route } from "react-router-dom";
import RequestsPage from "./RequestsPage";
import Add from "./Add";

const Requests = () => {
  return (
    <Routes>
      <Route path="*" element={<RequestsPage />} />
      <Route path="add" element={<Add />} />
    </Routes>
  );
};

export default Requests;
