import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Debts = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settling, Settling] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [settleAmount, setSettleAmount] = useState("");

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/v1/supplier/cashbox/debts");
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openSettleDialog = (debt) => {
    setSelectedDebt(debt);
    setSettleAmount(debt.amount);
    setDialogOpen(true);
  };

  const settleDebt = async () => {
    if (!selectedDebt || !settleAmount) return;

    Settling(selectedDebt.id);
    try {
      await api.post(`/v1/supplier/cashbox/debts/${selectedDebt.id}/settle`, {
        amount: settleAmount,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Qarz muvaffaqiyatli to'landi",
      });
      setDialogOpen(false);
      getData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Qarzni to'lashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      Settling(null);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateTotalsByCurrency = () => {
    if (!data?.items) return [];

    const totals = {};
    data.items.forEach((debt) => {
      const currencyName = debt.currency?.name || "Noma'lum";
      if (!totals[currencyName]) {
        totals[currencyName] = 0;
      }
      totals[currencyName] += parseFloat(debt.amount);
    });

    return Object.entries(totals).map(([currency, amount]) => ({
      currency,
      amount,
    }));
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Qarzlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.items?.length
              ? `Jami ${data.items.length} ta qarz`
              : "Yuklanmoqda…"}
          </p>
        </div>
        <Link to="/supplier/cashbox">
          <Button variant="outline" className="gap-2">
            Kassaga qaytish
          </Button>
        </Link>
      </div>

      {/* Total debt card */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Jami qarz</CardTitle>
              <div className="text-xs text-muted-foreground mt-0.5">
                Barcha ochiq qarzlar
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : calculateTotalsByCurrency().length > 0 ? (
            <div className="grid gap-3">
              {calculateTotalsByCurrency().map((total, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{total.currency}</p>
                      <p className="text-xs text-muted-foreground">
                        Qarz miqdori
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-red-600">
                      {formatNumber(total.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">Ma'lumot topilmadi</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Qarz ma'lumotlari mavjud emas
              </p>
            </div>
          )}
        </CardContent>
      </div>

      {/* Debts table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold">Qarzlar ro'yxati</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.items?.length
              ? `Jami ${data.items.length} ta qarz`
              : "Yuklanmoqda…"}
          </p>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="text-sm whitespace-nowrap">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-14 text-xs font-semibold text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Sana
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Summa
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Valyuta
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Holat
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Izoh
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Amallar
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((debt) => (
                  <TableRow
                    key={debt.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {debt.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">
                          {formatDate(debt.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">
                        {formatNumber(parseFloat(debt.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {debt.currency?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          debt.status === "debt_open"
                            ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50"
                            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                        }
                      >
                        {debt.status === "debt_open" ? "Ochiq" : "Yopiq"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {debt.comment || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {debt.status === "debt_open" && (
                        <Button
                          size="sm"
                          onClick={() => openSettleDialog(debt)}
                          className="h-8 gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          To'lash
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Ma'lumot topilmadi</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Hali hech qanday qarz yo'q
            </p>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Settle debt dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qarzni to'lash</DialogTitle>
            <DialogDescription>
              Qarz ma'lumotlarini ko'ring va to'lash summasini kiriting
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Qarz ID
                  </Label>
                  <p className="font-medium">{selectedDebt.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sana</Label>
                  <p className="font-medium">
                    {formatDate(selectedDebt.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Qarz summasi
                  </Label>
                  <p className="font-semibold text-red-600">
                    {formatNumber(parseFloat(selectedDebt.amount))}{" "}
                    {selectedDebt.currency?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Izoh</Label>
                  <p className="font-medium">{selectedDebt.comment || "—"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">To'lash summasi</Label>
                <Input
                  id="amount"
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="Summani kiriting"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Maksimal: {formatNumber(parseFloat(selectedDebt.amount))}{" "}
                  {selectedDebt.currency?.name}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={settling}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={settleDebt}
              disabled={
                settling || !settleAmount || parseFloat(settleAmount) <= 0
              }
            >
              {settling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yuborilmoqda...
                </>
              ) : (
                "To'lash"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;
