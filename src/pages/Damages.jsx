import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  User,
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const Damages = () => {
  const { toast } = useToast();

  const [damages, setDamages] = useState([]);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {damages.map((item) => {
          const isFixed = !!item.fixed_employee;
          const createdDate = new Date(item.created_at);

          return (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50"
            >
              {/* IMAGE SECTION */}
              <div className="relative group">
                {item.image ? (
                  <>
                    <img
                      src={item.image}
                      alt="damage"
                      className="w-full h-56 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => {
                        setSelectedImage(item.image);
                        setDialogOpen(true);
                      }}
                    />
                    {isFixed && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          To'g'rilangan
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {item.order?.name || "Noma'lum buyurtma"}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {item.tarification?.name || "Ish turi belgilanmagan"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* DESCRIPTION */}
                {item.description && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                    <p className="text-sm text-blue-800 font-medium">Izoh:</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* EMPLOYEES INFO */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">OTK xodimi</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.created_by?.employee?.name || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Wrench className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">
                        To'g'irlagan xodim
                      </p>
                      <p
                        className={`text-sm font-medium truncate ${isFixed ? "text-green-700" : "text-gray-400"}`}
                      >
                        {item.fixed_employee?.name || "To'g'irlanmagan"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DATE INFO */}
                <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {createdDate.toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Clock className="w-3 h-3" />
                  <span>
                    {createdDate.toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div>
                  Jarima:{" "}
                  {item?.employee_money_logs?.map((log) => (
                    <>{formatNumber(log.amount, 0)} so'm</>
                  ))}
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
