import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Eye,
  Calendar,
  User,
  AlertCircle,
  Search,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

const Damages = () => {
  const { toast } = useToast();

  // localStorage keys
  const STORAGE_KEYS = {
    SEARCH_QUERY: "damages_search_query",
    CURRENT_PAGE: "damages_current_page",
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
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay

  const getDamages = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await api.get(
        `/internalAccountant/qualityControls?page=${page}${searchParam}`,
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

  useEffect(() => {
    getDamages(currentPage, debouncedSearchQuery);
  }, [currentPage, debouncedSearchQuery]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
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

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sifat Nazorati</h1>
          <p className="text-slate-500 text-sm">
            Jami: {meta?.total || 0} ta holat aniqlangan
          </p>
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={20}
          />
          <Input
            type="text"
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 w-64 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-200 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {damages.map((damage) => (
              <Card
                key={damage.id}
                className="overflow-hidden hover:shadow-lg transition-shadow border-none shadow-sm"
              >
                <div className="relative h-40 bg-slate-200">
                  <img
                    src={damage.image}
                    alt="Damage"
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    {damage?.tarification?.code}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg truncate">
                    {damage?.order?.id} - {damage?.order?.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 truncate">
                    {damage?.order?.order_model?.sub_models[0]?.submodel?.name}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <User size={14} className="mr-2 text-slate-400" />
                      <span className="truncate">{damage?.employee?.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar size={14} className="mr-2 text-slate-400" />
                      <span>
                        {formatDate(damage?.created_at).split(",")[0]}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="outline"
                    className="w-full group"
                    onClick={() => {
                      setSelectedDamage(damage);
                      setDialogOpen(true);
                    }}
                  >
                    <Eye size={16} className="mr-2 group-hover:text-blue-500" />
                    Batafsil
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8 flex justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              <ChevronFirst size={16} />
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium px-3">
              {meta?.current_page} / {meta?.last_page}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === meta?.last_page}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === meta?.last_page}
              onClick={() => setCurrentPage(meta?.last_page)}
            >
              <ChevronLast size={16} />
            </Button>
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Zarar Tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedDamage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={selectedDamage.image}
                  className="w-full h-auto object-contain bg-black"
                  alt="Detail"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Buyurtma
                  </label>
                  <p className="font-medium text-slate-800">
                    {selectedDamage.order?.name}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Xato qilgan xodim
                  </label>
                  <p className="flex items-center text-red-600 font-semibold">
                    <AlertCircle size={16} className="mr-2" />
                    {selectedDamage.employee?.name}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Ish turi
                  </label>
                  <p className="text-slate-700">
                    {selectedDamage.tarification?.name} (
                    {selectedDamage.tarification?.code})
                  </p>
                </div>
                <div className="bg-slate-100 p-3 rounded-md italic text-slate-600">
                  "{selectedDamage.description || "Izoh qoldirilmagan"}"
                </div>
                <hr />
                <div className="text-xs text-slate-500">
                  <p>Tekshirdi: {selectedDamage.created_by?.employee?.name}</p>
                  <p>Sana: {formatDate(selectedDamage.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Damages;
