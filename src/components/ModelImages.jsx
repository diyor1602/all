import { useEffect, useState } from "react";
import useModelImages from "@/hooks/useModelImages";
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ModelImages = ({ modelCode }) => {
  const { images, loading, error } = useModelImages(modelCode);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const previewImage = images?.[0];

  const handleNext = () => {
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openDialogAtIndex = (index) => {
    setSelectedIndex(index);
    setOpen(true);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return; // Only listen when dialog is open

    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowRight": // Right arrow = next image
          handleNext();
          break;
        case "ArrowLeft": // Left arrow = previous image
          handlePrev();
          break;
        case "Escape": // Escape = close dialog
          setOpen(false);
          break;
        case "ContextMenu": // Some keyboards support this for right click
          e.preventDefault(); // Prevent native context menu
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, images]);

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center w-full bg-purple-50 rounded-2xl border border-purple-200 p-1 animate-pulse text-xs text-purple-600">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-center w-full bg-red-50 rounded-2xl border border-red-200 p-1 text-xs text-red-600">
          <AlertCircle className="w-4 h-4" />
        </div>
      )}

      {/* Images */}
      {!loading && !error && images.length > 0 && previewImage && (
        <div
          className="w-12 h-12 rounded-xl overflow-hidden shadow-md border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
          onClick={() => openDialogAtIndex(0)}
        >
          <img
            src={previewImage}
            alt={`model-preview`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </div>
      )}

      {/* No Images */}
      {!loading && !error && images.length === 0 && (
        <div className="flex items-center justify-center w-full bg-red-50 rounded-2xl border border-red-200 p-1 text-xs text-red-600">
          <AlertCircle className="w-4 h-4" />
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-full p-0 bg-white rounded-2xl overflow-hidden flex flex-col items-center justify-center pb-6">
          {images[selectedIndex] && (
            <>
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                onClick={() => setOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <DialogHeader className="p-4 border-b border-gray-200 w-full">
                <DialogTitle className="text-lg font-semibold text-center">
                  {modelCode}
                </DialogTitle>
              </DialogHeader>

              {/* Image container */}
              <div className="relative flex items-center justify-center bg-gray-50 w-full h-[500px]">
                {/* Previous Button */}
                <button
                  onClick={handlePrev}
                  className="absolute left-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Image */}
                <img
                  src={images[selectedIndex]}
                  alt={`model-${selectedIndex}`}
                  className="max-h-full max-w-full object-contain rounded-md shadow-md"
                  loading="lazy"
                />

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="absolute right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Index / Total */}
                <div className="absolute bottom-3 bg-black/40 text-white text-sm px-3 py-1 rounded-full">
                  {selectedIndex + 1} / {images.length}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelImages;
