import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Loader2, Pencil, PlusCircle, Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Routes, Route, Link } from "react-router-dom";
import Add from "./Add";
import Edit from "./Edit";
import Show from "./Show";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";

const formatPhoneNumber = (phone) =>
  phone
    ?.replace(/\D/g, "")
    ?.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");

const STORAGE_KEY = "machine_filters";

const Machine = () => {
  return (
    <Routes>
      <Route path="*" element={<MachineWrapper />} />
      <Route path="new" element={<Add />} />
      <Route path="edit/:id" element={<Edit />} />
      <Route path="show/:id" element={<Show />} />
    </Routes>
  );
};

const MachineWrapper = () => {
  const [transports, setTransports] = useState([]);
  const [filteredTransports, setFilteredTransports] = useState([]);
  const [loading, setLoading] = useState(false);

  const savedFilters = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const [searchTerm, setSearchTerm] = useState(savedFilters.searchTerm || "");
  const [statusFilter, setStatusFilter] = useState(
    savedFilters.statusFilter || "active",
  );

  const { toast } = useToast();
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [searchDriver, setSearchDriver] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null);

  const fetchTransports = async () => {
    setLoading(true);
    try {
      const response = await api.get("/transport/transports");
      setTransports(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Transportlar ro'yxati olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ searchTerm, statusFilter }),
    );
  }, [searchTerm, statusFilter]);

  const debouncedSearchTerm = useDebounce(searchDriver, 500);

  const getEmployees = async () => {
    if (debouncedSearchTerm.length < 2) return;
    try {
      setIsSearching(true);
      const res = await api.get("/transport/employees", {
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
        description: "Xodimlarni qidirishda xatolik yuz berdi",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    getEmployees();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    let filtered = [...transports];

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((t) => t.is_active === isActive);
    }

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerSearch) ||
          t.state_number.toLowerCase().includes(lowerSearch) ||
          t.driver_full_name.toLowerCase().includes(lowerSearch) ||
          (t.region_id?.name &&
            t.region_id.name.toLowerCase().includes(lowerSearch)) ||
          t.id.toString().includes(lowerSearch),
      );
    }

    setFilteredTransports(filtered);
  }, [searchTerm, statusFilter, transports]);

  const handleSubmit = async () => {
    if (!selectedEmp || !selectedTransport) return;
    try {
      setIsSending(true);
      await api.patch(`transport/transports/${selectedTransport.id}/driver`, {
        employee_id: selectedEmp.id,
      });
      toast({
        title: "Muvaffaqiyat",
        description: "Xodim muvaffaqiyatli biriktirildi",
      });
      setSelectedEmp(null);
      setSelectedTransport(null);
      setSearchDriver("");
      setDriverDialogOpen(false);
      fetchTransports();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimni transportga biriktirishda xatolik yuz berdi",
      });
    } finally {
      setIsSending(false);
    }
  };

  const totalCapacity = filteredTransports.reduce(
    (sum, t) => sum + (t.capacity || 0),
    0,
  );
  const totalSalary = filteredTransports.reduce(
    (sum, t) => sum + (parseFloat(t.salary) || 0),
    0,
  );
  const totalActiveTransports = filteredTransports.filter(
    (t) => t.is_active,
  ).length;
  const totalEmployees = filteredTransports.reduce(
    (sum, t) => sum + (t.employees?.length || 0),
    0,
  );

  return (
    <>
      <div className="flex items-center gap-2 justify-between mb-3 flex-wrap">
        <h1 className="text-2xl font-bold">
          Transportlar ({filteredTransports.length})
        </h1>
        <Button asChild>
          <Link to="/transport/machines/new">
            <PlusCircle /> Yangi Transport
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Qidirish..."
            className="pl-8 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Holat bo'yicha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Faol emas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">Yuklanmoqda...</div>
      ) : (
        <div className="max-h-[80vh] overflow-y-auto">
          <Table className="bg-white shadow-lg whitespace-nowrap">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="text-xs w-[50px] border-2 text-center">
                  N
                </TableHead>
                <TableHead className="text-xs w-[50px] border-2 text-center">
                  ID
                </TableHead>
                <TableHead className="text-xs border-2">Nomi</TableHead>
                <TableHead className="text-xs border-2">Amallar</TableHead>
                <TableHead className="text-xs border-2">
                  Davlat raqami
                </TableHead>
                <TableHead className="text-xs border-2">Haydovchi</TableHead>
                <TableHead className="text-xs border-2">Maoshi</TableHead>
                <TableHead className="text-xs border-2">Telefon</TableHead>
                <TableHead className="text-xs border-2">Sig'imi</TableHead>
                <TableHead className="text-xs border-2">Xodimlar</TableHead>
                <TableHead className="text-xs border-2">Yo'nalish</TableHead>
                <TableHead className="text-xs border-2">Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransports.length > 0 ? (
                filteredTransports.map((t, index) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs font-medium border-2 text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-xs border-2">{t.id}</TableCell>
                    <TableCell className="text-xs border-2">{t.name}</TableCell>
                    <TableCell className="text-xs border-2">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                          <Link to={`/transport/machines/show/${t.id}`}>
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Link>
                        </Button>
                        <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                          <Link to={`/transport/machines/edit/${t.id}`}>
                            <Pencil className="h-4 w-4 text-orange-500" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      {t.state_number}
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      <Button
                        onClick={() => {
                          setDriverDialogOpen(true);
                          setSelectedTransport(t);
                          setSelectedEmp(null);
                        }}
                        variant="ghost"
                      >
                        {t.employee?.name}
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      {parseFloat(t.salary).toLocaleString("ru-RU", {
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      +{formatPhoneNumber(t.phone)}{" "}
                      {t.phone_2 ? ` | +${formatPhoneNumber(t.phone_2)}` : ""}
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      {t.capacity}
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      {t.employees?.length}
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      {t.region_id?.name}
                    </TableCell>
                    <TableCell className="text-xs border-2">
                      <div className="flex items-center justify-center">
                        {t.is_active ? (
                          <div className="w-5 h-5 rounded-full bg-green-500"></div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-red-500"></div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center">
                    Transport topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter className="bg-gray-100">
              <TableRow>
                <TableCell colSpan={6} className="text-xs font-bold border-2">
                  Jami:
                </TableCell>
                <TableCell colSpan={2} className="text-xs font-bold border-2">
                  {totalSalary?.toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell className="text-xs font-bold border-2">
                  {totalCapacity?.toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell className="text-xs font-bold border-2">
                  {totalEmployees?.toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell className="text-xs font-bold border-2">
                  Faol transportlar:
                </TableCell>
                <TableCell className="text-xs font-bold border-2">
                  {totalActiveTransports}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Driver</DialogTitle>
          </DialogHeader>
          <Input
            value={searchDriver}
            onChange={(e) => setSearchDriver(e.target.value)}
          />
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 bg-primary-foreground p-2 rounded">
              <Loader2 className="animate-spin text-primary" />
              Qidirilmoqda...
            </div>
          ) : selectedEmp ? (
            <>
              <div className="flex items-center gap-2 bg-blue-200 p-2 rounded">
                {selectedEmp?.img && (
                  <img
                    src={selectedEmp.img}
                    alt={selectedEmp.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <div>{selectedEmp.name}</div>
                  <div>
                    {selectedEmp.department?.name} {selectedEmp.position}{" "}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedEmp(null)}
                >
                  Bekor qilish
                </Button>
                <Button
                  className="flex-1"
                  disabled={isSending}
                  onClick={handleSubmit}
                >
                  Tasdiqlash
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {searchResults?.map((employee, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-200 p-2 rounded cursor-pointer hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    setSelectedEmp(employee);
                  }}
                >
                  {employee?.img && (
                    <img
                      src={employee.img}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div>{employee.name}</div>
                    <div>
                      {employee.department?.name} {employee.position}{" "}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Machine;
