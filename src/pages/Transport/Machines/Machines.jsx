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
import {
  Eye,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Routes, Route, Link } from "react-router-dom";
import Add from "./Add";
import Edit from "./Edit";
import Show from "./Show";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";

const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  const digits = phone.toString().replace(/\D/g, "");
  const match = digits.match(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (match)
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  return phone;
};

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
    } catch {
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
    if (debouncedSearchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await api.get("/transport/employees", {
        params: { search: debouncedSearchTerm, status: "working" },
      });
      setSearchResults(res.data?.data || []);
    } catch {
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
          t.name?.toLowerCase().includes(lowerSearch) ||
          t.state_number?.toLowerCase().includes(lowerSearch) ||
          t.driver_full_name?.toLowerCase().includes(lowerSearch) ||
          t.region_id?.name?.toLowerCase().includes(lowerSearch) ||
          t.id?.toString().includes(lowerSearch),
      );
    }

    setFilteredTransports(filtered);
  }, [searchTerm, statusFilter, transports]);

  const handleOpenDriverDialog = (transport) => {
    setSelectedTransport(transport);
    setSelectedEmp(null);
    setSearchDriver("");
    setSearchResults([]);
    setDriverDialogOpen(true);
  };

  const handleCloseDriverDialog = (open) => {
    if (!open) {
      setSelectedEmp(null);
      setSearchDriver("");
      setSearchResults([]);
    }
    setDriverDialogOpen(open);
  };

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
      handleCloseDriverDialog(false);
      fetchTransports();
    } catch {
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
      {/* Header */}
      <div className="flex items-center gap-2 justify-between mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transportlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Jami {filteredTransports.length} ta transport
          </p>
        </div>
        <Button asChild>
          <Link to="/transport/machines/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yangi Transport
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Nomi, raqami, haydovchi bo'yicha qidirish..."
            className="pl-8 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Faol emas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Yuklanmoqda...</span>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="max-h-[75vh] overflow-y-auto">
            <Table className="whitespace-nowrap">
              <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="text-xs w-10 text-center">#</TableHead>
                  <TableHead className="text-xs w-14 text-center">ID</TableHead>
                  <TableHead className="text-xs">Nomi</TableHead>
                  <TableHead className="text-xs">Davlat raqami</TableHead>
                  <TableHead className="text-xs">Haydovchi</TableHead>
                  <TableHead className="text-xs">Telefon</TableHead>
                  <TableHead className="text-xs text-right">Maoshi</TableHead>
                  <TableHead className="text-xs text-center">Sig'imi</TableHead>
                  <TableHead className="text-xs text-center">
                    Xodimlar
                  </TableHead>
                  <TableHead className="text-xs">Yo'nalish</TableHead>
                  <TableHead className="text-xs text-center">Holati</TableHead>
                  <TableHead className="text-xs text-center">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransports.length > 0 ? (
                  filteredTransports.map((t, index) => (
                    <TableRow
                      key={t.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="text-xs text-center text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-xs text-center font-mono text-muted-foreground">
                        {t.id}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {t.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                          {t.state_number}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <button
                          onClick={() => handleOpenDriverDialog(t)}
                          className="flex items-center gap-1.5 group text-left"
                          title="Haydovchi o'zgartirish"
                        >
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            {t.employee?.img ? (
                              <img
                                src={t.employee.img}
                                alt={t.employee.name}
                                className="h-6 w-6 rounded-full"
                              />
                            ) : (
                              <UserCog className="h-3 w-3 text-indigo-600 group-hover:text-indigo-800" />
                            )}
                          </div>
                          <span className="group-hover:text-indigo-700 transition-colors">
                            {t.employee?.name || (
                              <span className="text-muted-foreground italic">
                                Tayinlanmagan
                              </span>
                            )}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatPhoneNumber(t.phone) ? (
                          <span>
                            {formatPhoneNumber(t.phone)}
                            {t.phone_2 && (
                              <span className="block text-[11px]">
                                {formatPhoneNumber(t.phone_2)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/50">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {parseFloat(t.salary).toLocaleString("ru-RU", {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          {t.capacity}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {t.employees?.length ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.region_id?.name || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Badge
                          className={
                            t.is_active
                              ? "bg-green-100 text-green-700 hover:bg-green-100 border border-green-200"
                              : "bg-red-100 text-red-600 hover:bg-red-100 border border-red-200"
                          }
                        >
                          {t.is_active ? "Faol" : "Faol emas"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                            asChild
                            title="Ko'rish"
                          >
                            <Link to={`/transport/machines/show/${t.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-orange-50 hover:text-orange-600"
                            asChild
                            title="Tahrirlash"
                          >
                            <Link to={`/transport/machines/edit/${t.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Truck className="h-8 w-8 opacity-30" />
                        <span className="text-sm">Transport topilmadi</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-muted/40 sticky bottom-0">
                <TableRow>
                  <TableCell colSpan={6} className="text-xs font-semibold py-3">
                    Jami ({filteredTransports.length} ta):
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-right py-3">
                    {totalSalary.toLocaleString("ru-RU", {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-center py-3">
                    {totalCapacity.toLocaleString("ru-RU", {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-center py-3">
                    {totalEmployees.toLocaleString("ru-RU", {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell colSpan={2} className="text-xs font-semibold py-3">
                    Faol: {totalActiveTransports}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}

      {/* Driver Assignment Dialog */}
      <Dialog open={driverDialogOpen} onOpenChange={handleCloseDriverDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Haydovchi biriktirish</DialogTitle>
            {selectedTransport && (
              <DialogDescription>
                {selectedTransport.name} — {selectedTransport.state_number}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Xodimni ismi bilan qidiring..."
                value={searchDriver}
                onChange={(e) => setSearchDriver(e.target.value)}
                autoFocus
              />
            </div>

            {selectedEmp ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 p-3 rounded-lg">
                  {selectedEmp.img ? (
                    <img
                      src={selectedEmp.img}
                      alt={selectedEmp.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center shrink-0 text-indigo-700 font-semibold">
                      {selectedEmp.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {selectedEmp.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedEmp.department?.name}
                      {selectedEmp.position ? ` · ${selectedEmp.position}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
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
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      "Tasdiqlash"
                    )}
                  </Button>
                </div>
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Qidirilmoqda...
              </div>
            ) : searchDriver.length < 2 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Qidirish uchun kamida 2 ta harf kiriting
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Xodim topilmadi
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {searchResults.map((employee) => (
                  <button
                    key={employee.id}
                    className="flex items-center gap-3 bg-muted/50 hover:bg-muted p-2.5 rounded-lg cursor-pointer transition-colors text-left w-full"
                    onClick={() => setSelectedEmp(employee)}
                  >
                    {employee.img ? (
                      <img
                        src={employee.img}
                        alt={employee.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted-foreground/20 flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
                        {employee.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {employee.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {employee.department?.name}
                        {employee.position ? ` · ${employee.position}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Machine;
