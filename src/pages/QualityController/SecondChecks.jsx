import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    const normalized = String(dateTimeString).replace(" ", "T");
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => changeMonth(-1)}
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4" />
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
          className="w-fit bg-white"
          disabled={loading}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => changeMonth(1)}
          disabled={loading}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2-chi tekshiruv</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs text-muted-foreground">Jami summa</div>
              <div className="text-lg font-semibold">
                {formatNumber(data?.total, 0)} so'm
              </div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs text-muted-foreground">Soni</div>
              <div className="text-lg font-semibold">{data?.count || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">To'lovlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : (data?.data || []).length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              Bu oy uchun ma'lumot topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.data || []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {formatDate(row.date)}
                      </TableCell>
                      <TableCell>+{formatNumber(row.amount, 0)} so'm</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecondChecks;
