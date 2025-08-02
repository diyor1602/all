import { Routes, Route } from "react-router-dom";
import Add from "./Add";
import All from "./All";

const Truck = () => {
  return (
    <Routes>
      <Route path="*" element={<All />} />
      <Route path="add" element={<Add />} />
    </Routes>
  );
};

export default Truck;
