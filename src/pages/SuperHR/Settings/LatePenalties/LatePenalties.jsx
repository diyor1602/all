import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  DollarSign,
  RotateCcw,
  ImageIcon,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const LatePenalties = () => {
  const { toast } = useToast();

  const STORAGE_KEYS = {
    START_DATE: "late_penalties_start_date",
    END_DATE: "late_penalties_end_date",
    CURRENT_PAGE: "late_penalties_current_page",
  };

  const [latePenalties, setLatePenalties] = useState([]);
  const [meta, setMeta] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.START_DATE) ||
      new Date().toISOString().split("T")[0]
    );
  });
  const [endDate, setEndDate] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.END_DATE) ||
      new Date().toISOString().split("T")[0]
    );
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [loading, setLoading] = useState(true);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState(null);
  const [reverseReason, setReverseReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const getData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get("/employee-money-logs/late-penalties", {
        params: {
          start_date: startDate,
          end_date: endDate,
          page: page,
        },
      });
      setLatePenalties(response.data?.data || []);
      setMeta(response.data);
    } catch (error) {
      console.error("Error fetching late penalties:", error);
      toast({
        title: "Error",
        description: "Failed to fetch late penalties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData(currentPage);
  }, [startDate, endDate, currentPage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.START_DATE, startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.END_DATE, endDate);
  }, [endDate]);

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setStartDate(value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setEndDate(value);
    setCurrentPage(1);
  };

  const handleReverseClick = (penalty) => {
    setSelectedPenalty(penalty);
    setReverseReason("");
    setReverseDialogOpen(true);
  };

  const handleReverseSubmit = async () => {
    if (
      !reverseReason ||
      reverseReason.length < 3 ||
      reverseReason.length > 1000
    ) {
      toast({
        title: "Xatolik",
        description: "Sabab 3-1000 belgi oralig'ida bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    setReversing(true);
    try {
      await api.post(`/employee-money-logs/${selectedPenalty.id}/reverse`, {
        reason: reverseReason,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Jarima bekor qilindi",
      });
      setReverseDialogOpen(false);
      getData(currentPage);
    } catch (error) {
      console.error("Error reversing penalty:", error);
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Jarimani bekor qilishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setReversing(false);
    }
  };

  const handleImageClick = (imageUrl, employeeName) => {
    setSelectedImage({ url: imageUrl, name: employeeName });
    setImageDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Kech Qolish Jarimalari
          </h1>
          <p className="text-slate-500 text-xs">Jami: {meta?.total || 0} ta</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Input
              type="date"
              placeholder="Boshlanish sanasi"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-full sm:w-[140px] bg-white text-xs"
            />
            <Input
              type="date"
              placeholder="Tugash sanasi"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-full sm:w-[140px] bg-white text-xs"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="overflow-auto max-h-[77vh]">
          <table className="w-full border border-collapse whitespace-nowrap bg-white text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border text-left font-semibold">ID</th>
                <th className="p-2 border text-left font-semibold">Xodim</th>
                <th className="p-2 border text-left font-semibold">Summa</th>
                <th className="p-2 border text-left font-semibold">Sana</th>
                <th className="p-2 border text-left font-semibold">Sabab</th>
                <th className="p-2 border text-left font-semibold">Yaratgan</th>
                <th className="p-2 border text-left font-semibold">Holat</th>
                <th className="p-2 border text-left font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 border">
                    <div className="h-4 bg-slate-200 animate-pulse rounded w-8 mx-auto" />
                  </td>
                  <td className="p-2 border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 animate-pulse rounded w-24 mb-1" />
                        <div className="h-2 bg-slate-200 animate-pulse rounded w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="p-2 border">
                    <div className="h-4 bg-slate-200 animate-pulse rounded w-16 mx-auto" />
                  </td>
                  <td className="p-2 border">
                    <div className="h-4 bg-slate-200 animate-pulse rounded w-20 mx-auto" />
                  </td>
                  <td className="p-2 border">
                    <div className="h-4 bg-slate-200 animate-pulse rounded w-24" />
                  </td>
                  <td className="p-2 border">
                    <div className="h-3 bg-slate-200 animate-pulse rounded w-20 mb-1" />
                    <div className="h-2 bg-slate-200 animate-pulse rounded w-16" />
                  </td>
                  <td className="p-2 border">
                    <div className="h-6 bg-slate-200 animate-pulse rounded w-16 mx-auto" />
                  </td>
                  <td className="p-2 border">
                    <div className="h-6 bg-slate-200 animate-pulse rounded w-20 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="overflow-auto max-h-[77vh]">
            <table className="w-full border border-collapse whitespace-nowrap bg-white text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border text-left font-semibold">ID</th>
                  <th className="p-2 border text-left font-semibold">Xodim</th>
                  <th className="p-2 border text-left font-semibold">Summa</th>
                  <th className="p-2 border text-left font-semibold">Sana</th>
                  <th className="p-2 border text-left font-semibold">Sabab</th>
                  <th className="p-2 border text-left font-semibold">
                    Yaratgan
                  </th>
                  <th className="p-2 border text-left font-semibold">Holat</th>
                  <th className="p-2 border text-left font-semibold">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody>
                {latePenalties.map((penalty) => (
                  <tr key={penalty.id} className="hover:bg-slate-50 border-b">
                    <td className="p-2 border text-center">{penalty.id}</td>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        {penalty.employee?.img ? (
                          <div
                            className="relative cursor-pointer"
                            onClick={() =>
                              handleImageClick(
                                penalty.employee.img,
                                penalty.employee.name,
                              )
                            }
                          >
                            <img
                              src={penalty.employee.img}
                              alt={penalty.employee.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                              <ImageIcon size={12} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <User size={14} className="text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[120px]">
                            {penalty.employee?.name || "-"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ID: {penalty.employee?.id || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 border text-center">
                      <div
                        className={`font-medium ${
                          parseFloat(penalty.amount) < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatNumber(penalty.amount, 0)} so'm
                      </div>
                    </td>
                    <td className="p-2 border text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-[11px]">
                          {formatDate(penalty.date)}
                        </span>
                      </div>
                    </td>
                    <td
                      className="p-2 border max-w-[120px] truncate text-[11px]"
                      title={penalty.reason}
                    >
                      {penalty.reason || "-"}
                    </td>
                    <td className="p-2 border">
                      <div className="text-[11px]">
                        <div className="truncate max-w-[100px]">
                          {penalty.created_by?.employee?.name || "-"}
                        </div>
                        <div className="text-slate-500 truncate max-w-[100px]">
                          {formatDate(penalty.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 border text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            penalty.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {penalty.status === "active"
                            ? "Faol"
                            : penalty.status === "reversed"
                              ? "Bekor qilingan"
                              : penalty.status}
                        </span>
                        {penalty.status === "reversed" &&
                          penalty.reversed_reason && (
                            <span
                              className="text-[10px] text-slate-600 max-w-[100px] truncate"
                              title={penalty.reversed_reason}
                            >
                              {penalty.reversed_reason}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="p-2 border text-center">
                      {penalty.status === "active" && !penalty.reversed_by && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReverseClick(penalty)}
                          className="h-6 px-2 text-[10px]"
                        >
                          <RotateCcw size={10} className="mr-1" />
                          Bekor qilish
                        </Button>
                      )}
                      {penalty.reversed_by && (
                        <span className="text-[10px] text-slate-500">
                          Bekor qilingan
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {latePenalties.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-500">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="flex-shrink-0 h-8 w-8"
            >
              <ChevronFirst size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="flex-shrink-0 h-8 w-8"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs font-medium px-2 py-1 bg-white rounded border min-w-[50px] text-center">
              {meta?.current_page} / {meta?.last_page}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === meta?.last_page}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="flex-shrink-0 h-8 w-8"
            >
              <ChevronRight size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === meta?.last_page}
              onClick={() => setCurrentPage(meta?.last_page)}
              className="flex-shrink-0 h-8 w-8"
            >
              <ChevronLast size={14} />
            </Button>
          </div>
        </>
      )}

      {/* Reverse Dialog */}
      <Dialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jarimani Bekor Qilish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {selectedPenalty?.employee?.name}
              </p>
              <p className="text-sm text-slate-600">
                Summa: {formatNumber(selectedPenalty?.amount, 0)} so'm
              </p>
              <p className="text-sm text-slate-600">
                Sabab: {selectedPenalty?.reason}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Bekor qilish sababi
              </label>
              <Textarea
                placeholder="Sababni kiriting (3-1000 belgi)"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="min-h-[100px]"
                maxLength={1000}
              />
              <p className="text-xs text-slate-500 mt-1">
                {reverseReason.length}/1000 belgi
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReverseDialogOpen(false)}
              disabled={reversing}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleReverseSubmit}
              disabled={reversing || !reverseReason || reverseReason.length < 3}
            >
              {reversing ? "Yuborilmoqda..." : "Tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.name}
              className="max-w-full max-h-[70vh] rounded-lg border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LatePenalties;
