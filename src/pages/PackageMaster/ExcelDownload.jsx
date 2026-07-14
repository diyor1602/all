import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToyBrick } from "lucide-react";

const ExcelDownload = () => {
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post(
        "packageMaster/package/reprint-stickers",
        formData,
      );

      if (response.data && response.data.url) {
        const fileUrl = response.data.url;

        const link = document.createElement("a");
        link.href = fileUrl;

        link.setAttribute("download", fileUrl.split("/").pop());

        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Muvaffaqiyat",
          description:
            response.data.message || "Fayl yuklab olish oynasi ochildi",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Xatolik",
        description: "Faylni yuklab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <ToyBrick className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Box Sticker Reprint</h2>
          <p className="text-sm text-muted-foreground">
            Excel faylini yuklang va box stickerlarni qayta chop eting
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Excel fayl</label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Tanlangan fayl: {selectedFile.name}
              </p>
            )}
          </div>

          <Button
            disabled={isSending || !selectedFile}
            onClick={() => {
              if (!selectedFile) {
                toast({
                  title: "Xatolik",
                  description: "Fayl tanlang",
                  variant: "destructive",
                });
                return;
              }
              handleSubmit();
            }}
            className="w-full"
          >
            {isSending ? "Yuklanmoqda..." : "Yuklash"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExcelDownload;
