import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Mic, Send, Loader2, X, Square } from "lucide-react";
import api from "@/utils/api";

const MAX_MESSAGE_LENGTH = 4096;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VOICE_SIZE = 20 * 1024 * 1024; // 20MB

const ChatInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  userId,
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [sending, setSending] = useState(false);

  // 🎤 Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voicePreview, setVoicePreview] = useState(null);

  // Auto-expand textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [newMessage]);

  // Handle Enter / Shift+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() || imageFile || voiceBlob) sendMessage();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) setNewMessage(value);
  };

  // File input (images)
  const handleSelectImage = () => fileInputRef.current?.click();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Rasm hajmi 20MB dan oshmasligi kerak");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 🎤 Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (blob.size > MAX_VOICE_SIZE) {
          alert("Ovozli xabar hajmi 20MB dan oshmasligi kerak");
          return;
        }
        setVoiceBlob(blob);
        setVoicePreview(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
    } catch (err) {
      alert("Mikrofonga ruxsat berilmadi");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setRecorder(null);
    }
  };

  const removeVoice = () => {
    setVoiceBlob(null);
    setVoicePreview(null);
  };

  // Send message (text, image, voice)
  const sendMessage = async () => {
    if (!newMessage.trim() && !imageFile && !voiceBlob) return;

    setSending(true);
    try {
      const formData = new FormData();

      if (imageFile) {
        formData.append("type", "image");
        formData.append("file", imageFile);
        if (newMessage.trim()) formData.append("content", newMessage);
      } else if (voiceBlob) {
        formData.append("type", "voice");
        formData.append("file", voiceBlob, "voice-message.webm");
      } else {
        formData.append("type", "text");
        formData.append("content", newMessage);
      }

      formData.append("user_id", userId);

      await api.post("/chats/personal/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset
      setNewMessage("");
      removeImage();
      removeVoice();

      // Refresh chat
      await handleSendMessage({ refreshOnly: true });
    } catch (err) {
      alert("Xatolik: xabar yuborilmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 bg-white border-t flex flex-col gap-2">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-300">
          <img
            src={imagePreview}
            alt="preview"
            className="object-cover w-full h-full"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Voice preview */}
      {voicePreview && (
        <div className="relative flex items-center gap-2 p-2 border rounded-xl bg-gray-100">
          <audio controls src={voicePreview} className="flex-1" />
          <button
            type="button"
            onClick={removeVoice}
            className="bg-white/80 rounded-full p-1 hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {/* Attach image */}
        <Button
          onClick={handleSelectImage}
          className="rounded-full p-3 bg-gray-500 hover:bg-gray-600 text-white shadow"
          size="icon"
        >
          <Paperclip size={18} />
        </Button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          disabled={sending}
          placeholder="Xabar yozing..."
          value={newMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 border rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 resize-none overflow-hidden max-h-[50vh]"
        />

        {/* Voice recording */}
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className={`rounded-full p-3 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-500 hover:bg-gray-600"
          } text-white shadow`}
          size="icon"
        >
          {isRecording ? (
            <Square size={18} className="animate-pulse" />
          ) : (
            <Mic size={18} />
          )}
        </Button>

        {/* Send */}
        <Button
          onClick={sendMessage}
          disabled={sending || (!newMessage.trim() && !imageFile && !voiceBlob)}
          className="rounded-full p-3 bg-blue-500 hover:bg-blue-600 text-white shadow"
          size="icon"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
