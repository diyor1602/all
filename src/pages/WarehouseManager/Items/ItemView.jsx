import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CirclePlus,
  Download,
  Edit,
  Eye,
  Loader2,
  Search,
  Package,
  X,
  Filter,
  ImageOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import formatNumber from "@/utils/formatNumber";

const ItemView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("all");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchItems = async (pageNum = 1, shouldAccumulate = false) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("page", pageNum);
      if (debouncedSearchText) params.append("search", debouncedSearchText);
      if (selectedTypeId && selectedTypeId !== "all")
        params.append("type_id", selectedTypeId);

      const response = await api.get(
        `/warehouseManager/items?${params.toString()}`,
      );

      setTotalItems(response.data.total);
      if (shouldAccumulate) {
        setItems((prev) => [...prev, ...response.data.data]);
      } else {
        setItems(response.data.data);
      }
      setHasMore(pageNum < response.data.last_page);
    } catch {
      toast({
        title: "Xatolik",
        description: "Mahsulotlarni olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    fetchItems(1, false);
  }, [debouncedSearchText, selectedTypeId]);

  const observer = useRef();
  const lastItemRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
          fetchItems(page + 1, true);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const fetchTypes = async () => {
    try {
      const response = await api.get("/warehouseManager/types");
      setTypes(response.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Turi olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedTypeId("all");
    setPage(1);
    setItems([]);
    setHasMore(true);
    fetchItems(1, false);
  };

  const isFiltered = searchText !== "" || selectedTypeId !== "all";

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get("/warehouseManager/items-export");
      if (response.data.fileUrl) {
        const link = document.createElement("a");
        link.href = response.data.fileUrl;
        link.setAttribute("download", "materiallar.xlsx");
        link.setAttribute("target", "_blank");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Muvaffaqiyatli",
          description: response.data.message || "Excel fayl yuklab olindi",
          style: { backgroundColor: "green", color: "white" },
        });
      } else {
        toast({
          title: "Ogohlantirish",
          description: response.data.message || "Excel fayl manzili topilmadi",
        });
      }
    } catch {
      toast({
        title: "Xatolik",
        description: "Excel fayl yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mahsulotlar</h1>
              {!initialLoad && (
                <p className="text-xs text-muted-foreground">
                  Jami {totalItems} ta mahsulot
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={downloading}
              onClick={handleDownload}
              className="gap-2"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Excel
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/warehouseManager/settings/items/new")}
              className="gap-2"
            >
              <CirclePlus className="h-4 w-4" />
              Yangi mahsulot
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mahsulot qidirish..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
            <SelectTrigger className="w-44 h-9 bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Turi" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground h-9"
            >
              <X className="h-3.5 w-3.5" />
              Tozalash
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_#e5e7eb]">
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    { label: "№", align: "left" },
                    { label: "Nomi", align: "left" },
                    { label: "Amallar", align: "center" },
                    { label: "Rasmi", align: "center" },
                    { label: "Kodi", align: "left" },
                    { label: "Birligi", align: "center" },
                    { label: "Rangi", align: "left" },
                    { label: "Lot", align: "center" },
                    { label: "Turi", align: "left" },
                    { label: "Narxi", align: "right" },
                    { label: "Valyuta", align: "center" },
                    { label: "Min. miqdor", align: "right" },
                  ].map(({ label, align }) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-${align} text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialLoad ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length > 0 ? (
                  items.map((item, index) => (
                    <tr
                      key={item.id}
                      ref={index === items.length - 1 ? lastItemRef : null}
                      className="hover:bg-blue-50/30 transition-colors duration-100 group"
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="font-medium text-gray-900 leading-tight line-clamp-2">
                          {item?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 items-center justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/warehouseManager/settings/items/show/${item?.id}`,
                                  )
                                }
                                className="p-1.5 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Ko'rish</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/warehouseManager/settings/items/edit/${item?.id}`,
                                  )
                                }
                                className="p-1.5 rounded-md text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Tahrirlash</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          {item?.image ? (
                            <img
                              src={item?.image}
                              alt={item?.name}
                              className="w-10 h-10 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all shadow-sm"
                              onClick={() => {
                                setImageDialogOpen(true);
                                setImage(item?.image);
                                setImageName(item?.name);
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                              <ImageOff className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {item?.code || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item?.unit?.name ? (
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {item.unit.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item?.color ? (
                          <div className="flex items-center gap-2">
                            {item.color.hex && (
                              <div
                                className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                                style={{
                                  backgroundColor: `#${item.color.hex}`,
                                }}
                              />
                            )}
                            <span className="text-gray-700 text-xs">
                              {item.color.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-gray-600">
                          {item?.lot || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item?.type?.name ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50"
                          >
                            {item.type.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">
                          {formatNumber(item?.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">
                          {item?.currency?.name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-gray-700">
                          {item?.min_quantity ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">
                            Mahsulotlar topilmadi
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {isFiltered
                              ? "Qidiruv natijasi bo'sh. Filtrlarni o'zgartirib ko'ring."
                              : "Hali hech qanday mahsulot qo'shilmagan."}
                          </p>
                          {isFiltered && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={resetFilters}
                            >
                              Filtrlarni tozalash
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Loading more indicator */}
          {loading && !initialLoad && (
            <div className="flex justify-center items-center py-5 border-t border-gray-100">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Yuklanmoqda...
              </span>
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && items.length > 0 && !loading && (
            <div className="py-4 text-center border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Barcha {totalItems} ta mahsulot ko'rsatildi
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Image preview dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-sm font-medium text-gray-700">
              {imageName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Mahsulot rasmi
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-0">
            <img
              src={image}
              alt={imageName}
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg bg-gray-50"
            />
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ItemView;
