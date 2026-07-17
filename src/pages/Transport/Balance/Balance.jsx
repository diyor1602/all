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
  Wallet,
  DollarSign,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Balance = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState(null);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCashbox = async () => {
      try {
        setLoading(true);
        const response = await api.get("transport/cashbox/balance");
        setData(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Kassa ma'lumotlarini olishda xatolik yuz berdi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCashbox();
  }, []);

  const fetchTransactions = async (page = 1) => {
    try {
      setTransactionsLoading(true);
      const response = await api.get(
        `/transport/cashbox/transactions?page=${page}`,
      );
      setTransactions(response.data);
      setCurrentPage(response.data.current_page);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tranzaksiyalarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const handlePageChange = (page) => {
    if (page < 1 || page > transactions?.last_page) return;
    fetchTransactions(page);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kassa</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.cashbox || "Yuklanmoqda…"}
          </p>
        </div>
      </div>

      {/* Cashbox info card */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                {loading ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  data?.cashbox || "Kassa"
                )}
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-0.5">
                {loading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : (
                  `Turi: ${data?.type || "—"}`
                )}
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
          ) : data?.balances && data.balances.length > 0 ? (
            <div className="grid gap-3">
              {data.balances.map((balance, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{balance.currency}</p>
                      <p className="text-xs text-muted-foreground">Balans</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatNumber(balance.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">Ma'lumot topilmadi</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Kassa balans ma'lumotlari mavjud emas
              </p>
            </div>
          )}
        </CardContent>
      </div>

      {/* Transactions table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold">Tranzaksiyalar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {transactions?.total
              ? `Jami ${transactions.total} ta tranzaksiya`
              : "Yuklanmoqda…"}
          </p>
        </div>
        {transactionsLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : transactions?.data && transactions.data.length > 0 ? (
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
                    Turi
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Maqsad
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Izoh
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Valyuta
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Summa
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.data.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {transaction.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{transaction.date}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.type === "income" ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                          Kirim
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                          Chiqim
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {transaction.purpose || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {transaction.comment || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {transaction.currency?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatNumber(parseFloat(transaction.amount))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Ma'lumot topilmadi</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Hali hech qanday tranzaksiya yo'q
            </p>
          </div>
        )}

        {/* Pagination */}
        {transactions && transactions.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Sahifa {currentPage} / {transactions.last_page} (Jami{" "}
              {transactions.total} ta)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || transactionsLoading}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                Oldingi
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage === transactions.last_page || transactionsLoading
                }
                className="h-8"
              >
                Keyingi
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {(loading || transactionsLoading) && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default Balance;
