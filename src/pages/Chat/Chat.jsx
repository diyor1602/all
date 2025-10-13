import { Routes, Route } from "react-router-dom";
import AllChats from "./AllChats";
import Contacts from "./Contacts";
import Personal from "./Personal/Personal";

const Chat = () => {
  return (
    <Routes>
      <Route path="/" element={<AllChats />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/personal/*" element={<Personal />} />
    </Routes>
  );
};

export default Chat;
