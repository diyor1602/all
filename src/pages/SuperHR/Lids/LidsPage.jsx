import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CirclePlus, Edit, Search, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { Link, useSearchParams } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatPhoneNumber = (value) => {
  if (!value) return "+998";
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, "");
  // Ensure the number starts with 998
  if (!phoneNumber.startsWith("998")) {
    return "+998";
  }
  // Format the phone number
  let formattedNumber = "+";
  for (let i = 0; i < phoneNumber.length; i++) {
    if (i === 3) formattedNumber += " ";
    if (i === 5) formattedNumber += " ";
    if (i === 8) formattedNumber += " ";
    if (i === 10) formattedNumber += " ";
    formattedNumber += phoneNumber[i];
  }
  return formattedNumber;
};

const LidsPage = () => {
  const { toast } = useToast();

  const [lids, setLids] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [imageDialog, setImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    lid: null,
    loading: false,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchLids = async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      const response = await api.get(`/superhr/lids?${params.toString()}`);
      setLids(response.data?.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error.response?.data?.message || "Lidlar olishda xatolik",
      });
    }
  };
  useEffect(() => {
    fetchLids();
  }, [page, debouncedSearchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Update URL params without page reload
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
      // Reset to first page when searching
      params.set("page", "1");
    } else {
      params.delete("search");
      params.set("page", "1");
    }
    setSearchParams(params);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (lid) => {
    setDeleteDialog({ open: true, lid, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.lid) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));

      await api.patch(`/superhr/lids/${deleteDialog.lid.id}`, {
        status: "inactive",
      });

      // Refresh the list
      const response = await api.get(
        `/superhr/lids?${new URLSearchParams(searchParams).toString()}`
      );
      setLids(response.data?.data);

      toast({
        title: "Muvaffaqiyatli",
        description: `${deleteDialog.lid.name} o'chirildi`,
        style: { background: "green", color: "white" },
      });

      setDeleteDialog({ open: false, lid: null, loading: false });
      fetchLids();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error.response?.data?.message || "O'chirishda xatolik yuz berdi",
      });
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, lid: null, loading: false });
  };

  return (
    <div>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold">Nomzodlar</h1>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Qidirish..."
              className="pl-8 sm:w-[200px] md:w-[300px] bg-white"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Link to="/superhr/lids/add">
            <Button className="w-full sm:w-auto">
              <CirclePlus className="mr-2 h-4 w-4" /> Qo'shish
            </Button>
          </Link>
        </div>
      </div>
      <div className="w-full overflow-auto mt-5 text-xs">
        <table className="w-full whitespace-nowrap border border-collapse border-gray-300 bg-white">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">№</th>
              <th className="border border-gray-300 p-2">Ism</th>
              <th className="border border-gray-300 p-2">Rasm</th>
              <th className="border border-gray-300 p-2">Telefon</th>
              <th className="border border-gray-300 p-2">Manzil</th>
              <th className="border border-gray-300 p-2">Tug'ilgan sana</th>
              <th className="border border-gray-300 p-2">Izoh</th>
              <th className="border border-gray-300 p-2">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {lids.map((lid, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 text-center">
                  {index + 1}
                </td>
                <td className="border border-gray-300 p-2">{lid.name}</td>
                <td className="border border-gray-300 p-2">
                  <div className="w-full flex justify-center">
                    {lid.image && (
                      <img
                        src={lid.image}
                        alt={lid.name}
                        className="w-10 h-10 object-cover rounded-full cursor-pointer"
                        onClick={() => {
                          setSelectedImage(lid.image);
                          setImageDialog(true);
                        }}
                      />
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 p-2">
                  <a href={`tel:${lid.phone}`}>
                    {formatPhoneNumber(lid.phone)}
                  </a>
                </td>
                <td className="border border-gray-300 p-2">{lid.address}</td>
                <td className="border border-gray-300 p-2 text-center">
                  {lid.birth_day?.split(" ")[0]?.split("-").reverse().join(".")}
                </td>
                <td className="border border-gray-300 p-2">{lid.comment}</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Link to={`/superhr/lids/edit/${lid.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4 text-green-500 hover:text-green-600" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(lid)}
                      disabled={lid.status === "inactive"}
                      className={lid.status === "inactive" ? "opacity-50" : ""}
                    >
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.last_page > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange(pagination.current_page - 1)
                    }
                    disabled={pagination.current_page === 1}
                    className={
                      pagination.current_page === 1
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from(
                  { length: Math.min(5, pagination.last_page) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.current_page >=
                      pagination.last_page - 2
                    ) {
                      pageNum = pagination.last_page - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pagination.current_page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(pagination.current_page + 1)
                    }
                    disabled={pagination.current_page === pagination.last_page}
                    className={
                      pagination.current_page === pagination.last_page
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rasm</DialogTitle>
          </DialogHeader>
          <div className="w-full h-full max-w-[80vw] max-h-[80vh]">
            <img
              src={selectedImage}
              alt={selectedImage}
              className="w-full h-full object-cover"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>O'chirishni tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Rostan ham{" "}
              <span className="font-semibold">{deleteDialog.lid?.name}</span> ni
              o'chirib tashlamoqchimisiz?
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={deleteDialog.loading}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteDialog.loading}
            >
              {deleteDialog.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kuting...
                </>
              ) : (
                "O'chirish"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LidsPage;
