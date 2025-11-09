import { Routes, Route } from "react-router-dom";
import Groups from "./Dashboard/Groups";
import Employees from "./Employees/Employees";
import ViewEmployee from "./Employees/ViewEmployee";
import Settings from "./Settings/Settings";

const Manufacturer = () => {
  return (
    <Routes>
      <Route path="groups" element={<Groups />} />
      <Route path="employees" element={<Employees />} />
      <Route path="employees/:id" element={<ViewEmployee />} />
      <Route path="settings/*" element={<Settings />} />
    </Routes>
  );
};

export default Manufacturer;
