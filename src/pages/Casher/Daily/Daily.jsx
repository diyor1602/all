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
} from "lucide-react";
import { cn } from "@/lib/utils";
import monthly_expence_types from "@/lib/monthlyExpenceTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatNumber = (number) => {
  return Number.parseFloat(number || 0).toLocaleString("ru-RU");
};

const Daily = () => {
  const [daily, setDaily] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState({});
  const [showExpenses, setShowExpenses] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({ type: "", amount: "" });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dollarRate, setDollarRate] = useState(
    localStorage.getItem("dollarRate") || 12700
  );
  const [dollarDialogOpen, setDollarDialogOpen] = useState(false);
  const [newDollarRate, setNewDollarRate] = useState(dollarRate);

  const updateDollarRate = async () => {
    localStorage.setItem("dollarRate", newDollarRate);
    setDollarRate(newDollarRate);
    setDollarDialogOpen(false);
    fetchDaily();
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const response = await api.get("/casher/dailyReport", {
        params: { date: selectedDate, dollar_rate: dollarRate },
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
      const response = await api.get("/casher/monthlyExpense", {
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
      await api.post("/casher/monthlyExpense", {
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
      await api.patch(`/casher/monthlyExpense/${editingExpense.id}`, {
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
  }, [selectedDate]);

  const metrics = [
    {
      title: "Daromad",
      value: `${formatNumber(daily.total_earned_uzs)} so'm`,
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-300",
    },
    {
      title: "Foyda",
      value: `${formatNumber(daily.net_profit_uzs)} so'm`,
      icon: Calculator,
      color: "text-emerald-600",
      bg: "bg-emerald-300",
    },
  ];

  const additionalMetrics = [
    {
      label: "Jami harajatlar",
      value: daily.total_fixed_cost_uzs,
      bg: "bg-red-300",
    },
    {
      label: "Kunlik o'zgarmas harajatlar",
      value: daily.daily_expenses,
      bg: "bg-green-300",
    },
    {
      label: "AUP",
      value: daily.aup,
      bg: "bg-emerald-300",
    },
    {
      label: "KPI",
      value: daily.kpi,
      bg: "bg-yellow-300",
    },
    {
      label: "Tikuvchilar",
      value: daily.tarification,
      bg: "bg-pink-300",
    },
    {
      label: "Transport uchun",
      value: daily.transport_attendance,
      bg: "bg-gray-300",
    },
    {
      label: "Tikuv uchun",
      value: daily.orders?.reduce(
        (acc, order) => acc + order.rasxod_limit_uzs,
        0
      ),
      bg: "bg-purple-300",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between md:p-6 gap-4 flex-wrap">
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
            onChange={(e) => setSelectedDate(e.target.value)}
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
          "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 md:p-6",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}

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
                      {formatNumber(metric.value)} so'm
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

          {/* Monthly Expenses */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-800">
                  Oylik harajatlar
                </CardTitle>
                <div className="flex items-center gap-2">
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
                                )
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
                            {formatNumber(expense.amount)}{" "}
                            {["amortization"]?.includes(expense.type)
                              ? "$"
                              : "so'm"}
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
                          )
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
              <CardTitle className="text-slate-800">Buyurtmalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto w-full">
                <Table className="border border-slate-200 w-full whitespace-nowrap">
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
                        Chiqarilgan soni
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
                        Daromad
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daily.orders?.map((order, i) => (
                      <TableRow key={i}>
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
                          <div className="space-y-1 flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {formatNumber(order?.price_uzs)} so'm
                            </Badge>
                            <Badge variant="secondary" className="font-mono">
                              {formatNumber(order?.price_usd)} $
                            </Badge>
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
                                <Badge variant="outline" className="font-mono">
                                  {formatNumber(order?.total_fixed_cost_uzs)}{" "}
                                  so'm
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div>
                                    AUP:{" "}
                                    {formatNumber(
                                      order?.costs_uzs?.attendance_salary
                                    )}{" "}
                                    so'm
                                  </div>
                                  <div>
                                    KPI:{" "}
                                    {formatNumber(order?.costs_uzs?.bonuses)}{" "}
                                    so'm
                                  </div>
                                  <div>
                                    Tikuvchilar:{" "}
                                    {formatNumber(
                                      order?.costs_uzs
                                        ?.employee_tarification_logs
                                    )}{" "}
                                    so'm
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
                        <TableCell>
                          <Badge
                            variant={
                              order.net_profit_uzs > 0
                                ? "default"
                                : "destructive"
                            }
                            className="font-mono"
                          >
                            {formatNumber(order.net_profit_uzs)} so'm
                          </Badge>
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

export default Daily;
