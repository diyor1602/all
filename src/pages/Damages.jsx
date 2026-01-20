import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const Damages = () => {
  const { toast } = useToast();

  const [damages, setDamages] = useState([]);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);

  const loadMoreRef = useRef(null);

  const getDamages = useCallback(
    async (pageNumber = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }
      try {
        const res = await api.get(`/qualityControls?page=${pageNumber}`);

        setDamages((prev) => {
          const newData = res.data?.data || [];
          return append ? [...prev, ...newData] : newData;
        });

        setPage(res.data?.current_page || 1);
        setLastPage(res.data?.last_page || 1);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Braklar ro'yxatini olishda xatolik",
        });
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    getDamages(1, false);
  }, [getDamages]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (page >= lastPage) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoadingMore && page < lastPage) {
        getDamages(page + 1, true);
      }
    });

    const current = loadMoreRef.current;
    observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [page, lastPage, isLoadingMore, getDamages]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {damages.map((item) => {
          return (
            <Card key={item.id} className="overflow-hidden">
              {item.image && (
                <img
                  src={item.image}
                  alt="damage"
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedImage(item.image)}
                />
              )}

              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    Buyurtma: {item.order?.name}
                  </h3>
                </div>

                <div className="text-sm text-muted-foreground">
                  Ish: {item.tarification?.name}
                </div>

                <div className="text-sm">
                  Xodim:{" "}
                  <span className="font-medium">
                    {item.created_by?.employee?.name || "—"}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Sana:{" "}
                  {new Date(item.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* INFINITE SCROLL SENTINEL */}
      <div
        ref={loadMoreRef}
        className="flex items-center justify-center mt-8 py-4"
      >
        {isLoadingMore && (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        )}
        {!isLoadingMore && page >= lastPage && (
          <span className="text-xs text-muted-foreground">
            Barcha ma'lumotlar yuklandi
          </span>
        )}
      </div>

      {/* IMAGE MODAL */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="damage-large"
              className="w-full h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Damages;
