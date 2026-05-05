import { Route, Routes } from "react-router-dom";
import AllRequisitions from "./AllRequisitions";
import AddRequisition from "./AddRequisition";
import ApproveRequisition from "./ApproveRequisition";

const Requisitions = () => {
  return (
    <Routes>
      <Route path="/" element={<AllRequisitions />} />
      <Route path="/add" element={<AddRequisition />} />
      <Route path="/approve/:id" element={<ApproveRequisition />} />
    </Routes>
  );
};

export default Requisitions;
