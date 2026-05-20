import { Routes, Route } from "react-router-dom";
import Supplier from "./Supplier";
import CreateOrder from "./Order/CreateOrder";
import ReceiveOrder from "./ReceiveOrder";

const SupplierIndex = () => {
  return (
    <Routes>
      <Route path="*" element={<Supplier />} />
      <Route path="create-order" element={<CreateOrder />} />
      <Route path="receive/:orderId" element={<ReceiveOrder />} />
    </Routes>
  );
};

export default SupplierIndex;
