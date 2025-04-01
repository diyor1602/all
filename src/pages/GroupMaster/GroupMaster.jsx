import { Routes, Route } from "react-router-dom";
import Pending from "./Pending";

const GroupMaster = () => {
  return (
    <Routes>
      <Route path="pending" element={<Pending />} />
    </Routes>
  );
};

export default GroupMaster;
