import { Routes, Route } from "react-router-dom";
import ItemView from "./ItemView";
import Add from "./Add";
import Edit from "./Edit";

const Item = () => {
  return (
    <Routes>
      <Route path="*" element={<ItemView />} />
      <Route path="new" element={<Add />} />
      <Route path="edit/:id" element={<Edit />} />
    </Routes>
  );
};

export default Item;
