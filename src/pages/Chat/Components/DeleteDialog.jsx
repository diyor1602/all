import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DeleteDialog = ({
  open,
  setOpen,
  deletingMessageId,
  handleDelete,
  isDeleting,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xabarni o'chirishni tasdiqlaysimi?</DialogTitle>
          <DialogDescription className="text-red-500 text-sm">
            Diqqat! O'chirilgan xabarlarni tiklab bo'lmaydi! Xabar ikkala
            tomondan ham o'chirib yuboriladi!
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={() => handleDelete(deletingMessageId)}
            disabled={isDeleting}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
