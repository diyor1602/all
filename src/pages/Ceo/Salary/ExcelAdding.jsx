import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/utils/api";
import { toast } from "@/components/ui/use-toast";
import { useRef, useState } from "react";
import { CloudUpload, FileSpreadsheet, UploadCloud, X } from "lucide-react";

const ExcelAdding = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedMonth("");
    setComment("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    const isXlsx =
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isXlsx) {
      toast({
        title: "Noto'g'ri fayl",
        description: "Faqat .xlsx fayl tanlash mumkin!",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Fayl tanlanmagan",
        description: "Iltimos, .xlsx fayl tanlang.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMonth) {
      toast({
        title: "Oy tanlanmagan",
        description: "Iltimos, oy tanlang.",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Izoh kiritilmagan",
        description: "Iltimos, izoh kiriting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("month", selectedMonth);
      formData.append("comment", comment);
      formData.append("type", "advance");
      formData.append("paid_date", new Date().toISOString());

      const res = await api.post("/ceo/salaries/excel", formData, {
        responseType: "blob",
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const blob = new Blob([res.data], {
        type:
          res.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "Avans berilganlar.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Muvaffaqiyatli",
        description: "Fayl yuborildi va natija yuklab olindi.",
      });

      setDialogOpen(false);
      resetForm();
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast({
        title: "Xatolik",
        description: "Faylni yuklab bo'lmadi!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} size="icon" variant="outline">
        <CloudUpload className="h-4 w-4" />
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excel orqali ma&apos;lumotlarni kiritish</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Excel fayl (.xlsx)</label>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="group relative overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 p-6 transition-all hover:bg-muted/50 hover:border-primary/40 cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm border">
                      <UploadCloud className="h-7 w-7 text-primary" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Faylni tanlang yoki shu yerga tashlang
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Faqat .xlsx fayllar qo'llab-quvvatlanadi
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background/80 p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background hover:bg-muted transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Oy</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Izoh <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Izoh kiriting"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-xl"
            >
              {loading ? "Yuklanmoqda..." : "Yuklash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExcelAdding;
