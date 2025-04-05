import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";
import EditSpec from "./Orders/EditSpec";
import EditTarif from "./Orders/EditTarif";
import NewSpec from "./Orders/NewSpec";
import NewTarif from "./Orders/NewTarif";

const Technolog = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="edit-spec/:id" element={<EditSpec />} />
      <Route path="edit-tarif/:id" element={<EditTarif />} />
      <Route path="new-spec/:id" element={<NewSpec />} />
      <Route path="new-tarif/:id" element={<NewTarif />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Technolog;
