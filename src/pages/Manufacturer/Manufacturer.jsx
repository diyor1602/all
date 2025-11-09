import { Routes, Route } from "react-router-dom";
import Groups from "./Dashboard/Groups";

const Manufacturer = () => {
  return (
    <Routes>
      <Route path="groups" element={<Groups />} />
    </Routes>
  );
};

export default Manufacturer;
