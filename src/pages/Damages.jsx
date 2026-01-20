import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const statusMap = {
  pending: { label: "Kutilmoqda", variant: "secondary" },
  approved: { label: "Tasdiqlangan", variant: "success" },
  rejected: { label: "Rad etilgan", variant: "destructive" },
};

const Damages = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [damages, setDamages] = useState([]);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [selectedImage, setSelectedImage] = useState(null);

  const getDamages = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/qualityControls?page=${pageNumber}`);

      setDamages(res.data?.data || []);
      setPage(res.data?.current_page || 1);
      setLastPage(res.data?.last_page || 1);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Braklar ro'yxatini olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDamages(page);
  }, [page]);

  if (loading) {
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
          const status = statusMap[item.status] || statusMap.pending;

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
                  <Badge variant={status.variant}>{status.label}</Badge>
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

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Oldingi
        </Button>

        <span className="text-sm text-muted-foreground">
          {page} / {lastPage}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => setPage((p) => p + 1)}
        >
          Keyingi
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
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
