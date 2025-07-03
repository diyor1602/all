import { Routes, Route } from "react-router-dom";
import Logs from "./Logs";

const Ceo = () => {
  return (
    <div>
      <Routes>
        <Route path="logs" element={<Logs />} />
      </Routes>
    </div>
  );
};

export default Ceo;
