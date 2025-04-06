import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders";
import OrderView from "./OrderView";
import EditSpec from "./EditSpec";
import NewSpec from "./NewSpec";

const Constructor = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="edit-spec/:id" element={<EditSpec />} />
      <Route path="new-spec/:id" element={<NewSpec />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Constructor;
