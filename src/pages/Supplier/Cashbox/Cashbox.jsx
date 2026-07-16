import { Routes, Route } from "react-router-dom";
import Transactions from "./Transactions";
import Debts from "./Debts";

const Cashbox = () => {
  return (
    <Routes>
      <Route path="/" element={<Transactions />} />
      <Route path="/debts" element={<Debts />} />
    </Routes>
  );
};

export default Cashbox;
