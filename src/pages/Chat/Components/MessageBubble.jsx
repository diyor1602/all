import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Copy,
  Trash2,
  Pencil,
  Reply,
  Forward,
  DownloadIcon,
  Clock,
} from "lucide-react";
import { formatTime } from "../helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

const MessageBubble = ({
  message,
  isMineMessage,
  activeContextMessageId,
  setActiveContextMessageId,
  onDelete,
  onCopy,
  onEdit,
}) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const renderMessageContent = () => {
    if (message.type === "image" && message.file_path) {
      return (
        <div
          className={`relative w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden border border-gray-300 shadow-sm`}
          onClick={() => {
            setSelectedImage(message);
            setImageDialogOpen(true);
          }}
        >
          <img
            src={message.file_path}
            alt="file"
            className="object-cover w-full h-full"
          />

          {message.content && (
            <div className="absolute bottom-0 w-full bg-black/40 px-3 py-2 backdrop-blur-sm">
              <p className={`text-white break-words`}>{message.content}</p>
              <p className="text-xs text-white/70 mt-1 text-right">
                {formatTime(message.created_at)}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (message.type === "voice" && message.file_path) {
      return (
        <VoiceMessagePlayer message={message} isMine={isMineMessage(message)} />
      );
    }

    return (
      <div
        className={`px-4 py-2 rounded-2xl shadow-sm ${
          isMineMessage(message)
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
        }`}
      >
        <p className={`break-words`}>{message.content}</p>
        <div className="flex justify-end text-xs mt-1 items-center gap-2">
          {message?.created_at !== message?.updated_at && (
            <p
              className={
                isMineMessage(message) ? "text-white/70" : "text-gray-500"
              }
            >
              Tahrirlangan
            </p>
          )}
          <p
            className={
              isMineMessage(message) ? "text-white/70" : "text-gray-500"
            }
          >
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <ContextMenu
        onOpenChange={(isOpen) =>
          setActiveContextMessageId(isOpen ? message.id : null)
        }
      >
        <div
          className={`w-full px-2 py-1 transition-colors flex ${
            isMineMessage(message) ? "justify-end" : "justify-start"
          } ${
            activeContextMessageId === message.id
              ? "bg-gray-200 dark:bg-gray-700"
              : ""
          }`}
        >
          <ContextMenuTrigger asChild>
            <div
              className={`inline-block max-w-xs cursor-pointer shadow-sm break-words`}
            >
              {renderMessageContent()}
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent>
            {!isMineMessage(message) &&
              message.updated_at !== message.created_at && (
                <ContextMenuItem className="flex items-center gap-2">
                  <Clock size={16} />
                  <div className="text-xs">
                    Tahrirlangan {formatTime(message.updated_at)}
                  </div>
                </ContextMenuItem>
              )}
            {isMineMessage(message) && !message.file_path && (
              <ContextMenuItem
                className="flex items-center gap-2"
                onSelect={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit(message);
                }}
              >
                <Pencil size={16} />
                <div className="text-xs">Tahrirlash</div>
              </ContextMenuItem>
            )}
            {message.content && (
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => onCopy(message.content)}
              >
                <Copy size={16} />
                <div className="text-xs">Nusxa olish</div>
              </ContextMenuItem>
            )}
            {message.file_path && (
              <ContextMenuItem
                className="flex items-center gap-2 text-green-600"
                onSelect={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const link = document.createElement("a");
                  link.href = message.file_path;
                  link.download = message.file_path.split("/").pop();
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <DownloadIcon size={16} />
                <span className="text-xs">Yuklab olish</span>
              </ContextMenuItem>
            )}
            {/* <ContextMenuItem className="flex items-center gap-2">
              <Reply size={16} />
              <div className="text-xs">Javob qaytarish</div>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center gap-2">
              <Forward size={16} />
              <div className="text-xs">Uzatish</div>
            </ContextMenuItem> */}
            {isMineMessage(message) && (
              <ContextMenuItem
                className="flex items-center gap-2 text-red-500"
                onSelect={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(message.id);
                }}
              >
                <Trash2 size={16} />
                <span className="text-xs">O'chirish</span>
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </div>
      </ContextMenu>

      <ImageDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        message={selectedImage}
      />
    </>
  );
};

const ImageDialog = ({ open, onClose, message }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-4 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{message?.content}</DialogTitle>
          <DialogDescription>
            {formatTime(message?.created_at)}
          </DialogDescription>
        </DialogHeader>
        <img
          src={message?.file_path}
          alt="image"
          className="w-full h-auto rounded-xl border border-gray-300 shadow-md mt-2"
        />
      </DialogContent>
    </Dialog>
  );
};

export default MessageBubble;
