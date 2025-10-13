import { AnimatePresence, motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import SkeletonBox from "./SkeletonBox";
import eyesGif from "/eyes.gif";

const MessageList = ({
  sortedMessages,
  initialLoading,
  isMineMessage,
  activeContextMessageId,
  setActiveContextMessageId,
  handleCopyMessage,
  handleDeleteClick,
  handleEditClick,
  messagesEndRef,
}) => {
  return (
    <div className="relative z-10 flex flex-col">
      {initialLoading ? (
        <div className="space-y-4">
          <div className="flex justify-start">
            <SkeletonBox className="w-40 h-6 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <SkeletonBox className="w-32 h-6 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <SkeletonBox className="w-52 h-6 rounded-2xl" />
          </div>
        </div>
      ) : sortedMessages.length > 0 ? (
        <AnimatePresence initial={false}>
          {sortedMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="mb-2 w-full"
            >
              <MessageBubble
                message={message}
                isMineMessage={isMineMessage}
                activeContextMessageId={activeContextMessageId}
                setActiveContextMessageId={setActiveContextMessageId}
                onCopy={handleCopyMessage}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        <div className="flex-1 flex items-center justify-center mt-[calc(33vh)]">
          <div className="px-6 py-3 bg-gray-100/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 text-gray-600 text-sm font-medium flex items-center gap-2 flex-col">
            <img src={eyesGif} alt="Eyes" className="w-20 h-20" />
            <p>Suhbat hali boshlanmagan</p>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
