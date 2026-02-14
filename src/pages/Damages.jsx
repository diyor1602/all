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
  XCircle,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const reasonText = {
  QC_FAIL_REWARD: "Qaytarildi",
  QC_FAIL_REFUND: "Berildi",
  QC_FAIL_PENALTY: "Jarima",
};

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
        {damages
          .sort((a, b) => b.id - a.id)
          .map((item) => {
            const isFixed = item.fixed_employee_id;
            const isOwnFixed = item.fixed_employee_id === item.employee_id;
            const createdDate = new Date(item.created_at);

            return (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 h-fit"
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
                      {isFixed ? (
                        isOwnFixed ? (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              <span className="truncate">
                                {item.fixed_employee?.name}
                              </span>
                            </Badge>
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              <span className="truncate">
                                {item.fixed_employee?.name}
                              </span>
                            </Badge>
                          </div>
                        )
                      ) : (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
                            <XCircle className="w-3 h-3 mr-1" />
                            To'g'rilanmagan
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

                  {item?.employee_money_logs?.length > 0 && (
                    <div className="relative overflow-hidden rounded-lg border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                            <XCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-red-800 text-sm uppercase tracking-wide">
                            Jarima
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-red-300 to-orange-300"></div>
                        </div>
                        <div className="space-y-1">
                          {item.employee_money_logs.map((log, index) => (
                            <div
                              key={log.id || index}
                              className="flex flex-wrap bg-white/70 rounded px-2 py-1 border border-red-100"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-red-700 text-xs">
                                  {formatNumber(log.amount, 0)} so'm
                                </span>
                                <span className="text-gray-600 text-xs">
                                  {log?.employee?.name}
                                </span>
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-orange-100 text-orange-700 border-orange-200 px-1.5 py-0.5"
                              >
                                {reasonText[log.reason]}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
              className="w-full h-auto object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Damages;
