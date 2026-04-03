import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";
import EditSpec from "./Orders/EditSpec";
import EditTarif from "./Orders/EditTarif";
import NewSpec from "./Orders/NewSpec";
import NewTarif from "./Orders/NewTarif";
import Machines from "./Machines/Machines";
import Nakladnoy from "./Nakladnoy";
import Videos from "./Videos/Videos";
import Employees from "./Employees/Employees";
import ViewEmployees from "./Employees/ViewEmployees";

const Technolog = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="edit-spec/:id" element={<EditSpec />} />
      <Route path="edit-tarif/:id" element={<EditTarif />} />
      <Route path="new-spec/:id" element={<NewSpec />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="new-tarif/:id" element={<NewTarif />} />
      <Route path="machines" element={<Machines />} />
      <Route path="nakladnoy" element={<Nakladnoy />} />
      <Route path="videos/*" element={<Videos />} />
      <Route path="employees" element={<Employees />} />
      <Route path="employees/view/:id" element={<ViewEmployees />} />
    </Routes>
  );
};

export default Technolog;
