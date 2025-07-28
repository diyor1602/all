"use client";

import { useState, useEffect } from "react";
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
import { TrendingUp, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const formatNumber = (number) => {
  return Number.parseFloat(number || 0).toLocaleString("ru-RU");
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

  const updateDollarRate = async () => {
    localStorage.setItem("dollarRate", newDollarRate);
    setDollarRate(newDollarRate);
    setDollarDialogOpen(false);
    fetchMonthly();
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const response = await api.get("/casher/monthlyReport", {
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
      title: "Foyda",
      value: `${formatNumber(monthly.net_profit_uzs)} so'm`,
      icon: Calculator,
      color: "text-emerald-600",
      bg: "bg-emerald-300",
    },
  ];

  const additionalMetrics = [
    {
      label: "Jami harajatlar",
      value: monthly.total_fixed_cost_uzs,
      bg: "bg-red-300",
    },
    {
      label: "Oylik o'zgarmas harajatlar",
      value: monthly.monthly_expenses,
      bg: "bg-green-300",
    },
    {
      label: "AUP",
      value: monthly.aup,
      bg: "bg-emerald-300",
    },
    {
      label: "KPI",
      value: monthly.kpi,
      bg: "bg-yellow-300",
    },
    {
      label: "Tikuvchilar",
      value: monthly.tarification,
      bg: "bg-pink-300",
    },
    {
      label: "Transport uchun",
      value: monthly.transport_attendance,
      bg: "bg-gray-300",
    },
    {
      label: "Tikuv uchun",
      value: monthly.orders?.reduce(
        (acc, order) => acc + order.rasxod_limit_uzs,
        0
      ),
      bg: "bg-purple-300",
    },
    {
      label: "1 kishi uchun harajat",
      value: monthly.per_employee_cost_uzs,
      bg: "bg-orange-300",
    },
    {
      label: "Jami aktiv ishchilar",
      value: monthly.average_employee_count,
      bg: "bg-lime-300",
      prefix: "ta",
    },
  ];

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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {metric.value}
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
                      "flex justify-between items-center p-3 bg-50 rounded-lg",
                      metric.bg
                    )}
                  >
                    <span className="text-sm font-medium text-slate-600">
                      {metric.label}:
                    </span>
                    <Badge variant="ghost" className="font-mono border-none">
                      {formatNumber(metric.value)} {metric.prefix || "so'm"}
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
                              {formatNumber(order?.price_usd)} $
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
    </div>
  );
};

export default Monthly;
