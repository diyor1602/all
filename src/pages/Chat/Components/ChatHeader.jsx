import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SkeletonBox from "./SkeletonBox";

const ChatHeader = ({ chat, initialLoading }) => {
  return (
    <div className="relative bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200">
      <div className="flex items-center gap-3 p-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-gray-700 hover:bg-gray-100 rounded-full border border-gray-300"
        >
          <Link to="/chat">
            <ArrowLeft />
          </Link>
        </Button>

        {initialLoading ? (
          <>
            <SkeletonBox className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <SkeletonBox className="h-4 w-32 mb-2" />
              <SkeletonBox className="h-3 w-24" />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              {chat?.other_user?.img ? (
                <img
                  src={chat?.other_user?.img}
                  alt={chat?.other_user?.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {chat?.other_user?.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${
                  chat?.other_user?.attendance_status === "present"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-gray-900">
                {chat?.other_user?.name}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {chat?.other_user?.position_name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
