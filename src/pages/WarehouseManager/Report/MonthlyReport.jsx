import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Package, Hash } from "lucide-react";

const MonthlyReport = () => {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("selectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`v1/warehouseManager/monthlyReport?month=${selectedMonth}`)
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        toast({
          title: "Xatolik",
          description: "Ma'lumotlarni olib bo'lmadi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedMonth]);

  const rows = data?.data ?? [];

  const totalQuantity = rows.reduce((sum, r) => sum + r.total_quantity, 0);
  const totalOrders = rows.length;

  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.date]) acc[row.date] = [];
    acc[row.date].push(row);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatMonth = (monthStr) => {
    const [y, m] = monthStr.split("-");
    return new Date(y, m - 1).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oylik hisobot</h1>
          <p className="text-muted-foreground text-sm">
            {formatMonth(selectedMonth)} uchun buyurtmalar ro'yxati
          </p>
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            localStorage.setItem("selectedMonth", e.target.value);
          }}
          className="w-44 bg-white"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 grid-cols-2">
        <SummaryCard
          icon={<Hash className="h-4 w-4 text-blue-500" />}
          label="Jami buyurtmalar"
          value={loading ? null : totalOrders}
          suffix="ta"
        />
        <SummaryCard
          icon={<Package className="h-4 w-4 text-green-500" />}
          label="Jami miqdor"
          value={loading ? null : totalQuantity.toLocaleString()}
          suffix="dona"
        />
      </div>

      {/* Data */}
      {loading ? (
        <LoadingSkeleton />
      ) : sortedDates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayRows = grouped[date];
            const dayTotal = dayRows.reduce((s, r) => s + r.total_quantity, 0);
            return (
              <Card key={date}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {formatDate(date)}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">
                        {dayRows.length} buyurtma
                      </Badge>
                      <Badge variant="outline">
                        {dayTotal.toLocaleString()} dona
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Buyurtma nomi</TableHead>
                        <TableHead className="w-28 text-right">
                          Miqdor
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayRows.map((row, i) => (
                        <TableRow key={row.order_id}>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {i + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.order.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {row.total_quantity.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/40 font-semibold">
                        <TableCell />
                        <TableCell className="text-muted-foreground text-sm">
                          Jami
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {dayTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ icon, label, value, suffix }) => (
  <Card>
    <CardContent className="flex items-center gap-3 pt-5">
      <div className="rounded-md bg-muted p-2">{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {value === null ? (
          <Skeleton className="mt-1 h-5 w-16" />
        ) : (
          <p className="text-xl font-bold tabular-nums leading-tight">
            {value}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {suffix}
            </span>
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2].map((n) => (
      <Card key={n}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyState = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="font-medium text-muted-foreground">
        Bu oy uchun ma'lumot topilmadi
      </p>
      <p className="mt-1 text-sm text-muted-foreground/60">
        Boshqa oyni tanlang
      </p>
    </CardContent>
  </Card>
);

export default MonthlyReport;
