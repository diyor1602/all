import { Routes, Route } from "react-router-dom";
import ItemView from "./ItemView";
import Add from "./Add";

const Item = () => {
  return (
    <Routes>
      <Route path="*" element={<ItemView />} />
      <Route path="new" element={<Add />} />
    </Routes>
  );
};

export default Item;
