import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  User,
  AlertCircle,
  Search,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCheck,
  Pencil,
  Loader2,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

const Damages = () => {
  const { toast } = useToast();

  // localStorage keys
  const STORAGE_KEYS = {
    SEARCH_QUERY: "damages_search_query",
    CURRENT_PAGE: "damages_current_page",
    START_DATE: "damages_start_date",
    END_DATE: "damages_end_date",
  };

  const [damages, setDamages] = useState([]);
  const [meta, setMeta] = useState(null); // Stores pagination info
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [selectedDamage, setSelectedDamage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY) || "";
  });
  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.START_DATE) || "";
  });
  const [endDate, setEndDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.END_DATE) || "";
  });
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sending, setSending] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay

  const getDamages = async (
    page = 1,
    search = "",
    startDate = "",
    endDate = "",
  ) => {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const startDateParam = startDate
        ? `&start_date=${encodeURIComponent(startDate)}`
        : "";
      const endDateParam = endDate
        ? `&end_date=${encodeURIComponent(endDate)}`
        : "";
      const res = await api.get(
        `/qualityController/qualityControls?page=${page}${searchParam}${startDateParam}${endDateParam}`,
      );
      setDamages(res.data?.data || []);
      setMeta(res.data); // Store the full response for pagination labels
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const getEmployees = async () => {
    if (debouncedSearchTerm.length < 2) return;
    try {
      const res = await api.get("/qualityController/employees", {
        params: {
          search: debouncedSearchTerm,
          status: "working",
        },
      });
      setSearchResults(res.data?.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimlar ma'lumotlari yuklanmadi",
      });
      return [];
    }
  };

  useEffect(() => {
    getEmployees();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    getDamages(currentPage, debouncedSearchQuery, startDate, endDate);
  }, [currentPage, debouncedSearchQuery, startDate, endDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.START_DATE, startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.END_DATE, endDate);
  }, [endDate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!dialogOpen || !selectedDamage) return;

      if (e.key === "ArrowLeft") {
        handlePreviousDamage();
      } else if (e.key === "ArrowRight") {
        handleNextDamage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, selectedDamage, damages]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setStartDate(value);
    setCurrentPage(1); // Reset to first page when changing date
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setEndDate(value);
    setCurrentPage(1); // Reset to first page when changing date
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePreviousDamage = () => {
    const currentIndex = damages.findIndex((d) => d.id === selectedDamage?.id);
    if (currentIndex > 0) {
      setSelectedDamage(damages[currentIndex - 1]);
    }
  };

  const handleNextDamage = () => {
    const currentIndex = damages.findIndex((d) => d.id === selectedDamage?.id);
    if (currentIndex < damages.length - 1) {
      setSelectedDamage(damages[currentIndex + 1]);
    }
  };

  const handleSaveEmployee = async () => {
    setSending(true);
    try {
      const res = await api.post("/qualityController/qualityControlFix", {
        quality_control_id: selectedDamage?.id,
        fixed_employee_id: selectedEmployee?.id,
      });
      toast({
        title: "Xodim saqlandi",
        duration: 1000,
      });
      setEmployeeDialogOpen(false);
      getDamages();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Saqlashda xatolik yuz berdi",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sifat Nazorati</h1>
          <p className="text-slate-500 text-sm">
            Jami: {meta?.total || 0} ta holat aniqlangan
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 w-full sm:w-64 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="Boshlanish sanasi"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-fit bg-white"
            />

            <Input
              type="date"
              placeholder="Tugash sanasi"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-fit bg-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-72 bg-slate-200 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {damages.map((damage) => (
              <Card
                key={damage.id}
                className="overflow-hidden hover:shadow-lg transition-shadow border-none shadow-sm cursor-pointer"
                onClick={() => {
                  setSelectedDamage(damage);
                  setDialogOpen(true);
                }}
              >
                <div className="relative h-40 bg-slate-200">
                  <img
                    src={damage.image}
                    alt="Damage"
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={`absolute top-2 right-2 ${
                      damage?.fixed_employee ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {damage?.tarification?.code}
                  </Badge>
                  {!damage?.fixed_employee && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 left-2 bg-blue-500 text-white hover:bg-blue-600 hover:text-white border-none outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDamage(damage);
                        setSelectedEmployee(damage?.employee);
                        setSearchTerm("");
                        setEmployeeDialogOpen(true);
                      }}
                    >
                      <Send />
                    </Button>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg truncate">
                    <span className="text-gray-500">#{damage?.order?.id}</span>{" "}
                    - {damage?.order?.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 truncate">
                    {damage?.order?.order_model?.sub_models[0]?.submodel?.name}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <User size={14} className="mr-2 text-slate-400" />
                      <span className="truncate">
                        {damage?.employee?.name || "-"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <CheckCheck size={14} className="mr-2 text-slate-400" />
                      <span className="truncate">
                        {damage?.fixed_employee?.name || "-"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Star size={14} className="mr-2 text-slate-400" />
                      <span className="truncate">
                        {damage?.tarification?.name || "-"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar size={14} className="mr-2 text-slate-400" />
                      <span>{formatDate(damage?.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="flex-shrink-0"
            >
              <ChevronFirst size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="flex-shrink-0"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium px-3 py-1 bg-white rounded border min-w-[60px] text-center">
              {meta?.current_page} / {meta?.last_page}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === meta?.last_page}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="flex-shrink-0"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === meta?.last_page}
              onClick={() => setCurrentPage(meta?.last_page)}
              className="flex-shrink-0"
            >
              <ChevronLast size={16} />
            </Button>
          </div>

          {/* Detail Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  Zarar Tafsilotlari
                </DialogTitle>
              </DialogHeader>
              {selectedDamage && (
                <div className="relative">
                  {/* Left Navigation Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50 sm:left-0"
                    onClick={handlePreviousDamage}
                    disabled={
                      damages.findIndex((d) => d.id === selectedDamage.id) === 0
                    }
                  >
                    <ChevronLeft size={20} />
                  </Button>

                  {/* Right Navigation Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50 sm:right-0"
                    onClick={handleNextDamage}
                    disabled={
                      damages.findIndex((d) => d.id === selectedDamage.id) ===
                      damages.length - 1
                    }
                  >
                    <ChevronRight size={20} />
                  </Button>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 px-4 sm:px-8 sm:ml-1">
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={selectedDamage.image}
                        className="w-full h-auto max-h-[60vh] object-contain"
                        alt="Detail"
                      />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          Buyurtma
                        </label>
                        <p className="font-medium text-slate-800 break-words">
                          {selectedDamage.order?.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          Xato qilgan xodim
                        </label>
                        <p className="flex items-center text-red-600 font-semibold">
                          <AlertCircle
                            size={16}
                            className="mr-2 flex-shrink-0"
                          />
                          <span className="break-words">
                            {selectedDamage.employee?.name}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          Ish turi
                        </label>
                        <p className="text-slate-700 break-words">
                          {selectedDamage.tarification?.name} (
                          {selectedDamage.tarification?.code})
                        </p>
                      </div>
                      <div className="bg-slate-100 p-3 rounded-md italic text-slate-600">
                        "{selectedDamage.description || "Izoh qoldirilmagan"}"
                      </div>
                      <hr />
                      <div className="text-xs text-slate-500 space-y-1">
                        <p className="break-words">
                          Tekshirdi: {selectedDamage.created_by?.employee?.name}
                        </p>
                        <p>Sana: {formatDate(selectedDamage.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Employee Selection Dialog */}
          <Dialog
            open={employeeDialogOpen}
            onOpenChange={setEmployeeDialogOpen}
          >
            <DialogContent
              className="
      w-[95vw] 
      max-w-lg 
      p-4 sm:p-6
      max-h-[90vh] 
      overflow-hidden
      rounded-xl
    "
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  Xodimni tanlash
                </DialogTitle>
                <p className="text-xs sm:text-sm text-slate-500 break-words">
                  {selectedDamage?.order?.name} -{" "}
                  {selectedDamage?.tarification?.code} -{" "}
                  {selectedDamage?.tarification?.name}
                </p>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <div className="space-y-4 overflow-y-auto pr-1 max-h-[65vh]">
                {/* Search Input */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <Input
                    placeholder="Xodimni qidirish (kamida 2 harf)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm focus-visible:ring-0"
                  />
                </div>

                {/* Selected Employee */}
                {selectedEmployee && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {selectedEmployee?.img ? (
                          <img
                            src={selectedEmployee?.img}
                            alt="Employee"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {selectedEmployee?.name?.charAt(0)?.toUpperCase() ||
                              "X"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate text-sm">
                            {selectedEmployee?.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Tanlangan xodim
                          </p>
                        </div>
                      </div>
                      <CheckCheck className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {debouncedSearchTerm.length >= 2 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      Qidiruv natijalari
                    </p>

                    <div className="max-h-56 overflow-y-auto border rounded-lg">
                      {searchResults.length > 0 ? (
                        searchResults.map((searchResult) => (
                          <div
                            key={searchResult.id}
                            onClick={() => setSelectedEmployee(searchResult)}
                            className={`px-3 py-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
                              selectedEmployee?.id === searchResult.id
                                ? "bg-blue-50 border-l-4 border-l-blue-600"
                                : ""
                            }`}
                          >
                            {searchResult?.img ? (
                              <img
                                src={searchResult?.img}
                                alt="Employee"
                                className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
                                {searchResult?.name?.charAt(0)?.toUpperCase() ||
                                  "X"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate text-sm">
                                {searchResult?.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                ID: {searchResult?.id}
                              </p>
                            </div>
                            {selectedEmployee?.id === searchResult.id && (
                              <CheckCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-6 text-center text-slate-500">
                          <User className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">Xodimlar topilmadi</p>
                          <p className="text-xs mt-1">
                            Boshqa kalit so'zlar bilan urinib ko'ring
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty States */}
                {debouncedSearchTerm.length < 2 && searchTerm.length > 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Kamida 2 harf kiriting</p>
                  </div>
                )}

                {!searchTerm && (
                  <div className="text-center py-6 text-slate-500">
                    <User className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Xodimlarni qidiring</p>
                    <p className="text-xs mt-1">
                      Ism yoki familiyasini kiriting
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEmployeeDialogOpen(false)}
                  className="w-full text-sm"
                  disabled={sending}
                >
                  Bekor qilish
                </Button>

                <Button
                  onClick={handleSaveEmployee}
                  disabled={sending || !selectedEmployee}
                  className="w-full text-sm"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Saqlash
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Damages;
