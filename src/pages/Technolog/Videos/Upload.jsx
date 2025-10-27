import { useState, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const startTime = useRef(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file)
      return toast({
        title: "Diqqat!",
        description: "Video tanlang!",
        variant: "destructive",
        duration: 2000,
      });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    try {
      setUploading(true);
      setProgress(0);
      setSpeed(0);
      setTimeLeft(0);
      startTime.current = Date.now();

      await api.post("/technologist/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (e) => {
          if (e.total) {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(percent);

            const elapsed = (Date.now() - startTime.current) / 1000; // seconds
            const bytesPerSecond = e.loaded / elapsed;
            const remainingBytes = e.total - e.loaded;
            const remainingSeconds = remainingBytes / bytesPerSecond;

            setSpeed((bytesPerSecond / (1024 * 1024)).toFixed(2)); // MB/s
            setTimeLeft(Math.max(0, remainingSeconds.toFixed(1)));
          }
        },
      });

      toast({
        title: "Muvaffaqiyatli!",
        description: "Video yuklandi!",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Xatolik!",
        description:
          error?.response?.data?.message || "Video yuklashda xatolik!",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-5 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 text-center">
        🎥 Video yuklash
      </h2>

      <div className="flex flex-col items-center space-y-3">
        <Textarea
          placeholder="Video nomi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file && (
          <>
            <p className="text-gray-500 text-sm">
              Tanlangan video:{" "}
              <span className="font-medium text-gray-700">{file.name}</span>
            </p>
            <p>
              <span className="font-medium text-gray-700">
                {parseFloat(file.size / 1024 / 1024)?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 2,
                })}{" "}
                MB
              </span>
            </p>
          </>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress}%</span>
            <span>
              {speed} MB/s • {timeLeft}s qoldi
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !file || !title}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? "Yuklanmoqda..." : "Yuklashni boshlash"}
      </button>
    </div>
  );
}
