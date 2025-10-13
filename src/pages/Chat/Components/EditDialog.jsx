import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatTime } from "../helpers";
import { useState, useEffect } from "react";

const EditDialog = ({ open, setOpen, message, handleEdit, isEditing }) => {
  const [tempValue, setTempValue] = useState("");

  // Reset tempValue whenever dialog opens or message changes
  useEffect(() => {
    if (open && message) {
      setTempValue(message.content || "");
    }
  }, [open, message]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xabarni tahrirlash?</DialogTitle>
          <DialogDescription className="text-red-500 text-sm">
            {formatTime(message?.created_at)}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={() => {
              handleEdit(message, tempValue);
            }}
            disabled={isEditing || tempValue.trim() === ""}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isEditing ? "Tahrirlanmoqda..." : "Tahrirlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;
