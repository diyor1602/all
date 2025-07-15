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

const formatNumber = (number) => {
  return Number.parseFloat(number || 0).toLocaleString("ru-RU");
};

const Monthly = () => {
  const [monthly, setMonthly] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0].split("-")[0] +
      "-" +
      new Date().toISOString().split("T")[0].split("-")[1]
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

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    currentDate.setMonth(currentDate.getMonth() + direction);
    setSelectedDate(
      currentDate.toISOString().split("T")[0].split("-")[0] +
        "-" +
        currentDate.toISOString().split("T")[0].split("-")[1]
    );
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const response = await api.get("/casher/monthlyReport", {
        params: { date: selectedDate, dollar_rate: dollarRate },
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

  const fetchMonthlyExpenses = async () => {
    try {
      const response = await api.get("/casher/monthlyExpense", {
        params: { month: selectedDate },
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

          await api.post("/casher/monthlyExpense", {
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
      fetchMonthly();
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
    fetchMonthly();
    fetchMonthlyExpenses();
  }, [selectedDate]);

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
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate(-1)}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            type="month"
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
          "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100",
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
                            {formatNumber(expense.amount)}{" "}
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
