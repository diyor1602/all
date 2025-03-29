import { Routes, Route } from "react-router-dom";
import Spesification from "./Spesification/Spesification";
import Tarification from "./Tarification/Tarification";

const HomeElement = () => {
  return <div>Transport</div>;
};

const Technolog = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeElement />}>
        <Route path="spesification" element={<Spesification />} />
        <Route path="tarification" element={<Tarification />} />
      </Route>
    </Routes>
  );
};

export default Technolog;
