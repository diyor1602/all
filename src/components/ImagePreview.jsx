import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ImagePreview = ({ imageUrl, alt = "Preview" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={imageUrl}
        alt={alt}
        className="w-10 h-10 rounded-full cursor-pointer object-cover"
        onClick={() => setIsOpen(true)}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl max-h-[600px] overflow-y-auto">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-auto object-contain max-w-3xl max-h-xl"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImagePreview;
