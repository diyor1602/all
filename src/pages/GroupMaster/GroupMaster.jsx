import { Routes, Route } from "react-router-dom";
import Pending from "./Pending";
import Tailoring from "./Tailoring";
import ConnectToWork from "./ConnectToWork";

const GroupMaster = () => {
  return (
    <Routes>
      <Route path="pending" element={<Pending />} />
      <Route path="tailoring" element={<Tailoring />} />
      <Route path="tailoring/:id" element={<ConnectToWork />} />
    </Routes>
  );
};

export default GroupMaster;
