import { useState, useEffect, useRef, useMemo } from "react";
import api from "@/utils/api";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import ChatHeader from "../Components/ChatHeader";
import MessageList from "../Components/MessageList";
import ChatInput from "../Components/ChatInput";
import DeleteDialog from "../Components/DeleteDialog";
import EditDialog from "../Components/EditDialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const PersonalChat = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [chat, setChat] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDialogOpen, setEditingDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [activeContextMessageId, setActiveContextMessageId] = useState(null);

  const [hasNewMessages, setHasNewMessages] = useState(false);

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const prevMessagesSignature = useRef("");

  const isMineMessage = (message) =>
    String(message.sender_id) === String(localStorage.getItem("user_id"));

  const scrollToBottom = (behavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessages(false); // hide button if we scroll
  };

  const isAtBottom = (container, offset = 50) => {
    if (!container) return false;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      offset
    );
  };

  const fetchChatData = async (isInitial = false, fromSend = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      const response = await api.get(`/chats/personal/${id}`);
      const newData = response.data;

      const newSignature = buildSignature(newData?.messages);
      const prevSignature = prevMessagesSignature.current;

      if (newSignature !== prevSignature) {
        const prevLastId = chat?.messages?.at(-1)?.id;
        const newLastId = newData?.messages?.at(-1)?.id;

        prevMessagesSignature.current = newSignature;
        setChat(newData);

        const container = chatContainerRef.current;

        if (fromSend) {
          // if it's from sending → always scroll
          setTimeout(() => scrollToBottom("smooth"), 50);
        } else {
          if (!isInitial) {
            // 👇 only treat as "new messages" if a new one was added
            if (newLastId && (!prevLastId || newLastId > prevLastId)) {
              if (isAtBottom(container)) {
                setTimeout(() => scrollToBottom("smooth"), 50);
              } else {
                setHasNewMessages(true);
              }
            }
          }
        }
      }

      if (isInitial) {
        setTimeout(() => scrollToBottom("auto"), 50);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Chat ma'lumotlari olishda xatolik",
      });
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchChatData(true);
  }, [id]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(() => fetchChatData(false, false), 10000);
    return () => clearInterval(interval);
  }, [id]);

  const buildSignature = (messages) => {
    if (!messages) return "";
    return messages
      .map(
        (m) =>
          `${m.id}:${m.content ?? ""}:${m.updated_at ?? ""}:${
            m.deleted_at ?? ""
          }`
      )
      .join("|");
  };

  const getMessageTime = (msg) => {
    if (!msg) return 0;
    const t = msg.created_at ?? msg.createdAt ?? null;
    if (t) {
      const d = new Date(String(t).replace(" ", "T"));
      if (!isNaN(d)) return d.getTime();
    }
    const idNum = Number(msg.id);
    return isNaN(idNum) ? 0 : idNum;
  };

  const sortedMessages = useMemo(() => {
    if (!chat?.messages) return [];
    return [...chat.messages].sort(
      (a, b) => getMessageTime(a) - getMessageTime(b)
    );
  }, [chat?.messages]);

  const handleSendMessage = async ({ refreshOnly = false } = {}) => {
    if (refreshOnly) {
      await fetchChatData(false, true);
      return;
    }
  };

  const handleDeleteMessage = async (msgId) => {
    setIsDeleting(true);
    try {
      await api.delete(`/messages/${msgId}`);
      await fetchChatData(false, false);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xabar o'chirishda xatolik",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Nusxa olindi",
      description: "Xabar nusxalandi",
      duration: 1000,
    });
  };

  const handleDeleteClick = (msgId) => {
    setDeleteDialogOpen(true);
    setDeletingMessageId(msgId);
  };

  const handleEditClick = (message) => {
    setEditingMessage(message);
    setEditingDialogOpen(true);
  };

  const handleEditMessage = async (message, newContent) => {
    setIsEditing(true);
    try {
      await api.patch(`/messages/${message.id}`, { content: newContent });
      await fetchChatData(false, false);
      setEditingMessage(null);
      toast({
        title: "Tahrir qilindi",
        description: "Xabar yangilandi",
        duration: 1000,
      });
      setEditingDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xabarni tahrirlashda xatolik",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Hide new message button if user scrolls to bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isAtBottom(container)) {
        setHasNewMessages(false);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <ChatHeader chat={chat} initialLoading={initialLoading} />

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto relative p-4 
                   bg-[url('/chatbg.svg')] bg-cover sm:bg-repeat sm:bg-auto sm:bg-center"
        style={{
          backgroundBlendMode: "multiply",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <MessageList
          sortedMessages={sortedMessages}
          initialLoading={initialLoading}
          isMineMessage={isMineMessage}
          activeContextMessageId={activeContextMessageId}
          setActiveContextMessageId={setActiveContextMessageId}
          handleCopyMessage={handleCopyMessage}
          handleDeleteClick={handleDeleteClick}
          handleEditClick={handleEditClick}
        />

        {/* bottom anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed "new messages" button */}
      {/* Fixed "new messages" button with animation */}
      <AnimatePresence>
        {hasNewMessages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              onClick={() => scrollToBottom("smooth")}
              className="px-4 py-2 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
            >
              Sizda yangi xabarlar mavjud
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        userId={id}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        deletingMessageId={deletingMessageId}
        handleDelete={handleDeleteMessage}
        isDeleting={isDeleting}
      />

      <EditDialog
        open={editingDialogOpen}
        setOpen={setEditingDialogOpen}
        message={editingMessage}
        handleEdit={handleEditMessage}
        isEditing={isEditing}
      />
    </div>
  );
};

export default PersonalChat;
