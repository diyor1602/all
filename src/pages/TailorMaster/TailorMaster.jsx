import { Routes, Route } from "react-router-dom";
import Pending from "./Pending";

const TailorMaster = () => {
  return (
    <Routes>
      <Route path="pending" element={<Pending />} />
    </Routes>
  );
};

export default TailorMaster;
