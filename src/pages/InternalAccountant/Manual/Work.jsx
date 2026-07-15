import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  BoxIcon,
  MessageSquareIcon,
  CalendarCheckIcon,
  CalendarIcon,
  TagIcon,
  BarChartIcon,
  RulerIcon,
  Bitcoin,
  Timer,
  FileDigit,
  Users,
  Plus,
  Trash2,
  Send,
  Pencil,
  X,
  Check,
  ChevronsUpDown,
  Download,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import formatNumber from "@/utils/formatNumber";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Work = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedStatus, setSelectedStatus] = useState(
    localStorage.getItem("empStatus") || "working",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [dialogData, setDialogData] = useState([]);
  const [extraDaysDialogOpen, setExtraDaysDialogOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmodel, setSelectedSubmodel] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [tarifications, setTarifications] = useState([]);
  const [selectedTarifLang, setSelectedTarifLang] = useState(
    localStorage.getItem("tarifLang") || "uz",
  );
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [gettingUsers, setGettingUsers] = useState(false);
  const [selectedWorks, setSelectedWorks] = useState([
    {
      id: "",
      quantity: "",
      tempId: Date.now(),
    },
  ]);
  const [tarifLogs, setTarifLogs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [editingID, setEditingID] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [editing, setEditing] = useState(false);

  const [empComboOpen, setEmpComboOpen] = useState(false);
  const [workPopoverOpen, setWorkPopoverOpen] = useState({});

  // Search and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "code",
    direction: "asc",
  });
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem("salarySelectedDate") ||
      new Date().toISOString().split("T")[0],
  );

  const [attendanceSalary, setAttendanceSalary] = useState(0);

  useEffect(() => {
    const fetchAttendanceSalary = async () => {
      try {
        const response = await api.get(`/internalAccountant/orderSalary/${id}`);
        setAttendanceSalary(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Ma'lumot olishda xatolik",
          variant: "destructive",
        });
      }
    };
    fetchAttendanceSalary();
  }, []);

  const overLimitTarifs = useMemo(() => {
    if (!order || !order.quantity || !tarifLogs?.length) return [];

    const grouped = {};

    tarifLogs.forEach((log) => {
      const id = log.tarification?.id;
      if (!id) return;

      if (!grouped[id]) {
        grouped[id] = {
          id,
          code: log.tarification?.code,
          name: log.tarification?.name,
          total: 0,
          users: [],
        };
      }

      grouped[id].total += Number(log.quantity || 0);
      grouped[id].users.push({
        name: log.employee?.name || "Noma'lum",
        quantity: Number(log.quantity || 0),
      });
    });

    return Object.values(grouped).filter((item) => item.total > order.quantity);
  }, [tarifLogs, order]);

  const underLimitTarifs = useMemo(() => {
    if (!order || !order.quantity || !tarifications?.length) return [];

    // Group from tarifLogs
    const grouped = {};

    tarifLogs.forEach((log) => {
      const id = log.tarification?.id;
      if (!id) return;

      if (!grouped[id]) {
        grouped[id] = {
          id,
          code: log.tarification?.code,
          name: log.tarification?.name,
          total: 0,
          users: [],
        };
      }

      grouped[id].total += Number(log.quantity || 0);
      grouped[id].users.push({
        name: log.employee?.name || "Noma'lum",
        quantity: Number(log.quantity || 0),
      });
    });

    const merged = tarifications.map((tarif) => {
      if (grouped[tarif.id]) {
        return grouped[tarif.id];
      } else {
        return {
          id: tarif.id,
          code: tarif.code,
          name: tarif.name,
          total: 0,
          users: [], // no one worked on it
        };
      }
    });

    return merged.filter((item) => item.total < order.quantity);
  }, [tarifLogs, tarifications, order]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering to tarifLogs
  const sortedAndFilteredLogs = useMemo(() => {
    let filtered = [...(tarifLogs || [])];

    // Apply search filter
    if (searchTerm || employeeSearch) {
      const term = searchTerm?.toLowerCase() || "";
      const employeeTerm = employeeSearch?.toLowerCase() || "";

      filtered = filtered.filter((log) => {
        const matchesSearch =
          !searchTerm ||
          log?.tarification?.code?.toLowerCase().includes(term) ||
          log?.tarification?.name?.toLowerCase().includes(term);

        const matchesEmployee =
          !employeeSearch ||
          log?.employee?.name?.toLowerCase().includes(employeeTerm);

        return matchesSearch && matchesEmployee;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let compare = 0;

      if (sortConfig.key === "code") {
        compare = (a?.tarification?.code || "").localeCompare(
          b?.tarification?.code || "",
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          },
        );
      } else if (sortConfig.key === "employee") {
        compare = (a?.employee?.name || "").localeCompare(
          b?.employee?.name || "",
        );
      } else if (sortConfig.key === "quantity") {
        compare = (a.quantity || 0) - (b.quantity || 0);
      } else if (sortConfig.key === "amount") {
        compare = (a.amount_earned || 0) - (b.amount_earned || 0);
      } else if (sortConfig.key === "date") {
        compare = new Date(a.date) - new Date(b.date);
      }

      return sortConfig.direction === "asc" ? compare : -compare;
    });
  }, [tarifLogs, searchTerm, employeeSearch, sortConfig]);

  const editExistingWork = async () => {
    setEditing(true);
    try {
      await api.patch(
        `/internalAccountant/employeeTarificationLog/${editingID}`,
        {
          quantity: Number.parseInt(newQuantity),
        },
      );
      toast({
        title: "Muvaffaqiyat",
        description: "Miqdor o'zgartirildi",
        variant: "default",
      });
      setEditingID("");
      setNewQuantity("");
      fetchOrder();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ishlar tayinlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const totalSpends = useMemo(
    () =>
      order?.order_model?.submodels?.reduce(
        (acc, submodel) =>
          acc +
          parseFloat(
            submodel?.submodel_spend?.reduce(
              (acc, spend) =>
                acc + (spend?.region == "uz" ? parseFloat(spend?.seconds) : 0),
              0,
            ),
          ),
        0,
      ),
    [order?.order_model?.submodels],
  );

  const totalSpendsRU = useMemo(
    () =>
      order?.order_model?.submodels?.reduce(
        (acc, submodel) =>
          acc +
          parseFloat(
            submodel?.submodel_spend?.reduce(
              (acc, spend) =>
                acc + (spend?.region == "ru" ? parseFloat(spend?.seconds) : 0),
              0,
            ),
          ),
        0,
      ),
    [order?.order_model?.submodels],
  );

  const totalSpendSummaUZ = useMemo(
    () =>
      order?.order_model?.submodels?.reduce(
        (acc, submodel) =>
          acc +
          Number.parseFloat(
            submodel?.submodel_spend?.reduce(
              (acc, spend) =>
                acc +
                Number.parseFloat(spend?.region == "uz" ? spend?.summa : 0),
              0,
            ),
          ),
        0,
      ),
    [order?.order_model?.submodels],
  );

  const totalSpendSummaRU = useMemo(
    () =>
      order?.order_model?.submodels?.reduce(
        (acc, submodel) =>
          acc +
          Number.parseFloat(
            submodel?.submodel_spend?.reduce(
              (acc, spend) =>
                acc +
                Number.parseFloat(spend?.region == "ru" ? spend?.summa : 0),
              0,
            ),
          ),
        0,
      ),
    [order?.order_model?.submodels],
  );

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/internalAccountant/orders/${id}`);
      setOrder(response.data);
      setSelectedSubmodel(response.data?.order_model?.submodels?.[0]);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday buyurtma topilmadi",
        variant: "destructive",
      });
      navigate("/technolog/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id, navigate]);

  const fetchEmployees = async () => {
    setGettingUsers(true);
    try {
      const response = await api.get(`/internalAccountant/users`, {
        params: {
          status: selectedStatus,
        },
      });
      setEmployees(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ishchilar topilmadi",
        variant: "destructive",
      });
    } finally {
      setGettingUsers(false);
    }
  };

  useEffect(() => {
    if (selectedSubmodel) {
      fetchEmployees();
    }
  }, [selectedSubmodel, selectedStatus]);

  const fetchTarifLogs = async () => {
    try {
      const response = await api.get(`/internalAccountant/tarificationLogs`, {
        params: {
          submodel_id: selectedSubmodel?.id,
          region: selectedTarifLang,
        },
      });
      setTarifLogs(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday tariflar topilmadi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedSubmodel) {
      fetchTarifLogs();
    }
  }, [selectedSubmodel, selectedTarifLang]);

  useEffect(() => {
    if (selectedSubmodel) {
      api
        .get(`/internalAccountant/tarifications`, {
          params: {
            submodel_id: selectedSubmodel?.id,
            region: selectedTarifLang,
          },
        })
        .then((response) => {
          setTarifications(response.data.tarifications);
        })
        .catch((error) => {
          toast({
            title: "Xatolik",
            description: error.response?.data?.message || "Tariflar topilmadi",
            variant: "destructive",
          });
        });
    }
  }, [selectedSubmodel, selectedTarifLang]);

  const addWork = () => {
    setSelectedWorks([
      ...selectedWorks,
      {
        id: "",
        quantity: "",
        tempId: Date.now(),
      },
    ]);
  };

  const removeWork = (tempId) => {
    setSelectedWorks(selectedWorks.filter((work) => work.tempId !== tempId));
  };

  const updateWork = (tempId, field, value) => {
    setSelectedWorks(
      selectedWorks.map((work) =>
        work.tempId === tempId ? { ...work, [field]: value } : work,
      ),
    );
  };

  const getSelectedTarification = (tarificationId) => {
    return tarifications.find((tarif) => tarif.id === tarificationId);
  };

  const calculateTotalCost = () => {
    return selectedWorks.reduce((total, work) => {
      const tarification = getSelectedTarification(work.id);
      if (tarification && work.quantity) {
        return total + tarification.summa * Number.parseInt(work.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Xatolik",
        description: "Xodimni tanlang",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Xatolik",
        description: "Sanani tanlang",
        variant: "destructive",
      });
      return;
    }

    if (selectedWorks.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta ish tanlang",
        variant: "destructive",
      });
      return;
    }

    const invalidWorks = selectedWorks.filter(
      (work) =>
        !work.id || !work.quantity || Number.parseInt(work.quantity) <= 0,
    );

    if (invalidWorks.length > 0) {
      toast({
        title: "Xatolik",
        description: "Barcha ishlar uchun tarif va miqdorni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employee_id: selectedEmployee,
        date: selectedDate,
        tarifications: selectedWorks.map((work) => ({
          id: work.id,
          quantity: Number.parseInt(work.quantity),
        })),
      };

      await api.post(`/internalAccountant/salaryCalculate`, payload);

      toast({
        title: "Muvaffaqiyat",
        description: "Ishlar muvaffaqiyatli yozildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 2000,
      });

      // Reset form
      setSelectedEmployee("");
      setSelectedWorks([]);
      // fetch data
      fetchOrder();
      fetchEmployees();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ishlarni tayinlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loadFont = async () => {
    const response = await fetch("/DejaVuSans.ttf");
    const fontData = await response.arrayBuffer();
    const base64Font = btoa(
      new Uint8Array(fontData).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    );
    return base64Font;
  };

  const handleDownload = async () => {
    const doc = new jsPDF();

    // Load and register DejaVuSans font
    const base64Font = await loadFont();
    doc.addFileToVFS("DejaVuSans.ttf", base64Font);
    doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    doc.setFont("DejaVuSans");

    doc.setFontSize(16);
    doc.text("Limitdan o'tganlar", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        ["#", "Kod", "Nomi", "Jami bajarilgan", "Ortiqcha", "Foydalanuvchilar"],
      ],
      body: overLimitTarifs.map((tarif, index) => [
        index + 1,
        tarif.code,
        tarif.name,
        tarif.total,
        tarif.total - order.quantity,
        Object.entries(
          tarif.users.reduce((acc, user) => {
            if (!acc[user.name]) acc[user.name] = 0;
            acc[user.name] += user.quantity;
            return acc;
          }, {}),
        )
          .map(([name, total]) => `${name}: ${total} ta`)
          .join("\n"),
      ]),
      styles: { font: "DejaVuSans", fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [220, 53, 69],
        textColor: 255,
      },
      bodyStyles: {
        textColor: [90, 0, 0],
        valign: "top",
      },
      showHead: "firstPage",
    });

    doc.save("limitdan-o'tganlar.pdf");
  };

  const handleDownloadUnderLimit = async () => {
    const doc = new jsPDF();

    // Load and register DejaVuSans font
    const base64Font = await loadFont();
    doc.addFileToVFS("DejaVuSans.ttf", base64Font);
    doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    doc.setFont("DejaVuSans");

    doc.setFontSize(16);
    doc.text("Limitdan o'tmaganlar", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        ["#", "Kod", "Nomi", "Jami bajarilgan", "Qolgan", "Foydalanuvchilar"],
      ],
      body: underLimitTarifs.map((tarif, index) => [
        index + 1,
        tarif.code,
        tarif.name,
        tarif.total,
        order.quantity - tarif.total,
        Object.entries(
          tarif.users.reduce((acc, user) => {
            if (!acc[user.name]) acc[user.name] = 0;
            acc[user.name] += user.quantity;
            return acc;
          }, {}),
        )
          .map(([name, total]) => `${name}: ${total} ta`)
          .join("\n"),
      ]),
      styles: { font: "DejaVuSans", fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [34, 197, 94], // Green color for under-limit
        textColor: 255,
      },
      bodyStyles: {
        textColor: [21, 128, 61], // Dark green text
        valign: "top",
      },
      showHead: "firstPage",
    });

    doc.save("limitdan-o'tmagan.pdf");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-lg text-gray-600">Yuklanyapti...</span>
      </div>
    );
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {dialogData
                  ?.sort((a, b) => b.salary - a.salary)
                  .map((employee, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">
                        {employee.name}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {Number.parseFloat(employee.salary)?.toLocaleString(
                          "ru-RU",
                          {
                            maximumFractionDigits: 0,
                          },
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={extraDaysDialogOpen} onOpenChange={setExtraDaysDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto space-y-6">
            {dialogData?.map((groupObj, idx) => {
              const group = Object.values(groupObj)?.[0]; // unwrap the dynamic key
              return (
                <div key={idx}>
                  <h3 className="font-semibold mb-2">
                    📅 Sana: {group.date?.split("-").reverse().join(".")} | 💰
                    Jami:{" "}
                    {Number.parseFloat(group.total || 0).toLocaleString(
                      "ru-RU",
                      {
                        maximumFractionDigits: 0,
                      },
                    )}
                  </h3>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">
                          Xodim
                        </th>
                        <th className="border border-gray-300 p-2 text-right">
                          Oylik
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.employees
                        ?.sort((a, b) => b.salary - a.salary)
                        ?.filter((employee) => employee.salary > 0)
                        .map((employee) => (
                          <tr key={employee.employee_id}>
                            <td className="border border-gray-300 p-2">
                              {employee.name}
                            </td>
                            <td className="border border-gray-300 p-2 text-right">
                              {Number.parseFloat(
                                employee.salary,
                              ).toLocaleString("ru-RU", {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center text-gray-600 hover:text-blue-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Orqaga
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">
            Buyurtma #{order?.id}
          </h2>
        </div>

        {/* Order info card */}
        <Card className="bg-gradient-to-r from-sky-100 to-indigo-100 border-none shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {order?.name || "Buyurtma ma'lumotlari"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {order?.order_model?.model?.name || "Model"}
                  </p>
                </div>
                <Badge
                  className={`${
                    statuses[order?.status]?.color
                  } px-3 py-1 font-medium rounded-full text-sm hover:opacity-90`}
                >
                  {statuses[order?.status]?.text}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Details Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Buyurtma haqida</h4>

                <div className="space-y-2">
                  {order?.quantity && (
                    <div className="flex gap-2 items-center">
                      <FileDigit className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Miqdor: {order?.quantity} ta
                      </span>
                    </div>
                  )}
                  {order?.start_date && (
                    <div className="flex gap-2 items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Boshlash: {formatDate(order?.start_date)}
                      </span>
                    </div>
                  )}

                  {order?.end_date && (
                    <div className="flex gap-2 items-center">
                      <CalendarCheckIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Tugash: {formatDate(order?.end_date)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Jami UZ:{" "}
                      <span className="font-bold">
                        {" "}
                        {totalSpends?.toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}
                      </span>{" "}
                      sekund /{" "}
                      <span className="font-bold">
                        {parseFloat(totalSpends / 60)?.toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}
                      </span>{" "}
                      minut
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Jami RU:{" "}
                      <span className="font-bold">
                        {parseFloat(totalSpendsRU)?.toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}
                      </span>{" "}
                      sekund /{" "}
                      <span className="font-bold">
                        {parseFloat(totalSpendsRU / 60)?.toLocaleString(
                          "ru-RU",
                          {
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>{" "}
                      minut
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-bold">
                      Tikayotgan guruh: {selectedSubmodel?.group?.group?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Material Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Material haqida</h4>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BoxIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Material: {order?.order_model?.material?.name || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Material kodi:{" "}
                      {order?.order_model?.material?.code || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BarChartIcon
                      className={cn(
                        "h-4 w-4",
                        order?.order_model?.status
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-bold",
                        order?.order_model?.status
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    >
                      Limit:{" "}
                      {Number.parseFloat(
                        order?.order_model?.rasxod || 0,
                      ).toLocaleString() || "N/A"}{" "}
                      so'm
                      <span className="text-sm ml-1">
                        {order?.order_model?.status
                          ? "(Tasdiqlangan)"
                          : "(Tasdiqlanmagan)"}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Bitcoin
                      className={cn(
                        "h-4 w-4",
                        totalSpendSummaUZ > order?.order_model?.rasxod
                          ? "text-red-500"
                          : "text-black",
                      )}
                    />
                    <span
                      className={cn(
                        "font-bold",
                        totalSpendSummaUZ > order?.order_model?.rasxod
                          ? "text-red-500 text-xl"
                          : "text-sm",
                      )}
                    >
                      Jami UZ:{" "}
                      {totalSpendSummaUZ?.toLocaleString("ru-RU", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      so'm
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Bitcoin
                      className={cn(
                        "h-4 w-4",
                        totalSpendSummaRU > order?.order_model?.rasxod
                          ? "text-red-500"
                          : "text-black",
                      )}
                    />
                    <span
                      className={cn(
                        "font-bold",
                        totalSpendSummaRU > order?.order_model?.rasxod
                          ? "text-red-500 text-xl"
                          : "text-sm",
                      )}
                    >
                      Jami RU:{" "}
                      {totalSpendSummaRU?.toLocaleString("ru-RU", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      so'm
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {order?.comment && (
              <div className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap">
                <MessageSquareIcon className="h-4 w-4 text-gray-500 mt-1" />
                <span className="text-sm">{order?.comment}</span>
              </div>
            )}
            <div className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm">
                Ishchilarga <span className="font-bold">ajratilgan</span> jami
                summa:
              </span>
              <span className="text-sm font-bold">
                {(
                  parseFloat(
                    selectedTarifLang == "uz"
                      ? totalSpendSummaUZ
                      : totalSpendSummaRU || 0,
                  ) * parseFloat(order?.quantity || 0)
                ).toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}{" "}
                {selectedTarifLang == "uz" ? "so'm UZ" : "so'm RU"}
              </span>
            </div>
            <div
              className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap"
              onClick={() => {
                setDialogType(
                  `Ishchilar topgan summa: ${attendanceSalary?.tarification_total?.toLocaleString(
                    "ru-RU",
                    {
                      maximumFractionDigits: 0,
                    },
                  )} so'm`,
                );
                setDialogOpen(true);
                setDialogData(
                  attendanceSalary?.tarification_employees?.filter(
                    (employee) => employee.salary > 0,
                  ),
                );
              }}
            >
              <span className="text-sm">
                Ishchilar <span className="font-bold">topgan</span> jami summa:
              </span>
              <span className="text-sm font-bold">
                {attendanceSalary?.tarification_total?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}{" "}
                /{" "}
                {parseFloat(
                  (attendanceSalary?.tarification_total * 100) /
                    (parseFloat(
                      selectedTarifLang == "uz"
                        ? totalSpendSummaUZ
                        : totalSpendSummaRU || 0,
                    ) *
                      parseFloat(order?.quantity || 0)),
                )?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}{" "}
                %
              </span>
            </div>
            <div
              className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap"
              onClick={() => {
                setDialogOpen(true);
                setDialogType(
                  `Oylikchilar topgan summa: ${attendanceSalary?.salary_total?.toLocaleString(
                    "ru-RU",
                    {
                      maximumFractionDigits: 0,
                    },
                  )} so'm`,
                );
                setDialogData(
                  attendanceSalary?.salary_employees?.filter(
                    (employee) => employee.salary > 0,
                  ),
                );
              }}
            >
              <span className="text-sm">
                Oylikchilar <span className="font-bold">topgan</span> jami
                summa, Davomati uchun:
              </span>
              <span className="text-sm font-bold">
                {attendanceSalary?.salary_total?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div
              className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap"
              onClick={() => {
                setDialogType(
                  `Universallar bosgan summa: ${parseFloat(
                    attendanceSalary?.fixed_with_tarification_total,
                  )?.toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })} so'm`,
                );
                setDialogOpen(true);
                setDialogData(
                  attendanceSalary?.fixed_with_tarification_employees?.filter(
                    (employee) => employee.salary > 0,
                  ),
                );
              }}
            >
              <span className="text-sm">
                Universellar <span className="font-bold">bosgan</span> jami
                summa{" "}
              </span>
              <span className="text-sm font-bold">
                {attendanceSalary?.fixed_with_tarification_total?.toLocaleString(
                  "ru-RU",
                  {
                    maximumFractionDigits: 0,
                  },
                )}{" "}
              </span>
            </div>
            {attendanceSalary?.extra_days_total > 0 && (
              <div
                className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap"
                onClick={() => {
                  setDialogType(
                    `Qo'shimcha kun kelganlar jami: ${parseFloat(
                      attendanceSalary?.extra_days_total,
                    )?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 0,
                    })} so'm`,
                  );
                  setExtraDaysDialogOpen(true);
                  setDialogData(attendanceSalary?.extra_days);
                }}
              >
                <span className="text-sm">Qo'shimcha kun kelganlar jami </span>
                <span className="text-sm font-bold">
                  {attendanceSalary?.extra_days_total?.toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })}{" "}
                </span>
              </div>
            )}
            <div className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-4 flex-wrap">
              <span className="text-sm">Sarflangan summa:</span>
              <span className="text-sm font-bold">
                {parseFloat(
                  parseFloat(attendanceSalary?.tarification_total) +
                    parseFloat(attendanceSalary?.salary_total) -
                    parseFloat(
                      attendanceSalary?.fixed_with_tarification_total,
                    ) +
                    parseFloat(attendanceSalary?.extra_days_total),
                )?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}{" "}
                so'm
              </span>

              <span className="text-sm">Farqi:</span>
              <span className="text-sm font-bold">
                {(
                  ((parseFloat(attendanceSalary?.tarification_total || 0) +
                    parseFloat(attendanceSalary?.salary_total || 0) -
                    parseFloat(
                      attendanceSalary?.fixed_with_tarification_total || 0,
                    ) +
                    parseFloat(attendanceSalary?.extra_days_total || 0)) /
                    (parseFloat(
                      selectedTarifLang === "uz"
                        ? totalSpendSummaUZ
                        : totalSpendSummaRU || 0,
                    ) *
                      parseFloat(order?.quantity || 0))) *
                  100
                )?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 2,
                })}
                %
              </span>

              <span className="text-sm">Raqamda farqi:</span>
              <span className="text-sm font-bold">
                {(
                  parseFloat(
                    selectedTarifLang === "uz"
                      ? totalSpendSummaUZ
                      : totalSpendSummaRU || 0,
                  ) *
                    parseFloat(order?.quantity || 0) -
                  (parseFloat(attendanceSalary?.tarification_total || 0) +
                    parseFloat(attendanceSalary?.salary_total || 0) -
                    parseFloat(
                      attendanceSalary?.fixed_with_tarification_total || 0,
                    ) +
                    parseFloat(attendanceSalary?.extra_days_total || 0))
                )?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}{" "}
                so'm
              </span>
            </div>
            <div className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm">Tikilgan vaqti:</span>
              <span className="text-sm font-bold">
                {attendanceSalary?.date_range}
              </span>
            </div>
            {order?.order_model?.sizes &&
              order.order_model.sizes.length > 0 && (
                <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <RulerIcon className="h-4 w-4 mr-2 text-indigo-500" />
                    <span>O'lchamlar</span>
                  </h4>
                  <div className="flex items-center flex-wrap gap-3">
                    {order?.order_model?.sizes?.map((size) => (
                      <Badge
                        key={size.id}
                        className="bg-white text-indigo-700 border border-indigo-200 px-3 py-2 text-base w-fit hover:bg-indigo-50"
                      >
                        <span className="font-bold">{size?.size?.name}</span>{" "}
                        {size?.quantity ? (
                          <span className="font-medium mx-1 text-black">
                            {size?.quantity} ta
                          </span>
                        ) : (
                          ""
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {order?.order_model?.submodels?.length > 0 && (
          <div className="w-full space-y-6">
            {/* Submodel buttons */}
            <div className="flex flex-wrap gap-2 bg-blue-50 p-3 rounded-lg">
              {order?.order_model?.submodels?.map((submodel) => (
                <Button
                  key={submodel?.submodel?.id}
                  variant={
                    selectedSubmodel?.submodel?.id === submodel?.submodel?.id
                      ? "default"
                      : "outline"
                  }
                  className={
                    selectedSubmodel?.submodel?.id === submodel?.submodel?.id
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white text-gray-700 hover:bg-blue-100"
                  }
                  onClick={() => setSelectedSubmodel(submodel)}
                >
                  {submodel?.submodel?.name}
                </Button>
              ))}
            </div>

            {/* Language selection */}
            <div className="flex items-center gap-2">
              <Button
                variant={selectedTarifLang === "uz" ? "default" : "outline"}
                onClick={() => {
                  setSelectedTarifLang("uz");
                  setSelectedWorks([]);
                  localStorage.setItem("tarifLang", "uz");
                }}
              >
                O'zbek tarifikatsiya
              </Button>
              <Button
                variant={selectedTarifLang === "ru" ? "default" : "outline"}
                onClick={() => {
                  setSelectedTarifLang("ru");
                  setSelectedWorks([]);
                  localStorage.setItem("tarifLang", "ru");
                }}
              >
                Rus tarifikatsiya
              </Button>
            </div>

            {/* Work Assignment Form */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Ish tayinlash
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Employee Selection */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Popover open={empComboOpen} onOpenChange={setEmpComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={empComboOpen}
                        className="w-fit justify-between"
                        disabled={gettingUsers}
                      >
                        {selectedEmployee
                          ? employees?.find(
                              (emp) => emp.id === selectedEmployee,
                            )?.name
                          : "Xodimni tanlang"}
                        {gettingUsers && <Loader2 className="animate-spin" />}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Xodimni qidirish..." />
                        <CommandEmpty>
                          <p className="text-center text-muted-foreground">
                            Xodim topilmadi.
                          </p>
                        </CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {employees
                              ?.sort((a, b) => a.name.localeCompare(b.name))
                              ?.map((employee) => (
                                <CommandItem
                                  key={employee.id}
                                  onSelect={() => {
                                    setSelectedEmployee(employee.id);
                                    setEmpComboOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col gap-1">
                                    {employee.name}
                                    <span className="text-xs text-muted-foreground">
                                      {employee.group?.name}{" "}
                                      {employee?.position?.name}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => {
                      setSelectedStatus(value);
                      localStorage.setItem("empStatus", value);
                      setSelectedEmployee(null);
                    }}
                  >
                    <SelectTrigger
                      className={`${selectedStatus === "kicked" ? "bg-red-200" : "bg-green-200"} w-fit`}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">Ishlayotgan</SelectItem>
                      <SelectItem value="kicked">Ishdan ketgan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    className="w-fit"
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      localStorage.setItem(
                        "salarySelectedDate",
                        e.target.value,
                      );
                    }}
                  />
                </div>

                {/* Works Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ishlarni tanlang</Label>
                  </div>

                  {selectedWorks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Hali hech qanday ish tanlanmagan. "Ish qo'shish" tugmasini
                      bosing.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedWorks.map((work) => (
                        <Card key={work.tempId} className="p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <div className="space-y-2 flex flex-col gap-1">
                              <Label>Tarifikatsiya</Label>
                              <Popover
                                open={workPopoverOpen[work.tempId] || false}
                                onOpenChange={(open) =>
                                  setWorkPopoverOpen((prev) => ({
                                    ...prev,
                                    [work.tempId]: open,
                                  }))
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={
                                      workPopoverOpen[work.tempId] || false
                                    }
                                    className="w-full justify-between truncate"
                                  >
                                    {work.id
                                      ? `${
                                          tarifications?.find(
                                            (t) => t.id === work.id,
                                          )?.code || ""
                                        } - ${
                                          tarifications?.find(
                                            (t) => t.id === work.id,
                                          )?.name || ""
                                        } - ${
                                          tarifications?.find(
                                            (t) => t.id === work.id,
                                          )?.number || ""
                                        }`
                                      : "Ishni tanlang"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="min-w-[200px] p-0">
                                  <Command>
                                    <CommandInput placeholder="Ish qidirish..." />
                                    <CommandEmpty>
                                      <p className="text-center text-muted-foreground py-2">
                                        Ish topilmadi.
                                      </p>
                                    </CommandEmpty>
                                    <CommandList>
                                      <CommandGroup>
                                        {tarifications
                                          ?.sort((a, b) =>
                                            a.code.localeCompare(
                                              b.code,
                                              undefined,
                                              {
                                                numeric: true,
                                                sensitivity: "base",
                                              },
                                            ),
                                          )
                                          ?.filter((tarification) => {
                                            const isAlreadySelected =
                                              selectedWorks.some(
                                                (w) =>
                                                  w.id === tarification.id &&
                                                  w.tempId !== work.tempId,
                                              );
                                            return !isAlreadySelected;
                                          })
                                          ?.map((tarification) => (
                                            <CommandItem
                                              key={tarification.id}
                                              value={`${tarification.code} - ${tarification.name} - ${tarification.number}`}
                                              onSelect={() => {
                                                updateWork(
                                                  work.tempId,
                                                  "id",
                                                  tarification.id,
                                                );
                                                setWorkPopoverOpen((prev) => ({
                                                  ...prev,
                                                  [work.tempId]: false,
                                                }));
                                              }}
                                              className="flex items-center justify-between"
                                            >
                                              <div>
                                                <span>
                                                  {tarification.code} -{" "}
                                                  {tarification.name}
                                                </span>{" "}
                                                <br />
                                                <span>
                                                  Raqam: {tarification.number}
                                                </span>
                                              </div>
                                              {work.id === tarification.id && (
                                                <Check className="h-4 w-4 text-primary" />
                                              )}
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-2 flex flex-col gap-1">
                              <Label>
                                {(() => {
                                  const tarification = getSelectedTarification(
                                    work.id,
                                  );

                                  if (tarification) {
                                    return (
                                      <p className="text-gray-500 text-xs">
                                        Limit: {tarification.limit}, Bajarilgan:{" "}
                                        {tarification.total_quantity || 0}
                                      </p>
                                    );
                                  } else {
                                    return "Miqdor";
                                  }
                                })()}
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                max={(() => {
                                  const tarification = getSelectedTarification(
                                    work.id,
                                  );
                                  return tarification
                                    ? Math.max(0, tarification.limit)
                                    : undefined;
                                })()}
                                placeholder="Miqdorni kiriting"
                                value={work.quantity}
                                onChange={(e) =>
                                  updateWork(
                                    work.tempId,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className={(() => {
                                  const tarification = getSelectedTarification(
                                    work.id,
                                  );
                                  const availableLimit = tarification
                                    ? tarification.limit
                                    : 0;
                                  const currentQuantity =
                                    Number.parseInt(work.quantity) || 0;
                                  return currentQuantity > availableLimit
                                    ? "border-red-500 focus:border-red-500 bg-white min-w-[150px]"
                                    : "bg-white min-w-[150px]";
                                })()}
                              />
                            </div>

                            <div className="space-y-2 flex flex-col gap-1">
                              <Label>O'chirish</Label>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => removeWork(work.tempId)}
                                className="flex items-center gap-2 w-fit"
                              >
                                <Trash2 className="h-4 w-4 " />
                                O'chirish
                              </Button>
                            </div>
                          </div>

                          {/* Work Details */}
                          {work.id && (
                            <div className="mt-4 p-3 bg-white rounded border">
                              {(() => {
                                const tarification = getSelectedTarification(
                                  work.id,
                                );
                                return tarification ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Kod:
                                        </span>{" "}
                                        {tarification.code}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Sekund:
                                        </span>{" "}
                                        {formatNumber(tarification.second)}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Summa:
                                        </span>{" "}
                                        {formatNumber(tarification.summa)} so'm
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Limit:
                                        </span>{" "}
                                        {tarification.limit?.toLocaleString()}{" "}
                                        ta
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          Bajarilgan:
                                        </span>
                                        <Badge variant="secondary">
                                          {tarification.total_quantity || 0} ta
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          Mavjud:
                                        </span>
                                        <Badge
                                          variant={
                                            tarification.limit >
                                            (tarification.total_quantity || 0)
                                              ? "default"
                                              : "destructive"
                                          }
                                        >
                                          {Math.max(0, tarification.limit)} ta
                                        </Badge>
                                      </div>
                                      {work.quantity && (
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">
                                            Tanlanган:
                                          </span>
                                          <Badge
                                            variant={
                                              Number.parseInt(work.quantity) <=
                                              tarification.limit
                                                ? "default"
                                                : "destructive"
                                            }
                                          >
                                            {work.quantity} ta
                                          </Badge>
                                        </div>
                                      )}
                                    </div>

                                    {work.quantity && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2 border-t">
                                        <div className="font-medium text-green-600">
                                          Jami summa:{" "}
                                          {formatNumber(
                                            tarification.summa *
                                              Number.parseInt(work.quantity),
                                          )}{" "}
                                          so'm
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addWork}
                    className="flex items-center gap-2 "
                  >
                    <Plus className="h-4 w-4" />
                    Ish qo'shish
                  </Button>
                </div>

                {/* Summary */}
                {selectedWorks.length > 0 && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Jami hisobot
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          Jami ishlar soni: {selectedWorks.length} ta
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bitcoin className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          Jami summa: {formatNumber(calculateTotalCost())} so'm
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !selectedEmployee ||
                    selectedWorks.length === 0 ||
                    submitting
                  }
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? "Yuborilmoqda..." : "Saqlash"}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <Input
                  placeholder="Ish bo'yicha qidirish"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Input
                  placeholder="Xodim bo'yicha qidirish"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
              </div>
              <div className="mt-4 w-full max-h-[80vh] overflow-y-auto">
                <table className="border border-collapse w-full">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th
                        className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("code")}
                      >
                        <div className="flex items-center justify-between">
                          Kodi
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </th>
                      <th className="border border-gray-300 p-2">Nomi</th>
                      <th
                        className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("employee")}
                      >
                        <div className="flex items-center justify-between">
                          Xodim
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </th>
                      <th
                        className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center justify-between">
                          Miqdori
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </th>
                      <th
                        className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("amount")}
                      >
                        <div className="flex items-center justify-between">
                          Summa
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </th>
                      <th
                        className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center justify-between">
                          Sana
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredLogs.length > 0 ? (
                      <>
                        {sortedAndFilteredLogs.map((tarifLog, index) => (
                          <tr key={index}>
                            <td
                              className="border border-gray-300 p-2 text-center"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  tarifLog?.tarification?.code,
                                );
                                toast({
                                  title: "Nusxa olindi",
                                  duration: 700,
                                });
                              }}
                            >
                              <span className="cursor-pointer">
                                {tarifLog?.tarification?.code}
                              </span>
                            </td>
                            <td
                              className="border border-gray-300 p-2"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  tarifLog?.tarification?.name,
                                );
                                toast({
                                  title: "Nusxa olindi",
                                  duration: 700,
                                });
                              }}
                            >
                              {tarifLog?.tarification?.name}
                            </td>
                            <td
                              className="border border-gray-300 p-2"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  tarifLog?.employee?.name,
                                );
                                toast({
                                  title: "Nusxa olindi",
                                  duration: 700,
                                });
                              }}
                            >
                              <span className="cursor-pointer">
                                {tarifLog?.employee?.name}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-2">
                              {editingID === tarifLog?.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    className="w-20"
                                    size="sm"
                                    value={newQuantity}
                                    onChange={(e) => {
                                      setNewQuantity(e.target.value);
                                    }}
                                    disabled={editing}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={editing}
                                    onClick={editExistingWork}
                                  >
                                    <Check className="text-green-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={editing}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingID("");
                                      setNewQuantity("");
                                    }}
                                  >
                                    <X className="text-red-500" />
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingID(tarifLog?.id);
                                    setNewQuantity(tarifLog?.quantity);
                                  }}
                                >
                                  {tarifLog?.quantity}
                                  <Button variant="ghost" size="icon">
                                    <Pencil />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2">
                              {parseFloat(
                                tarifLog?.amount_earned,
                              ).toLocaleString("ru-RU", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}{" "}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {tarifLog?.date?.split("-")?.reverse()?.join(".")}
                            </td>
                          </tr>
                        ))}

                        {/* Sum row at the bottom */}
                        <tr className="bg-gray-100 font-bold sticky bottom-0 z-10">
                          <td
                            className="border border-gray-300 p-2 text-center"
                            colSpan={3}
                          >
                            Jami ({sortedAndFilteredLogs.length})
                          </td>
                          <td className="border border-gray-300 p-2">
                            {sortedAndFilteredLogs
                              .reduce(
                                (acc, log) =>
                                  acc + parseFloat(log?.quantity || 0),
                                0,
                              )
                              .toLocaleString("ru-RU", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                          </td>
                          <td className="border border-gray-300 p-2">
                            {sortedAndFilteredLogs
                              .reduce(
                                (acc, log) =>
                                  acc + parseFloat(log?.amount_earned || 0),
                                0,
                              )
                              .toLocaleString("ru-RU", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                          </td>
                          <td className="border border-gray-300 p-2" />
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center">
                          Ishlar topilmadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {underLimitTarifs.length > 0 && (
              <div className="mt-8 bg-green-50 p-4 border border-green-300 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-green-600 text-lg font-semibold">
                    Limitdan o'tmaganlar
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleDownloadUnderLimit();
                    }}
                  >
                    <Download />
                  </Button>
                </div>
                <div className="max-h-[60vh] overflow-auto">
                  <table className="w-full border border-collapse">
                    <thead className="bg-green-100 text-green-800">
                      <tr>
                        <th className="border border-green-300 p-2">#</th>
                        <th className="border border-green-300 p-2">Kod</th>
                        <th className="border border-green-300 p-2">Nomi</th>
                        <th className="border border-green-300 p-2">
                          Jami bajarilgan
                        </th>
                        <th className="border border-green-300 p-2">Qolgan</th>
                        <th className="border border-green-300 p-2">
                          Foydalanuvchilar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {underLimitTarifs.map((tarif, index) => (
                        <tr
                          key={tarif.id}
                          className="bg-white text-green-700 align-top"
                        >
                          <td className="border border-green-300 p-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border border-green-300 p-2">
                            <span
                              className="cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(tarif.code);
                                toast({
                                  title: "Nusxa olindi",
                                  duration: 700,
                                });
                              }}
                            >
                              {tarif.code}
                            </span>
                          </td>
                          <td className="border border-green-300 p-2">
                            {tarif.name}
                          </td>
                          <td className="border border-green-300 p-2">
                            {tarif.total}
                          </td>
                          <td className="border border-green-300 p-2">
                            {order.quantity - tarif.total}
                          </td>
                          <td className="border border-green-300 p-2">
                            <ul className="space-y-1">
                              {Object.entries(
                                tarif.users.reduce((acc, user) => {
                                  if (!acc[user.name]) {
                                    acc[user.name] = 0;
                                  }
                                  acc[user.name] += user.quantity;
                                  return acc;
                                }, {}),
                              )
                                .sort(([aName], [bName]) =>
                                  aName.localeCompare(bName),
                                )
                                .map(([name, totalQuantity], idx) => (
                                  <li
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <span
                                      className="cursor-pointer"
                                      onClick={() => {
                                        navigator.clipboard.writeText(name);
                                        toast({
                                          title: "Nusxa olindi",
                                          duration: 700,
                                        });
                                      }}
                                    >
                                      {name}
                                    </span>
                                    <span className="font-semibold">
                                      {totalQuantity} ta
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {overLimitTarifs.length > 0 && (
              <div className="mt-8 bg-red-50 p-4 border border-red-300 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-red-600 text-lg font-semibold">
                    Limitdan o'tganlar
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleDownload();
                    }}
                  >
                    <Download />
                  </Button>
                </div>
                <div className="max-h-[60vh] overflow-auto">
                  <table className="w-full border border-collapse">
                    <thead className="bg-red-100 text-red-800">
                      <tr>
                        <th className="border border-red-300 p-2">#</th>
                        <th className="border border-red-300 p-2">Kod</th>
                        <th className="border border-red-300 p-2">Nomi</th>
                        <th className="border border-red-300 p-2">
                          Jami bajarilgan
                        </th>
                        <th className="border border-red-300 p-2">Ortiqcha</th>
                        <th className="border border-red-300 p-2">
                          Foydalanuvchilar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {overLimitTarifs.map((tarif, index) => (
                        <tr
                          key={tarif.id}
                          className="bg-white text-red-700 align-top"
                        >
                          <td className="border border-red-300 p-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border border-red-300 p-2">
                            <span
                              className="cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(tarif.code);
                                toast({
                                  title: "Nusxa olindi",
                                  duration: 700,
                                });
                              }}
                            >
                              {tarif.code}
                            </span>
                          </td>
                          <td className="border border-red-300 p-2">
                            {tarif.name}
                          </td>
                          <td className="border border-red-300 p-2">
                            {tarif.total}
                          </td>
                          <td className="border border-red-300 p-2">
                            {tarif.total - order.quantity}
                          </td>
                          <td className="border border-red-300 p-2">
                            <ul className="space-y-1">
                              {Object.entries(
                                tarif.users.reduce((acc, user) => {
                                  if (!acc[user.name]) {
                                    acc[user.name] = 0;
                                  }
                                  acc[user.name] += user.quantity;
                                  return acc;
                                }, {}),
                              )
                                .sort(([aName], [bName]) =>
                                  aName.localeCompare(bName),
                                )
                                .map(([name, totalQuantity], idx) => (
                                  <li
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <span
                                      className="cursor-pointer"
                                      onClick={() => {
                                        navigator.clipboard.writeText(name);
                                        toast({
                                          title: "Nusxa olindi",
                                          duration: 700,
                                        });
                                      }}
                                    >
                                      {name}
                                    </span>
                                    <span className="font-semibold">
                                      {totalQuantity} ta
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Employees that has no work */}
            <Card className="p-4">
              <h1 className="font-semibold text-blue-800 mb-2">
                Ish biriktirilmagan xodimlar
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees
                  ?.filter(
                    (employee) =>
                      employee.group_id ===
                        selectedSubmodel?.group?.group?.id &&
                      !tarifLogs?.some(
                        (log) => log.employee?.id === employee.id,
                      ),
                  )
                  ?.sort((a, b) => a.name.localeCompare(b.name))
                  ?.map((employee, index) => (
                    <div
                      key={index}
                      className="p-2 bg-blue-50 border-blue-200 flex items-center gap-2"
                    >
                      <div>{index + 1}.</div>
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(employee.name);
                          toast({
                            title: "Nusxa olindi",
                            duration: 700,
                          });
                        }}
                      >
                        {employee.name}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default Work;
