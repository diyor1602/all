import { Routes, Route } from "react-router-dom";
import ItemView from "./ItemView";
import Add from "./Add";
import Edit from "./Edit";
import ItemShow from "./ItemShow";

const Item = () => {
  return (
    <Routes>
      <Route path="*" element={<ItemView />} />
      <Route path="new" element={<Add />} />
      <Route path="edit/:id" element={<Edit />} />
      <Route path="show/:id" element={<ItemShow />} />
    </Routes>
  );
};

export default Item;
