import { Routes, Route } from "react-router-dom";
import ManualPage from "./ManualPage";
import Work from "./Work";
import Employees from "./Employees";

const Manual = () => {
  return (
    <Routes>
      <Route path="*" element={<ManualPage />} />
      <Route path="employees/:id" element={<Employees />} />
      <Route path="work/:id" element={<Work />} />
    </Routes>
  );
};

export default Manual;
