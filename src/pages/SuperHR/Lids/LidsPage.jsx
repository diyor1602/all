import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CirclePlus, Edit } from "lucide-react";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchLids = async () => {
      try {
        const response = await api.get(`/superhr/lids?page=${page}`);
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
    fetchLids();
  }, [page]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Nomzodlar</h1>
        <Link to="/superhr/lids/add">
          <Button>
            <CirclePlus /> Qo'shish
          </Button>
        </Link>
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
                <td className="border border-gray-300 p-2 text-center">
                  <Link to={`/superhr/lids/edit/${lid.id}`}>
                    <Button variant="ghost">
                      <Edit className="text-orange-500 hover:text-orange-600" />
                    </Button>
                  </Link>
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
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className={pagination.current_page === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.current_page >= pagination.last_page - 2) {
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
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className={pagination.current_page === pagination.last_page ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
    </div>
  );
};

export default LidsPage;
