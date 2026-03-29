import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Wallet,
  ListChecks,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SecondChecks = () => {
  const { toast } = useToast();

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [monthValue, setMonthValue] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const changeMonth = (delta) => {
    setSelectedMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      next.setDate(1);
      return next;
    });
  };

  useEffect(() => {
    setMonthValue(
      `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`,
    );
  }, [selectedMonth]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/qualityController/mySecondChecks", {
        params: {
          month: monthValue,
        },
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        toast({
          title: "Xatolik",
          description: err?.response?.data?.message || "Ma'lumotlar yuklanmadi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [monthValue, toast]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50" />

          <div className="relative flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Oylik hisobot
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  2-chi tekshiruv
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  To‘lovlar va umumiy natijalarni qulay ko‘rinishda kuzating
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => changeMonth(-1)}
                  disabled={loading}
                  className="h-10 w-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Input
                  type="month"
                  value={monthValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMonthValue(value);
                    if (!value) return;
                    const [y, m] = value.split("-").map((v) => parseInt(v, 10));
                    if (!y || !m) return;
                    setSelectedMonth(new Date(y, m - 1, 1));
                  }}
                  className="h-10 w-fit rounded-xl border-slate-200 bg-slate-50 text-slate-700 shadow-none"
                  disabled={loading}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => changeMonth(1)}
                  disabled={loading}
                  className="h-10 w-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="rounded-3xl border-slate-200/70 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Jami summa</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {formatNumber(data?.total, 0)} so'm
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200/70 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">To'lovlar soni</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {data?.count || 0}
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <ListChecks className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">
              To'lovlar ro'yxati
            </CardTitle>
            <CardDescription className="text-slate-500">
              Oy davomida amalga oshirilgan barcha 2-chi tekshiruv to‘lovlari
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Yuklanmoqda...
              </div>
            ) : (data?.data || []).length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Bu oy uchun ma'lumot topilmadi
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="h-12 text-slate-600">
                          Sana
                        </TableHead>
                        <TableHead className="h-12 text-slate-600">
                          Summa
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {(data?.data || []).map((row, index) => (
                        <TableRow
                          key={row.id}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <TableCell className="font-medium text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                                {index + 1}
                              </div>
                              <span>{formatDate(row.date)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                              +{formatNumber(row.amount, 0)} so'm
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecondChecks;
