import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CirclePlus, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10,
  });

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
  const fetchItems = async (page = 1) => {
    try {
      setLoading(true);

      // Prepare query params
      const params = new URLSearchParams();
      params.append("page", page);

      if (debouncedSearchText) {
        params.append("search", debouncedSearchText);
      }

      if (selectedTypeId && selectedTypeId !== "all") {
        params.append("type_id", selectedTypeId);
      }

      const response = await api.get(
        `/warehouseManager/items?${params.toString()}`
      );

      setItems(response.data.data);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalItems: response.data.total,
        perPage: response.data.per_page,
      });
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

  // Handle page change
  const handlePageChange = (page) => {
    fetchItems(page);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchText("");
    setSelectedTypeId("all");
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchItems(1);
  }, [debouncedSearchText, selectedTypeId]);

  useEffect(() => {
    fetchTypes();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mahsulotlar</h1>
        <Button
          variant="default"
          onClick={() => navigate("/warehouseManager/items/new")}
        >
          <CirclePlus className="h-4 w-4 mr-2" /> Yangi
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

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={40} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-auto max-h-[60vh]">
              <table className="border-2 border-collapse whitespace-nowrap w-full bg-white shadow-md">
                <thead>
                  <tr>
                    <th className="border-2 p-1">N</th>
                    <th className="border-2 p-1">Nomi</th>
                    <th className="border-2 p-1">Rasmi</th>
                    <th className="border-2 p-1">Kodi</th>
                    <th className="border-2 p-1">Birligi</th>
                    <th className="border-2 p-1">Rangi</th>
                    <th className="border-2 p-1">Turi</th>
                    <th className="border-2 p-1">Narxi</th>
                    <th className="border-2 p-1">Valyuta</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={index}>
                        <td className="border-2 p-1 text-center">
                          {(pagination.currentPage - 1) * pagination.perPage +
                            index +
                            1}
                        </td>
                        <td
                          className="border-2 p-1 cursor-pointer"
                          onClick={() =>
                            navigate(`/warehouseManager/items/edit/${item?.id}`)
                          }
                        >
                          {item?.name}
                        </td>
                        <td className="border-2 p-1">
                          {item?.image ? (
                            <img
                              src={item?.image}
                              alt={item?.name}
                              className="w-10 h-10 object-cover cursor-pointer"
                              onClick={() => {
                                setImageDialogOpen(true);
                                setImage(item?.image);
                              }}
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border-2 p-1">{item?.code}</td>
                        <td className="border-2 p-1">{item?.unit?.name}</td>
                        <td className="border-2 p-1">{item?.color?.name}</td>
                        <td className="border-2 p-1">{item?.type?.name}</td>
                        <td className="border-2 p-1 text-center">
                          {item?.price}
                        </td>
                        <td className="border-2 p-1 text-center">
                          {item?.currency}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="border-2 p-4 text-center">
                        Mahsulotlar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          pagination.currentPage > 1 &&
                          handlePageChange(pagination.currentPage - 1)
                        }
                        className={
                          pagination.currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* First page */}
                    {pagination.currentPage > 2 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(1)}>
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Ellipsis if needed */}
                    {pagination.currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Previous page */}
                    {pagination.currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                        >
                          {pagination.currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink isActive>
                        {pagination.currentPage}
                      </PaginationLink>
                    </PaginationItem>

                    {/* Next page */}
                    {pagination.currentPage < pagination.totalPages && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                        >
                          {pagination.currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Ellipsis if needed */}
                    {pagination.currentPage < pagination.totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Last page */}
                    {pagination.currentPage < pagination.totalPages - 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() =>
                            handlePageChange(pagination.totalPages)
                          }
                        >
                          {pagination.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          pagination.currentPage < pagination.totalPages &&
                          handlePageChange(pagination.currentPage + 1)
                        }
                        className={
                          pagination.currentPage === pagination.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Items count info */}
            <div className="mt-2 text-center text-sm text-muted-foreground">
              Jami: {pagination.totalItems} ta mahsulot
            </div>
          </>
        )}
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
