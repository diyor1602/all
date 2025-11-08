// ModelImage.jsx
import useModelImages from "@/hooks/useModelImages";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ModelImage = ({ modelCode }) => {
  const { images, loading, error } = useModelImages(modelCode);

  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center w-full h-24 bg-gray-100 rounded-xl animate-pulse border border-gray-200 p-5">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center w-full h-24 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm gap-2 p-5">
          <AlertTriangle className="w-4 h-4" />
          <span>Rasmlari olishda xatolik</span>
        </div>
      )}

      {/* Images */}
      {!loading &&
        !error &&
        images.length > 0 &&
        images.map((image, index) => (
          <div
            key={index}
            className="w-20 h-20 rounded-xl overflow-hidden shadow-md border border-gray-200 hover:scale-105 transition-transform"
          >
            <img
              src={image}
              alt={`model-${index}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onClick={() => {
                setSelectedModel(image);
                setOpen(true);
              }}
            />
          </div>
        ))}

      {/* No Images */}
      {!loading && !error && images.length === 0 && (
        <div className="flex items-center justify-center w-full h-24  p-5 bg-gray-50 rounded-xl border border-gray-200 text-gray-400 text-sm">
          Rasm topilmadi
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modelCode}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img
              src={selectedModel}
              alt="model"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelImage;
