import {
  Check,
  CheckCheck,
  Plus,
  MessageCircle,
  Users2,
  MessagesSquare,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatTime } from "./helpers";

const chatVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// --- Sorting Helper ---
const parseTime = (time) => {
  if (!time) return 0;
  if (/^\d{2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
  const date = new Date(time.replace(" ", "T"));
  return isNaN(date) ? 0 : date.getTime();
};

// --- Chat Item ---
const ChatItem = ({ chat }) => {
  return (
    <motion.div
      variants={chatVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3 }}
      layout
    >
      <Link
        className="flex items-center gap-3 border-b pb-2"
        to={
          chat.type === "personal"
            ? `/chat/personal/${chat.otherUserId}`
            : `/chat/group/${chat.id}`
        }
      >
        {chat?.image ? (
          <img
            src={chat.image}
            alt={chat.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {chat.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{chat.name}</p>
          <p className="text-xs text-gray-500 truncate">{chat.message}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-500">{formatTime(chat.time)}</span>
          <div>
            {chat.newMessageCount > 0 ? (
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">
                {chat.newMessageCount}
              </div>
            ) : chat.newMessageCount === -1 ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <CheckCheck size={18} className="text-green-500" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// --- Chat List ---
const ChatList = ({ chats }) => (
  <div className="flex flex-col gap-2 mt-4">
    <AnimatePresence>
      {chats.length === 0 ? (
        <div className="mt-4 text-gray-500">Hozircha chatlar yo‘q</div>
      ) : (
        chats.map((chat, index) => (
          <ChatItem key={chat.name + index} chat={chat} />
        ))
      )}
    </AnimatePresence>
  </div>
);

// Tabs with icons
const tabs = [
  { key: "all", label: "Barchasi", icon: MessagesSquare },
  { key: "personal", label: "Shaxsiy", icon: MessageCircle },
  { key: "group", label: "Guruxlar", icon: Users2 },
];

// --- Main Component ---
const AllChats = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [chatData, setChatData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const response = await api.get("/chats");
        setChatData(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description:
            error.response?.data?.message ||
            "Chat ma'lumotlari olishda xatolik",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchChatData();
  }, [toast]);

  const sortedChatData = [...chatData].sort(
    (a, b) => parseTime(b.time) - parseTime(a.time)
  );

  const filteredChats =
    activeTab === "all"
      ? sortedChatData
      : sortedChatData.filter((chat) => chat.type === activeTab);

  const handleSwipe = (direction) => {
    const currentIndex = tabs.findIndex((t) => t.key === activeTab);
    if (direction === "left" && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].key);
    }
    if (direction === "right" && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].key);
    }
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl",
              activeTab === tab.key
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-500 hover:bg-gray-100"
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="w-10 h-10 text-blue-500" />
          </motion.div>
        </div>
      ) : (
        <motion.div
          className="mt-4"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(event, info) => {
            if (info.offset.x < -100) handleSwipe("left");
            else if (info.offset.x > 100) handleSwipe("right");
          }}
        >
          <ChatList chats={filteredChats} />
        </motion.div>
      )}

      {/* Floating Add Button */}
      <Link to="/chat/contacts">
        <button className="mt-4 fixed bottom-6 right-6 rounded-full z-10 bg-blue-500 hover:bg-blue-600 cursor-pointer w-14 h-14 shadow-lg flex items-center justify-center text-white">
          <Plus size={20} />
        </button>
      </Link>
    </div>
  );
};

export default AllChats;
