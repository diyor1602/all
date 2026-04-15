import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  TrendingUp,
  Calculator,
  Loader2,
  Copy,
  ClipboardPaste,
  TrendingDown,
  ScrollText,
  Wallet,
  Receipt,
  Users,
  DollarSign,
  Package,
  Target,
  PieChart,
  Building2,
  UserCheck,
  Car,
  Wrench,
  Scissors,
  Download,
  FileText,
  Landmark,
  Snowflake,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  monthly_expence_types,
  monthly_expence_currency,
} from "@/lib/monthlyExpenceTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formatNumber = (number, maximumFractionDigits = 0) => {
  return Number.parseFloat(number || 0).toLocaleString("ru-RU", {
    maximumFractionDigits,
  });
};

const Daily = () => {
  const [daily, setDaily] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem("dailySelectedDate") ||
      new Date().toISOString().split("T")[0],
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState({});
  const [showExpenses, setShowExpenses] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({ type: "", amount: "" });
  const [pasteData, setPasteData] = useState("");
  const [isPasting, setIsPasting] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dollarRate, setDollarRate] = useState(
    localStorage.getItem("dollarRate") || 12100,
  );
  const [dollarDialogOpen, setDollarDialogOpen] = useState(false);
  const [newDollarRate, setNewDollarRate] = useState(dollarRate);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseOrder, setExpenseOrder] = useState(null);
  const pdfContentRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [additionalMetricsDialogOpen, setAdditionalMetricsDialogOpen] =
    useState(false);
  const [additionalMetricsData, setAdditionalMetricsData] = useState(null);
  const [downloading, setDownloading] = useState({
    excel: false,
    pdf: false,
  });

  const getDollarRate = async () => {
    try {
      const response = await axios.get(
        "https://cbu.uz/uz/arkhiv-kursov-valyut/json/",
      );
      setDollarRate(response.data.find((item) => item.Ccy === "USD").Rate);
      localStorage.setItem(
        "dollarRate",
        response.data.find((item) => item.Ccy === "USD").Rate,
      );
      fetchDaily();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Dollar kursini olishda xatolik",
      });
    }
  };

  useEffect(() => {
    getDollarRate();
  }, []);

  const handleDownload = async (fileType = "excel") => {
    try {
      setDownloading((prev) => ({
        ...prev,
        [fileType]: true,
      }));

      const response = await api.get(`/ceo/monthly-export/${fileType}`, {
        params: {
          start_date: selectedDate,
          end_date: selectedDate,
          dollar_rate: await getDollarRate(),
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          fileType === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      link.setAttribute(
        "download",
        `${selectedDate}.${fileType === "excel" ? "xlsx" : "pdf"}`,
      );
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message ||
          `${fileType.toUpperCase()} ma'lumotlarni olishda xatolik`,
      });
    } finally {
      setDownloading((prev) => ({
        ...prev,
        [fileType]: false,
      }));
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total) return 0;
    if (!value) return 0;
    return ((value / total) * 100).toFixed(2);
  };

  const calculateTotal = (expenseOrder) => {
    return (
      (parseFloat(expenseOrder?.costs_uzs?.allocatedAup) || 0) +
      (parseFloat(expenseOrder?.costs_uzs?.bonus) || 0) +
      (parseFloat(expenseOrder?.costs_uzs?.allocatedMonthlyExpenseMonthly) ||
        0) +
      (parseFloat(expenseOrder?.costs_uzs?.allocatedTransport) || 0) +
      (parseFloat(expenseOrder?.costs_uzs?.amortizationExpense) || 0) +
      (parseFloat(expenseOrder?.costs_uzs?.incomePercentageExpense) || 0) +
      (parseFloat(expenseOrder?.costs_uzs?.remainder) || 0) +
      (parseFloat(expenseOrder?.costs_uzs?.tarification) || 0)
    );
  };

  const handleExpenceDialog = (order) => {
    setExpenseOrder(order);
    setExpenseDialogOpen(true);
  };

  const updateDollarRate = async () => {
    localStorage.setItem("dollarRate", newDollarRate);
    setDollarRate(newDollarRate);
    setDollarDialogOpen(false);
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
    localStorage.setItem(
      "dailySelectedDate",
      currentDate.toISOString().split("T")[0],
    );
  };

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ceo/dailyReport", {
        params: {
          date: selectedDate,
          dollar_rate: await getDollarRate(),
        },
      });
      setDaily(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kunlik ma'lumotlarni olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyExpenses = async () => {
    try {
      const response = await api.get("/ceo/monthlyExpense", {
        params: { month: selectedDate?.slice(0, -3) },
      });
      setMonthlyExpenses(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Oylik harajatlar ma'lumotlarni olishda xatolik",
      });
    }
  };

  const copyExpenses = async () => {
    try {
      if (!monthlyExpenses?.expenses || monthlyExpenses.expenses.length === 0) {
        toast({
          variant: "destructive",
          title: "Diqqat",
          description: "Nusxalash uchun harajatlar mavjud emas",
          duration: 1500,
        });
        return;
      }

      // Create a clean copy of expenses without IDs and month-specific data
      const expensesToCopy = monthlyExpenses.expenses.map((expense) => ({
        name: expense.name,
        type: expense.type,
        amount: expense.amount,
      }));

      const jsonData = JSON.stringify(expensesToCopy, null, 2);

      // Copy to clipboard
      await navigator.clipboard.writeText(jsonData);

      toast({
        title: "Muvaffaqiyat",
        description: `${expensesToCopy.length} ta harajat nusxalandi`,
        style: {
          background: "green",
          color: "white",
        },
        duration: 1500,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Nusxalashda xatolik yuz berdi",
      });
    }
  };

  const pasteExpenses = async () => {
    if (!pasteData.trim()) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Qo'yish uchun ma'lumot kiriting",
        duration: 1500,
      });
      return;
    }

    setIsPasting(true);
    try {
      const expensesToPaste = JSON.parse(pasteData);

      if (!Array.isArray(expensesToPaste)) {
        throw new Error("Ma'lumot massiv formatida bo'lishi kerak");
      }

      const month = selectedDate.slice(0, 7);
      let successCount = 0;
      let errorCount = 0;

      // Send each expense to backend one by one
      for (const expense of expensesToPaste) {
        try {
          if (!expense.name || !expense.amount || !expense.type) {
            errorCount++;
            continue;
          }

          await api.post("/ceo/monthlyExpense", {
            ...expense,
            month,
            amount: Number.parseFloat(expense.amount),
          });

          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Jarayon tugadi",
        description: `${successCount} ta harajat qo'shildi${
          errorCount > 0 ? `, ${errorCount} ta xatolik` : ""
        }`,
        style: {
          background: errorCount > 0 ? "orange" : "green",
          color: "white",
        },
        duration: 2000,
      });

      setPasteData("");
      setIsPasteDialogOpen(false);
      fetchMonthlyExpenses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          "Ma'lumotni tahlil qilishda xatolik. JSON formatini tekshiring.",
      });
    } finally {
      setIsPasting(false);
    }
  };

  const addExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.type) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Harajat nomi, miqdori va turi bo'sh bo'lishi mumkin emas",
        duration: 1500,
      });
      return;
    }
    setSending(true);
    try {
      const month = selectedDate.slice(0, 7);
      await api.post("/ceo/monthlyExpense", {
        ...newExpense,
        month,
        amount: Number.parseFloat(newExpense.amount),
      });

      toast({
        title: "Muvaffaqiyat",
        description: "Harajat qo'shildi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 1500,
      });

      setNewExpense({ name: "", amount: "", type: "" });
      setIsAddDialogOpen(false);
      fetchMonthlyExpenses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Harajat qo'shishda xatolik",
      });
    } finally {
      setSending(false);
    }
  };

  const editExpense = async () => {
    if (
      !editingExpense.name ||
      !editingExpense.amount ||
      !editingExpense.type
    ) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Harajat nomi, miqdori va turi bo'sh bo'lishi mumkin emas",
        duration: 1500,
      });
      return;
    }
    setSending(true);
    try {
      await api.patch(`/ceo/monthlyExpense/${editingExpense.id}`, {
        name: editingExpense.name,
        type: editingExpense.type,
        amount: Number.parseFloat(editingExpense.amount),
      });

      toast({
        title: "Muvaffaqiyat",
        description: "Harajat yangilandi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 1500,
      });

      setIsEditDialogOpen(false);
      setEditingExpense(null);
      fetchMonthlyExpenses();
      fetchDaily();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Harajat yangilashda xatolik",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchDaily();
    fetchMonthlyExpenses();
  }, [selectedDate, dollarRate]);

  const metrics = [
    {
      title: "Ko'rsatilgan xizmat",
      value: `${formatNumber(daily.total_earned_uzs)} so'm`,
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-300",
    },
    {
      title: "Harajat",
      value:
        daily.orders?.length === 0
          ? `-${formatNumber(
              parseFloat(daily.aup) +
                parseFloat(daily.kpi) +
                parseFloat(daily.daily_expenses) +
                parseFloat(daily.tarification) +
                parseFloat(daily.transport_attendance),
            )} so'm`
          : `${formatNumber(daily.total_fixed_cost_uzs)} so'm`,
      percentage:
        daily.orders?.length === 0
          ? 0
          : parseFloat(
              (daily.total_fixed_cost_uzs / daily.total_earned_uzs) * 100,
            )?.toLocaleString("ru-RU", {
              maximumFractionDigits: 0,
            }),
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-300",
    },
    {
      title: "Foyda",
      value:
        daily.orders?.length === 0
          ? `-${formatNumber(
              parseFloat(daily.aup) +
                parseFloat(daily.kpi) +
                parseFloat(daily.daily_expenses) +
                parseFloat(daily.tarification) +
                parseFloat(daily.transport_attendance),
            )} so'm`
          : `${formatNumber(daily.net_profit_uzs)} so'm`,
      percentage:
        daily.orders?.length === 0
          ? 0
          : parseFloat(
              (daily.net_profit_uzs / daily.total_earned_uzs) * 100,
            )?.toLocaleString("ru-RU", {
              maximumFractionDigits: 0,
            }),
      icon: Calculator,
      color: "text-emerald-600",
      bg: "bg-emerald-300",
    },
  ];

  const amountMetrics = [
    {
      title: "Umumiy tikilgan soni",
      value: `${formatNumber(daily.total_output_quantity)} ta`,
      icon: ScrollText,
      color: "text-amber-600",
      bg: "bg-amber-300",
    },
    {
      title: "Bir donasi narxi",
      value: `${formatNumber(
        daily.cost_per_unit_overall_uzs,
      )} so'm / ${parseFloat(
        daily.cost_per_unit_overall_uzs / dollarRate,
      ).toLocaleString("ru-RU", {
        maximumFractionDigits: 2,
      })} dollar`,
      icon: Wallet,
      color: "text-teal-600",
      bg: "bg-teal-300",
    },
  ];

  const additionalMetrics = [
    {
      label: "Jami harajatlar",
      value: daily.total_fixed_cost_uzs,
      bg: "bg-red-300",
      dollar: true,
    },
    {
      label: "Kunlik o'zgarmas harajatlar",
      value: daily.daily_expenses,
      bg: "bg-green-300",
      dollar: true,
    },
    {
      label: "AUP",
      value: daily.aup,
      bg: "bg-emerald-300",
      dollar: true,
    },
    {
      label: "Bitta AUP ga",
      value: daily.aup / daily.total_output_quantity,
      bg: "bg-orange-300",
      dollar: true,
    },
    {
      label: "KPI",
      value: daily.kpi,
      bg: "bg-yellow-300",
      dollar: true,
    },
    {
      label: "Tikuvchilar",
      value: daily.tarification,
      bg: "bg-pink-300",
      dollar: true,
    },
    {
      label: "Transport uchun",
      value: daily.transport_attendance,
      bg: "bg-gray-300",
      dollar: true,
    },
    {
      label: "Tikuv uchun",
      value: daily.orders?.reduce(
        (acc, order) => acc + order.rasxod_limit_uzs,
        0,
      ),
      bg: "bg-purple-300",
      dollar: true,
    },
    {
      label: "1 kishi uchun harajat",
      value: daily.per_employee_cost_uzs?.total,
      bg: "bg-orange-300",
      dollar: true,
      dialogData: daily.per_employee_cost_uzs,
    },
    {
      label: "O'rtacha aktiv ishchilar",
      value: daily.employee_count,
      bg: "bg-lime-300",
      prefix: "ta",
      dollar: false,
    },
  ];

  const generatePDF = async () => {
    if (!expenseOrder || !pdfContentRef.current) return;

    setIsGeneratingPdf(true);
    try {
      const element = pdfContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector("[data-pdf-content]");
          if (clonedElement) {
            clonedElement.style.padding = "0px";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = pdf.internal.pageSize.getHeight() - 20;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = 10;
      const imgY = 10;

      if (imgHeight * ratio > pdfHeight) {
        let position = 0;
        const pageHeight = pdfHeight / ratio;

        while (position < imgHeight) {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            width: element.scrollWidth,
            height: Math.min(pageHeight, imgHeight - position),
            y: position,
            logging: false,
          });

          const pageImgData = canvas.toDataURL("image/png");

          if (position > 0) {
            pdf.addPage();
          }

          pdf.addImage(
            pageImgData,
            "PNG",
            imgX,
            imgY,
            canvas.width * ratio,
            canvas.height * ratio,
          );

          position += pageHeight;
        }
      } else {
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio,
        );
      }

      const fileName = `Harajat_${expenseOrder?.order?.id}_${
        expenseOrder?.order?.name
      }_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "PDF yaratishda xatolik yuz berdi",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-slate-800">Kunlik hisobot</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate(-1)}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              localStorage.setItem("dailySelectedDate", e.target.value);
            }}
            className="w-fit bg-white border-slate-200"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate(1)}
            className="hover:bg-slate-100"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100",
          loading && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="space-y-6">
          {/* Header */}

          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className={cn(
                  "border-0 shadow-md hover:shadow-lg transition-shadow",
                  metric.bg,
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        {metric.title}
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {metric.value}{" "}
                        {metric.percentage ? ` / ${metric.percentage}%` : ""}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-full bg-slate-100 ${metric.color}`}
                    >
                      <metric.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Amount metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {amountMetrics.map((metric, index) => (
              <Card
                key={index}
                className={cn(
                  "border-0 shadow-md hover:shadow-lg transition-shadow",
                  metric.bg,
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        {metric.title}
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {metric.value}{" "}
                        {metric.percentage ? ` / ${metric.percentage}%` : ""}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-full bg-slate-100 ${metric.color}`}
                    >
                      <metric.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Metrics */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-800">
                Qo'shimcha ko'rsatkichlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  className="flex items-center p-3 bg-50 rounded-lg cursor-pointer bg-sky-300"
                  onClick={() => setDollarDialogOpen(true)}
                >
                  <span className="text-sm font-medium text-slate-600 mr-auto">
                    Dollar kursi:
                  </span>
                  <Badge variant="ghost" className="font-mono border-none">
                    {formatNumber(dollarRate)} so'm
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      getDollarRate();
                    }}
                  >
                    <Landmark className="h-4 w-4" />
                  </Button>
                </div>
                {additionalMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex justify-between items-center p-3 bg-50 rounded-lg flex-wrap",
                      metric.bg,
                      metric.dialogData && "cursor-pointer",
                    )}
                    onClick={() => {
                      if (!metric.dialogData) return;
                      setAdditionalMetricsData(metric.dialogData);
                      setAdditionalMetricsDialogOpen(true);
                    }}
                  >
                    <span className="text-sm font-medium text-slate-600">
                      {metric.label}:
                    </span>
                    <Badge variant="ghost" className="font-mono border-none">
                      {formatNumber(metric.value)} {metric.prefix || "so'm"}
                      {metric.dollar
                        ? ` / ${formatNumber(metric.value / dollarRate, 2)} $`
                        : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Dialog open={dollarDialogOpen} onOpenChange={setDollarDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dollar kursini o'zgartirish</DialogTitle>
              </DialogHeader>
              <Input
                type="number"
                value={newDollarRate}
                onChange={(e) => setNewDollarRate(e.target.value)}
                className="w-full"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDollarDialogOpen(false)}
                >
                  Bekor qilish
                </Button>
                <Button onClick={updateDollarRate}>Saqlash</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={additionalMetricsDialogOpen}
            onOpenChange={setAdditionalMetricsDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {formatNumber(additionalMetricsData?.total)} so'm
                </DialogTitle>
                <DialogDescription>
                  {formatNumber(additionalMetricsData?.total / dollarRate, 2)}$
                </DialogDescription>
              </DialogHeader>

              {additionalMetricsData && (
                <div className="flex flex-col items-center">
                  {(() => {
                    // Unified mapping: label + color
                    const metricConfig = {
                      rasxod_limit_uzs: {
                        title: "Tikuv uchun",
                        color: "#3B82F6", // blue
                      },
                      transport: {
                        title: "Transport",
                        color: "#10B981", // green
                      },
                      aup: {
                        title: "AUP",
                        color: "#8B5CF6", // purple
                      },
                      monthly_expense: {
                        title: "Oylik o'zgarmas xarajat",
                        color: "#F97316", // orange
                      },
                      income_percentage_expense: {
                        title: "Soliq",
                        color: "#EC4899", // pink
                      },
                      amortization_expense: {
                        title: "Amortizatsiya",
                        color: "#DC143C", // crimson
                      },
                    };

                    const { total, ...metrics } = additionalMetricsData;
                    const metricsArray = Object.entries(metrics);

                    // Sort by percentage (descending)
                    const sortedMetrics = metricsArray.sort(
                      (a, b) => b[1].percent - a[1].percent,
                    );

                    const radius = 70;
                    const circumference = 2 * Math.PI * radius;
                    let offset = 0;

                    return (
                      <>
                        {/* Pie chart */}
                        <svg
                          width="180"
                          height="180"
                          viewBox="0 0 200 200"
                          className="-rotate-90"
                        >
                          <g transform="translate(100,100)">
                            {sortedMetrics.map(([key, { percent }]) => {
                              const config = metricConfig[key] || {
                                title: key.replace(/_/g, " "),
                                color: "#6366F1", // fallback indigo
                              };

                              const length = (percent / 100) * circumference;
                              const circle = (
                                <circle
                                  key={key}
                                  r={radius}
                                  cx="0"
                                  cy="0"
                                  fill="transparent"
                                  stroke={config.color}
                                  strokeWidth="40"
                                  strokeDasharray={`${length} ${
                                    circumference - length
                                  }`}
                                  strokeDashoffset={-offset}
                                />
                              );
                              offset += length;
                              return circle;
                            })}
                          </g>
                        </svg>

                        {/* Legend */}
                        <div className="mt-4 w-full space-y-1">
                          {sortedMetrics.map(([key, { amount, percent }]) => {
                            const config = metricConfig[key] || {
                              title: key.replace(/_/g, " "),
                              color: "#6366F1",
                            };

                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center space-x-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: config.color }}
                                  />
                                  <span className="capitalize">
                                    {config.title}
                                  </span>
                                </div>
                                <span className="font-mono">
                                  {percent}% ({formatNumber(amount)} so'm)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Monthly Expenses */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-slate-800">
                  Oylik harajatlar
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Dialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus />
                        Qo'shish
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yangi harajat qo'shish</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="type">Turi</Label>
                          <Select
                            value={newExpense.type}
                            onValueChange={(value) =>
                              setNewExpense({
                                ...newExpense,
                                type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Turi" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(monthly_expence_types).map(
                                ([key, value]) => (
                                  <SelectItem key={key} value={key}>
                                    {value}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="name">Nomi</Label>
                          <Input
                            id="name"
                            value={newExpense.name}
                            onChange={(e) =>
                              setNewExpense({
                                ...newExpense,
                                name: e.target.value,
                              })
                            }
                            placeholder="Harajat nomi"
                          />
                        </div>
                        <div>
                          <Label htmlFor="amount">
                            Miqdori ({formatNumber(newExpense.amount)})
                          </Label>
                          <Input
                            id="amount"
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) =>
                              setNewExpense({
                                ...newExpense,
                                amount: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                        <Button
                          onClick={addExpense}
                          className="w-full"
                          disabled={sending}
                        >
                          {sending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Qo'shish"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Copy Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyExpenses}
                    className="gap-2"
                    disabled={!monthlyExpenses?.expenses?.length}
                  >
                    <Copy className="h-4 w-4" />
                    Nusxalash
                  </Button>

                  {/* Paste Button */}
                  <Dialog
                    open={isPasteDialogOpen}
                    onOpenChange={setIsPasteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ClipboardPaste className="h-4 w-4" />
                        Qo'yish
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Harajatlarni qo'yish</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="paste-data">
                            JSON ma'lumotlarni qo'ying:
                          </Label>
                          <Textarea
                            id="paste-data"
                            value={pasteData}
                            onChange={(e) => setPasteData(e.target.value)}
                            placeholder='[{"name": "Harajat nomi", "type": "fixed", "amount": 1000000}, ...]'
                            className="min-h-[200px] font-mono text-sm"
                          />
                        </div>
                        <div className="text-sm text-slate-600">
                          <p className="font-medium mb-2">Format:</p>
                          <code className="bg-slate-100 p-2 rounded block">
                            {`[
  {
    "name": "Harajat nomi",
    "type": "fixed",
    "amount": 1000000
  }
]`}
                          </code>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setPasteData("");
                              setIsPasteDialogOpen(false);
                            }}
                          >
                            Bekor qilish
                          </Button>
                          <Button
                            onClick={pasteExpenses}
                            disabled={isPasting || !pasteData.trim()}
                          >
                            {isPasting ? (
                              <Loader2 className="animate-spin mr-2" />
                            ) : null}
                            Qo'yish
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExpenses(!showExpenses)}
                    className="gap-2"
                  >
                    {showExpenses ? (
                      <>
                        Yashirish <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Ko'rsatish <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showExpenses && (
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="border border-slate-200">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-16 border border-slate-200 text-center">
                          №
                        </TableHead>
                        <TableHead className="border border-slate-200 text-center">
                          Nomi
                        </TableHead>
                        <TableHead className="border border-slate-200 text-center">
                          Turi
                        </TableHead>
                        <TableHead className="border border-slate-200 text-center">
                          Miqdori
                        </TableHead>
                        <TableHead className="w-20 border border-slate-200 text-center">
                          Amallar
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyExpenses?.expenses?.map((expense, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium border border-slate-200 text-center">
                            {i + 1}
                          </TableCell>
                          <TableCell className="border border-slate-200">
                            {expense.name}
                          </TableCell>
                          <TableCell className="border border-slate-200 text-center">
                            {monthly_expence_types[expense.type]}
                          </TableCell>
                          <TableCell className="font-mono border border-slate-200">
                            {parseFloat(expense.amount).toLocaleString(
                              "ru-RU",
                              {
                                maximumFractionDigits: 2,
                              },
                            )}{" "}
                            {monthly_expence_currency[expense.type]}
                          </TableCell>
                          <TableCell className="border border-slate-200">
                            <div className="flex justify-center w-full">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Harajatni tahrirlash</DialogTitle>
              </DialogHeader>
              {editingExpense && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-type">Turi</Label>
                    <Select
                      value={editingExpense.type}
                      onValueChange={(value) =>
                        setEditingExpense({
                          ...editingExpense,
                          type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Turi" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(monthly_expence_types).map(
                          ([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-name">Nomi</Label>
                    <Input
                      id="edit-name"
                      value={editingExpense.name}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-amount">
                      Miqdori ({formatNumber(editingExpense.amount)})
                    </Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      value={editingExpense.amount}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={editExpense}
                    className="w-full"
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Yangilash"
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Orders Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-slate-800">Buyurtmalar</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={downloading.excel}
                    className="ml-auto"
                    onClick={() => handleDownload("excel")}
                  >
                    {downloading.excel ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Download className="text-green-500" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={downloading.pdf}
                    onClick={() => handleDownload("pdf")}
                  >
                    {downloading.pdf ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <FileText className="text-blue-500" />
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto w-full">
                <Table className="border border-slate-200 w-full whitespace-nowrap text-xs">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="border border-slate-200">
                        Id
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Nomi
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Model
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Narxi
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Chiqarilgan
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Topgan puli
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Harajat
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        1 tasi harajat
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        1 tasi foyda
                      </TableHead>{" "}
                      <TableHead className="border border-slate-200">
                        Foiz
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Chok
                      </TableHead>
                      <TableHead className="border border-slate-200">
                        Foyda
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daily.orders
                      ?.sort((a, b) => a.order.name.localeCompare(b.order.name))
                      .map((order, i) => (
                        <TableRow
                          key={i}
                          className={cn(
                            order.net_profit_uzs > 0
                              ? "bg-green-100 hover:bg-green-200"
                              : "bg-red-100 hover:bg-red-200",
                          )}
                          onClick={() => handleExpenceDialog(order)}
                        >
                          <TableCell className="font-medium border border-slate-200 text-center">
                            {order?.order?.id}
                          </TableCell>
                          <TableCell className="border border-slate-200">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <p>{order?.order?.name}</p>
                                  {order?.order?.season_type == "winter" ? (
                                    <Snowflake
                                      size={20}
                                      className="text-blue-500"
                                    />
                                  ) : (
                                    <Sun
                                      size={20}
                                      className="text-yellow-500"
                                    />
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {order?.responsibleUser
                                      ?.map((user) => user.employee.name)
                                      .join(", ")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="border border-slate-200">
                            <div>
                              <div className="font-medium">
                                {order?.model?.name}
                              </div>
                              {order?.submodels?.length > 0 && (
                                <div className="text-sm text-slate-500">
                                  {order?.submodels
                                    ?.map((submodel) => submodel.name)
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="border border-slate-200">
                            <div className="flex flex-col gap-1">
                              <div className="font-mono">
                                {formatNumber(order?.price_uzs)} so'm
                              </div>
                              <div className="font-mono">
                                {parseFloat(order?.price_usd)?.toLocaleString(
                                  "ru-RU",
                                )}{" "}
                                $
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono border border-slate-200">
                            {formatNumber(order?.total_quantity)} ta
                          </TableCell>
                          <TableCell className="font-mono border border-slate-200">
                            {formatNumber(order?.total_output_cost_uzs)} so'm
                          </TableCell>
                          <TableCell className="border border-slate-200">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="font-mono">
                                    {formatNumber(order?.total_fixed_cost_uzs)}{" "}
                                    so'm
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <div className="w-full flex justify-between gap-2">
                                      <div> AUP: </div>
                                      <div>
                                        {" "}
                                        {formatNumber(
                                          order?.costs_uzs?.allocatedAup,
                                        )}{" "}
                                        so'm
                                      </div>
                                    </div>
                                    <div className="w-full flex justify-between gap-2">
                                      <div> KPI: </div>
                                      <div>
                                        {formatNumber(order?.costs_uzs?.bonus)}{" "}
                                        so'm
                                      </div>
                                    </div>
                                    <div className="w-full flex justify-between gap-2">
                                      <div> O'zgarmas harajat: </div>
                                      <div>
                                        {formatNumber(
                                          order?.costs_uzs
                                            ?.allocatedMonthlyExpenseMonthly,
                                        )}{" "}
                                        so'm
                                      </div>
                                    </div>
                                    <div className="w-full flex justify-between gap-2">
                                      <div> Transport: </div>
                                      <div>
                                        {formatNumber(
                                          order?.costs_uzs?.allocatedTransport,
                                        )}{" "}
                                        so'm
                                      </div>
                                    </div>
                                    <div className="w-full flex justify-between gap-2">
                                      <div> Amortizatsiya: </div>
                                      <div>
                                        {formatNumber(
                                          order?.costs_uzs?.amortizationExpense,
                                        )}{" "}
                                        so'm
                                      </div>
                                    </div>
                                    <div className="w-full flex justify-between gap-2">
                                      <div> Soliq: </div>
                                      <div>
                                        {formatNumber(
                                          order?.costs_uzs
                                            ?.incomePercentageExpense,
                                        )}{" "}
                                        so'm
                                      </div>
                                    </div>
                                    <div className="w-full flex justify-between gap-2">
                                      <div> Tikuv uchun: </div>
                                      <div>
                                        {formatNumber(
                                          order?.costs_uzs?.remainder,
                                        )}{" "}
                                        so'm
                                      </div>
                                    </div>
                                    <div className="w-full flex justify-between gap-2">
                                      <div> Tikuvchilar: </div>
                                      <div>
                                        {formatNumber(
                                          order?.costs_uzs?.tarification,
                                        )}{" "}
                                        so'm
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="font-mono border border-slate-200">
                            {formatNumber(order?.cost_per_unit_uzs)} so'm
                          </TableCell>
                          <TableCell className="font-mono border border-slate-200">
                            {formatNumber(order?.profit_per_unit_uzs)} so'm
                          </TableCell>{" "}
                          <TableCell className="font-mono border border-slate-200">
                            {formatNumber(order?.profitability_percent)} %
                          </TableCell>
                          <TableCell className="font-mono border border-slate-200">
                            {formatNumber(order?.rasxod_percent_of_price)} %
                          </TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                "font-bold font-mono",
                                order.net_profit_uzs > 0
                                  ? "text-green-500"
                                  : "text-red-500",
                              )}
                            >
                              {formatNumber(order.net_profit_uzs)} so'm
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-balance">
                    {expenseOrder?.order?.id} – {expenseOrder?.order?.name}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-base">
                  {expenseOrder?.submodels?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {expenseOrder?.submodels?.map((sub, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-slate-100 text-slate-700"
                        >
                          {sub.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </DialogDescription>
              </div>
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? "PDF yaratilmoqda..." : "PDF yuklab olish"}
              </Button>
            </div>
          </DialogHeader>

          <div ref={pdfContentRef} data-pdf-content className="space-y-8">
            <div className="print:block mb-8 text-center border-b pb-4">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Harajatlar hisoboti
              </h1>
              <p className="text-slate-600">
                {expenseOrder?.order?.id} – {expenseOrder?.order?.name} -{" "}
                {expenseOrder?.submodels?.map((sub) => sub.name).join(", ")}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Yaratilgan sana: {new Date().toLocaleDateString("ru-RU")}
              </p>
            </div>
            {/* Responsible Users */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900">Mas'ul xodim</h4>
              </div>
              <p className="text-slate-700 font-medium">
                {expenseOrder?.responsibleUser
                  ?.map((u) => u.employee.name)
                  .join(", ")}
              </p>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Narxi (UZS)
                  </div>
                </div>
                <div className="font-mono font-bold text-2xl text-slate-900">
                  {formatNumber(expenseOrder?.price_uzs)}{" "}
                  <span className="text-lg text-slate-600">so'm</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Narxi (USD)
                  </div>
                </div>
                <div className="font-mono font-bold text-2xl text-slate-900">
                  {Number.parseFloat(expenseOrder?.price_usd)?.toLocaleString(
                    "ru-RU",
                  )}{" "}
                  <span className="text-lg text-slate-600">$</span>
                </div>
              </div>
            </div>

            {/* Quantity & Costs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Tikilgan
                  </div>
                </div>
                <div className="font-mono font-bold text-xl text-slate-900">
                  {formatNumber(expenseOrder?.total_quantity)}{" "}
                  <span className="text-base text-slate-600">ta</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Topgan puli
                  </div>
                </div>
                <div className="font-mono font-bold text-xl text-slate-900">
                  {formatNumber(expenseOrder?.total_output_cost_uzs)}{" "}
                  <span className="text-base text-slate-600">so'm</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    1 ta siga harajat
                  </div>
                </div>
                <div className="font-mono font-bold text-xl text-slate-900">
                  {formatNumber(expenseOrder?.cost_per_unit_uzs)}{" "}
                  <span className="text-base text-slate-600">so'm</span>
                </div>
              </div>
            </div>

            {/* Profitability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    1 ta donadan foyda
                  </div>
                </div>
                <div className="font-mono font-bold text-xl text-slate-900">
                  {formatNumber(expenseOrder?.profit_per_unit_uzs)}{" "}
                  <span className="text-base text-slate-600">so'm</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Rentabellik
                  </div>
                </div>
                <div className="font-mono font-bold text-xl text-slate-900">
                  {formatNumber(expenseOrder?.profitability_percent)}{" "}
                  <span className="text-base text-slate-600">%</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Chok %
                  </div>
                </div>
                <div className="font-mono font-bold text-xl text-slate-900">
                  {formatNumber(expenseOrder?.rasxod_percent_of_price)}{" "}
                  <span className="text-base text-slate-600">%</span>
                </div>
              </div>
            </div>

            {/* Fixed Costs breakdown */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-slate-600" />
                </div>
                <h4 className="font-semibold text-slate-900 text-lg">
                  Xarajatlar
                </h4>
                <div className="ml-auto font-semibold ">
                  {expenseOrder?.order?.name} -{" "}
                  {expenseOrder?.submodels?.length > 0 &&
                    expenseOrder?.submodels?.map((submodel) => submodel.name)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    label: "AUP",
                    value: expenseOrder?.costs_uzs?.allocatedAup,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.allocatedAup,
                      calculateTotal(expenseOrder),
                    ),
                    icon: Building2,
                    color: "blue",
                  },
                  {
                    label: "KPI",
                    value: expenseOrder?.costs_uzs?.bonus,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.bonus,
                      calculateTotal(expenseOrder),
                    ),
                    icon: UserCheck,
                    color: "green",
                  },
                  {
                    label: "O'zgarmas harajat",
                    value:
                      expenseOrder?.costs_uzs?.allocatedMonthlyExpenseMonthly,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.allocatedMonthlyExpenseMonthly,
                      calculateTotal(expenseOrder),
                    ),
                    icon: Calculator,
                    color: "purple",
                  },
                  {
                    label: "Transport",
                    value: expenseOrder?.costs_uzs?.allocatedTransport,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.allocatedTransport,
                      calculateTotal(expenseOrder),
                    ),
                    icon: Car,
                    color: "orange",
                  },
                  {
                    label: "Amortizatsiya",
                    value: expenseOrder?.costs_uzs?.amortizationExpense,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.amortizationExpense,
                      calculateTotal(expenseOrder),
                    ),
                    icon: Wrench,
                    color: "cyan",
                  },
                  {
                    label: "Soliq",
                    value: expenseOrder?.costs_uzs?.incomePercentageExpense,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.incomePercentageExpense,
                      calculateTotal(expenseOrder),
                    ),
                    icon: Receipt,
                    color: "red",
                  },
                  {
                    label: "Tikuv uchun",
                    value: expenseOrder?.costs_uzs?.remainder,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.remainder,
                      calculateTotal(expenseOrder),
                    ),
                    icon: Scissors,
                    color: "pink",
                  },
                  {
                    label: "Tikuvchilar",
                    value: expenseOrder?.costs_uzs?.tarification,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.tarification,
                      calculateTotal(expenseOrder),
                    ),
                    icon: Users,
                    color: "indigo",
                  },
                ].map(
                  ({ label, value, icon: Icon, percentage = 0, color }, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center",
                            color === "blue" && "bg-blue-100",
                            color === "green" && "bg-green-100",
                            color === "purple" && "bg-purple-100",
                            color === "orange" && "bg-orange-100",
                            color === "cyan" && "bg-cyan-100",
                            color === "red" && "bg-red-100",
                            color === "pink" && "bg-pink-100",
                            color === "indigo" && "bg-indigo-100",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-3 h-3",
                              color === "blue" && "text-blue-600",
                              color === "green" && "text-green-600",
                              color === "purple" && "text-purple-600",
                              color === "orange" && "text-orange-600",
                              color === "cyan" && "text-cyan-600",
                              color === "red" && "text-red-600",
                              color === "pink" && "text-pink-600",
                              color === "indigo" && "text-indigo-600",
                            )}
                          />
                        </div>
                        <span className="font-medium text-slate-700">
                          {label}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatNumber(value)} so'm / {formatNumber(percentage)}{" "}
                        %
                      </span>
                    </div>
                  ),
                )}
              </div>

              {/* Total */}
              <div className="mt-6 p-4 bg-white rounded-xl border-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Calculator className="w-3 h-3 text-slate-600" />
                    </div>
                    <span className="font-bold text-slate-900">
                      Jami harajat:
                    </span>
                  </div>
                  <span className="font-mono font-bold text-lg text-slate-900">
                    {formatNumber(
                      (expenseOrder?.costs_uzs?.allocatedAup || 0) +
                        (expenseOrder?.costs_uzs?.bonus || 0) +
                        (expenseOrder?.costs_uzs
                          ?.allocatedMonthlyExpenseMonthly || 0) +
                        (expenseOrder?.costs_uzs?.allocatedTransport || 0) +
                        (expenseOrder?.costs_uzs?.amortizationExpense || 0) +
                        (expenseOrder?.costs_uzs?.incomePercentageExpense ||
                          0) +
                        (expenseOrder?.costs_uzs?.remainder || 0) +
                        (expenseOrder?.costs_uzs?.tarification || 0),
                    )}{" "}
                    <span className="text-base text-slate-500">so'm</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="text-center">
              <div
                className={cn(
                  "inline-flex items-center gap-3 px-8 py-6 rounded-2xl font-bold text-2xl sm:text-3xl font-mono border-2",
                  expenseOrder?.net_profit_uzs > 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    expenseOrder?.net_profit_uzs > 0
                      ? "bg-green-100"
                      : "bg-red-100",
                  )}
                >
                  <TrendingUp
                    className={cn(
                      "w-5 h-5",
                      expenseOrder?.net_profit_uzs > 0
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  />
                </div>
                <span className="text-balance">
                  {expenseOrder?.net_profit_uzs > 0 ? "Sof foyda" : "Zarar"}:{" "}
                  <span className="font-mono">
                    {formatNumber(expenseOrder?.net_profit_uzs || 0)} so'm
                  </span>
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Daily;
