"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Calculator,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formatNumber = (number, maximumFractionDigits = 0) => {
  return Number.parseFloat(number || 0).toLocaleString("ru-RU", {
    maximumFractionDigits,
  });
};

const Monthly = () => {
  const [monthly, setMonthly] = useState({});
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0].split("-")[0] +
      "-" +
      new Date().toISOString().split("T")[0].split("-")[1] +
      "-01"
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dollarRate, setDollarRate] = useState(
    localStorage.getItem("dollarRate") || 12700
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
    fetchMonthly();
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ceo/monthlyReport", {
        params: {
          start_date: startDate,
          end_date: endDate,
          dollar_rate: dollarRate,
        },
      });
      setMonthly(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Oylik ma'lumotlarni olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthly();
  }, [startDate, endDate]);

  const metrics = [
    {
      title: "Daromad",
      value: `${formatNumber(monthly.total_earned_uzs)} so'm`,
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-300",
    },
    {
      title: "Harajat",
      value:
        monthly.orders?.length === 0
          ? `-${formatNumber(
              Number.parseFloat(monthly.aup) +
                Number.parseFloat(monthly.kpi) +
                Number.parseFloat(monthly.daily_expenses) +
                Number.parseFloat(monthly.tarification) +
                Number.parseFloat(monthly.transport_attendance)
            )} so'm`
          : `${formatNumber(monthly.total_fixed_cost_uzs)} so'm`,
      percentage:
        monthly.orders?.length === 0
          ? 0
          : Number.parseFloat(
              (monthly.total_fixed_cost_uzs / monthly.total_earned_uzs) * 100
            )?.toLocaleString("ru-RU", {
              maximumFractionDigits: 0,
            }),
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-300",
    },
    {
      title: "Foyda",
      value: `${formatNumber(monthly.net_profit_uzs)} so'm`,
      percentage:
        monthly.orders?.length === 0
          ? 0
          : Number.parseFloat(
              (monthly.net_profit_uzs / monthly.total_earned_uzs) * 100
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
      value: `${formatNumber(monthly.total_output_quantity)} ta`,
      icon: ScrollText,
      color: "text-amber-600",
      bg: "bg-amber-300",
    },
    {
      title: "Bir donasi narxi",
      value: `${formatNumber(
        monthly.cost_per_unit_overall_uzs
      )} so'm / ${Number.parseFloat(
        monthly.cost_per_unit_overall_uzs / dollarRate
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
      value: monthly.total_fixed_cost_uzs,
      bg: "bg-red-300",
      dollar: true,
    },
    {
      label: "Oylik o'zgarmas harajatlar",
      value: monthly.monthly_expenses,
      bg: "bg-green-300",
      dollar: true,
    },
    {
      label: "AUP",
      value: monthly.aup,
      bg: "bg-emerald-300",
      dollar: true,
    },
    {
      label: "Bitta AUP ga",
      value: monthly.aup / monthly.total_output_quantity,
      bg: "bg-orange-300",
      dollar: true,
    },
    {
      label: "KPI",
      value: monthly.kpi,
      bg: "bg-yellow-300",
      dollar: true,
    },
    {
      label: "Tikuvchilar",
      value: monthly.tarification,
      bg: "bg-pink-300",
      dollar: true,
    },
    {
      label: "Transport uchun",
      value: monthly.transport_attendance,
      bg: "bg-gray-300",
      dollar: true,
    },
    {
      label: "Tikuv uchun",
      value: monthly.orders?.reduce(
        (acc, order) => acc + order.rasxod_limit_uzs,
        0
      ),
      bg: "bg-purple-300",
      dollar: true,
    },
    {
      label: "1 kishi uchun harajat",
      value: monthly.per_employee_cost_uzs?.total,
      bg: "bg-orange-300",
      dollar: true,
      dialogData: monthly.per_employee_cost_uzs,
    },
    {
      label: "O'rtacha aktiv ishchilar",
      value: monthly.average_employee_count,
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
            canvas.height * ratio
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
          imgHeight * ratio
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
        <h1 className="text-3xl font-bold text-slate-800">Oylik hisobot</h1>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-fit bg-white border-slate-200"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-fit bg-white border-slate-200"
          />
        </div>
      </div>
      <div
        className={cn(
          "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className={cn(
                  "border-0 shadow-md hover:shadow-lg transition-shadow",
                  metric.bg
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
                  metric.bg
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
                  className="flex justify-between items-center p-3 bg-50 rounded-lg cursor-pointer bg-sky-300"
                  onClick={() => setDollarDialogOpen(true)}
                >
                  <span className="text-sm font-medium text-slate-600">
                    Dollar kursi:
                  </span>
                  <Badge variant="ghost" className="font-mono border-none">
                    {formatNumber(dollarRate)} so'm
                  </Badge>
                </div>
                {additionalMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex justify-between items-center p-3 bg-50 rounded-lg flex-wrap",
                      metric.bg,
                      metric.dialogData && "cursor-pointer"
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
                      (a, b) => b[1].percent - a[1].percent
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

          {/* Orders Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-800">Buyurtmalar</CardTitle>
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
                        Daromad
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthly.orders?.map((order, i) => (
                      <TableRow
                        key={i}
                        className={cn(
                          order.net_profit_uzs > 0
                            ? "bg-green-100 hover:bg-green-200"
                            : "bg-red-100 hover:bg-red-200"
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
                              {Number.parseFloat(
                                order?.price_usd
                              )?.toLocaleString("ru-RU")}{" "}
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
                                        order?.costs_uzs?.allocatedAup
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
                                          ?.allocatedMonthlyExpenseMonthly
                                      )}{" "}
                                      so'm
                                    </div>
                                  </div>
                                  <div className="w-full flex justify-between gap-2">
                                    <div> Transport: </div>
                                    <div>
                                      {formatNumber(
                                        order?.costs_uzs?.allocatedTransport
                                      )}{" "}
                                      so'm
                                    </div>
                                  </div>
                                  <div className="w-full flex justify-between gap-2">
                                    <div> Amortizatsiya: </div>
                                    <div>
                                      {formatNumber(
                                        order?.costs_uzs?.amortizationExpense
                                      )}{" "}
                                      so'm
                                    </div>
                                  </div>
                                  <div className="w-full flex justify-between gap-2">
                                    <div> Soliq: </div>
                                    <div>
                                      {formatNumber(
                                        order?.costs_uzs
                                          ?.incomePercentageExpense
                                      )}{" "}
                                      so'm
                                    </div>
                                  </div>
                                  <div className="w-full flex justify-between gap-2">
                                    <div> Tikuv uchun: </div>
                                    <div>
                                      {formatNumber(
                                        order?.costs_uzs?.remainder
                                      )}{" "}
                                      so'm
                                    </div>
                                  </div>
                                  <div className="w-full flex justify-between gap-2">
                                    <div> Tikuvchilar: </div>
                                    <div>
                                      {formatNumber(
                                        order?.costs_uzs?.tarification
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
                                : "text-red-500"
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

          <div
            ref={pdfContentRef}
            data-pdf-content
            className="space-y-8 bg-white px-6"
          >
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
                    "ru-RU"
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
                      calculateTotal(expenseOrder)
                    ),
                    icon: Building2,
                    color: "blue",
                  },
                  {
                    label: "KPI",
                    value: expenseOrder?.costs_uzs?.bonus,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.bonus,
                      calculateTotal(expenseOrder)
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
                      calculateTotal(expenseOrder)
                    ),
                    icon: Calculator,
                    color: "purple",
                  },
                  {
                    label: "Transport",
                    value: expenseOrder?.costs_uzs?.allocatedTransport,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.allocatedTransport,
                      calculateTotal(expenseOrder)
                    ),
                    icon: Car,
                    color: "orange",
                  },
                  {
                    label: "Amortizatsiya",
                    value: expenseOrder?.costs_uzs?.amortizationExpense,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.amortizationExpense,
                      calculateTotal(expenseOrder)
                    ),
                    icon: Wrench,
                    color: "cyan",
                  },
                  {
                    label: "Soliq",
                    value: expenseOrder?.costs_uzs?.incomePercentageExpense,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.incomePercentageExpense,
                      calculateTotal(expenseOrder)
                    ),
                    icon: Receipt,
                    color: "red",
                  },
                  {
                    label: "Tikuv uchun",
                    value: expenseOrder?.costs_uzs?.remainder,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.remainder,
                      calculateTotal(expenseOrder)
                    ),
                    icon: Scissors,
                    color: "pink",
                  },
                  {
                    label: "Tikuvchilar",
                    value: expenseOrder?.costs_uzs?.tarification,
                    percentage: calculatePercentage(
                      expenseOrder?.costs_uzs?.tarification,
                      calculateTotal(expenseOrder)
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
                            color === "indigo" && "bg-indigo-100"
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
                              color === "indigo" && "text-indigo-600"
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
                  )
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
                        (expenseOrder?.costs_uzs?.tarification || 0)
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
                    : "bg-red-50 text-red-700 border-red-200"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    expenseOrder?.net_profit_uzs > 0
                      ? "bg-green-100"
                      : "bg-red-100"
                  )}
                >
                  <TrendingUp
                    className={cn(
                      "w-5 h-5",
                      expenseOrder?.net_profit_uzs > 0
                        ? "text-green-600"
                        : "text-red-600"
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

export default Monthly;
