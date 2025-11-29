import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CirclePlus, Download, Edit, Eye, Loader2, Search } from "lucide-react";
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

const ItemView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search and filter params
  const [searchText, setSearchText] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("all");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch items with pagination and filters
  const fetchItems = async (pageNum = 1, shouldAccumulate = false) => {
    try {
      setLoading(true);

      // Prepare query params
      const params = new URLSearchParams();
      params.append("page", pageNum);

      if (debouncedSearchText) {
        params.append("search", debouncedSearchText);
      }

      if (selectedTypeId && selectedTypeId !== "all") {
        params.append("type_id", selectedTypeId);
      }

      const response = await api.get(
        `/warehouseManager/items?${params.toString()}`
      );

      setTotalItems(response.data.total);

      if (shouldAccumulate) {
        setItems((prev) => [...prev, ...response.data.data]);
      } else {
        setItems(response.data.data);
      }

      setHasMore(pageNum < response.data.last_page);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulotlarni olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset all data when filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    fetchItems(1, false);
  }, [debouncedSearchText, selectedTypeId]);

  // Intersection Observer setup for infinite scroll
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
    [loading, hasMore]
  );

  const fetchTypes = async () => {
    try {
      const response = await api.get("/warehouseManager/types");
      setTypes(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Turi olishda xatolik",
        variant: "destructive",
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchText("");
    setSelectedTypeId("all");
    setPage(1);
    setItems([]);
    setHasMore(true);
    fetchItems(1, false);
  };

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
          style: {
            backgroundColor: "green",
            color: "white",
          },
        });
      } else {
        toast({
          title: "Ogohlantirish",
          description: response.data.message || "Excel fayl manzili topilmadi",
          style: {
            backgroundColor: "#4ade80",
            color: "white",
          },
        });
      }
    } catch (error) {
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
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mahsulotlar</h1>
        <Button
          variant="outline"
          disabled={downloading}
          onClick={handleDownload}
        >
          {downloading ? <Loader2 /> : <Download />}
          Excel
        </Button>
        <Button
          variant="default"
          onClick={() => navigate("/warehouseManager/settings/items/new")}
        >
          <CirclePlus /> Yangi
        </Button>
      </div>

      {/* Search and filter section */}
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mahsulot qidirish..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-8 bg-white"
          />
        </div>

        <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Turi" />
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

        <Button variant="outline" onClick={resetFilters}>
          Tozalash
        </Button>
      </div>

      <div className="mt-6">
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
          <table className="w-full bg-white border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Nº
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 max-w-xs">
                  Nomi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Amallar
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Rasmi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Kodi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Birligi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Rangi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Lot
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Turi
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Narxi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Valyuta
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Min. miqdor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    ref={index === items.length - 1 ? lastItemRef : null}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 max-w-xs break-words">
                      <div className="font-medium text-gray-900">
                        {item?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100">
                      <div className="flex gap-2 items-center w-full justify-center">
                        <Eye
                          className="w-4 h-4 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-150"
                          onClick={() =>
                            navigate(
                              `/warehouseManager/settings/items/show/${item?.id}`
                            )
                          }
                        />
                        <Edit
                          className="w-4 h-4 text-orange-600 hover:text-orange-800 cursor-pointer transition-colors duration-150"
                          onClick={() =>
                            navigate(
                              `/warehouseManager/settings/items/edit/${item?.id}`
                            )
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-100">
                      {item?.image ? (
                        <img
                          src={item?.image}
                          alt={item?.name}
                          className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-150 shadow-sm"
                          onClick={() => {
                            setImageDialogOpen(true);
                            setImage(item?.image);
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          -
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 font-mono">
                      {item?.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                      {item?.unit?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                      {item?.color?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 border-r border-gray-100 font-mono">
                      {item?.lot || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                      {item?.type?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 border-r border-gray-100 font-medium">
                      {item?.price}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 border-r border-gray-100">
                      {item?.currency?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                      {item?.min_quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="12"
                    className="px-4 py-8 text-center text-gray-500 bg-gray-50"
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-medium mb-2">
                        Mahsulotlar topilmadi
                      </div>
                      <div className="text-sm text-gray-400">
                        Hech qanday mahsulot mavjud emas
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-6 bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        )}

        {/* Items count info */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-sm font-medium text-blue-700">
            Jami: <span className="ml-1 font-bold">{totalItems}</span> ta
            mahsulot
          </div>
        </div>
      </div>

      {/* Image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <img
            src={image}
            alt=""
            className="w-full h-auto max-h-[90vh] max-w-[90vw]"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemView;
