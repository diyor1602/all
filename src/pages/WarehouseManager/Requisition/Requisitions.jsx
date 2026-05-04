import { Route, Routes } from "react-router-dom";
import AllRequisitions from "./AllRequisitions";
import AddRequisition from "./AddRequisition";

const Requisitions = () => {
  return (
    <Routes>
      <Route path="/" element={<AllRequisitions />} />
      <Route path="/add" element={<AddRequisition />} />
    </Routes>
  );
};

export default Requisitions;
