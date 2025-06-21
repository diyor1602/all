import { Routes, Route } from "react-router-dom";
import HolidayPage from "./HolidayPage";
import AddHoliday from "./AddHoliday";

const Holiday = () => {
  return (
    <Routes>
      <Route path="*" element={<HolidayPage />} />
      <Route path="add" element={<AddHoliday />} />
    </Routes>
  );
};

export default Holiday;
