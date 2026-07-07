import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Download,
  Loader2,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Add from "./Add";

function formatDateToYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Income = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const [filters, setFilters] = useState({
    start_date: formatDateToYYYYMMDD(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    end_date: formatDateToYYYYMMDD(new Date()),
    search: "",
    currency_id: "",
  });
  const [currencies, setCurrencies] = useState([]);

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ceo/transactions", {
        params: {
          type: "income",
          ...debouncedFilters,
        },
      });
      setData(response.data.transactions);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Kirimlarni olishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [debouncedFilters]);

  // Callback function to handle successful income addition
  const handleIncomeAdded = async () => {
    // Refresh the income data
    await fetchIncomes();
    // Optionally close the add form
    // setShowAdd(false);
  };

  const getTotalsByCurrency = () => {
    const totals = {};

    data.forEach((item) => {
      const currency = item.currency?.name || "Noma'lum";
      let rawAmount = item.amount;

      if (typeof rawAmount === "string") {
        // Remove spaces and commas (e.g., "1 200 000.00" → "1200000.00")
        rawAmount = rawAmount.replace(/\s/g, "").replace(/,/g, "");
      }

      const numericAmount = parseFloat(rawAmount);
      if (!totals[currency]) {
        totals[currency] = 0;
      }

      totals[currency] += isNaN(numericAmount) ? 0 : numericAmount;
    });

    return totals;
  };

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await api.get("/ceo/currencies");
        setCurrencies(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description: "Valyuta turlarini olishda xatolik yuz berdi!",
        });
      }
    };
    fetchCurrencies();
  }, []);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/ceo/exportTransactions/excel`, {
        params: {
          type: "income",
          ...debouncedFilters,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Kirimlar_${debouncedFilters.start_date}_${debouncedFilters.end_date}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Kirimlarni yuklab olishda xatolik yuz berdi!",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Kirimlar ({data.length})
        </h1>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <PlusCircle />
          Qo'shish
        </Button>
      </div>

      {showAdd && (
        <div className="mb-4">
          <Add onSuccess={handleIncomeAdded} />
        </div>
      )}

      <div className="flex items-center flex-wrap gap-4 mb-8">
        <Input
          type="date"
          value={filters.start_date}
          onChange={(e) =>
            setFilters({ ...filters, start_date: e.target.value })
          }
          className="w-fit"
        />
        <Input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          className="w-fit"
        />
        <Select
          value={filters.currency_id}
          onValueChange={(value) =>
            setFilters({ ...filters, currency_id: value })
          }
        >
          <SelectTrigger className="max-w-[180px]">
            <SelectValue placeholder="Valyuta" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1">
          <Input
            placeholder="Qidiruv"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="animate-spin text-primary" />
          ) : (
            <Download className="text-primary" />
          )}
        </Button>
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-350px)]">
        <table className="min-w-full text-sm text-lef border">
          <thead className="bg-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 border">№</th>
              <th className="px-4 py-3 border">Sana</th>
              <th className="px-4 py-3 border">Miqdori</th>
              <th className="px-4 py-3 border">Manba</th>
              <th className="px-4 py-3 border">Sabab</th>
              <th className="px-4 py-3 border">Kirim qiluvchi</th>
              <th className="px-4 py-3 border">Foydalanilgan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <Loader2 className="mx-auto animate-spin h-6 w-6 text-gray-500" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6">
                  Hech qanday ma'lumot topilmadi.
                </td>
              </tr>
            ) : (
              data
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((item, index) => (
                  <>
                    <tr
                      key={index}
                      className={cn(
                        "hover:bg-gray-50",
                        index % 2 === 0 && "bg-gray-50",
                      )}
                    >
                      <td className="px-4 py-2 border text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {item?.date?.split("-").reverse().join(".")}
                      </td>
                      <td className="px-4 py-2 border">
                        {parseFloat(item?.amount).toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {item?.currency?.name}
                      </td>
                      <td
                        className="px-4 py-2 border"
                        onClick={() => {
                          navigator.clipboard.writeText(item?.source);
                          toast({
                            variant: "default",
                            title: "Manba nusxalandi!",
                            duration: 1000,
                          });
                        }}
                      >
                        {item?.source || "-"}
                      </td>
                      <td
                        className="px-4 py-2 border"
                        onClick={() => {
                          navigator.clipboard.writeText(item?.purpose);
                          toast({
                            variant: "default",
                            title: "Sabab nusxalandi!",
                            duration: 1000,
                          });
                        }}
                      >
                        {item?.purpose || "-"}
                      </td>
                      <td className="px-4 py-2 border">
                        {item?.via?.name || "-"}
                      </td>
                      <td className="px-4 py-2 border">
                        {item?.used_by && item.used_by.length > 0 ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (item.used_by.reduce(
                                        (sum, u) => sum + parseFloat(u.amount),
                                        0,
                                      ) /
                                        parseFloat(item.amount)) *
                                        100,
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs">
                                {Math.round(
                                  (item.used_by.reduce(
                                    (sum, u) => sum + parseFloat(u.amount),
                                    0,
                                  ) /
                                    parseFloat(item.amount)) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {item.used_by
                                .reduce(
                                  (sum, u) => sum + parseFloat(u.amount),
                                  0,
                                )
                                .toLocaleString("ru-RU", {
                                  maximumFractionDigits: 2,
                                })}{" "}
                              {item.currency?.name}
                            </div>
                            <div className="text-xs text-green-600">
                              Qoldiq:{" "}
                              {(
                                parseFloat(item.amount) -
                                item.used_by.reduce(
                                  (sum, u) => sum + parseFloat(u.amount),
                                  0,
                                )
                              ).toLocaleString("ru-RU", {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.currency?.name}
                            </div>
                            <button
                              onClick={() =>
                                setExpandedRows((prev) => ({
                                  ...prev,
                                  [item.id]: !prev[item.id],
                                }))
                              }
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {expandedRows[item.id] ? (
                                <>
                                  <ChevronUp size={14} />
                                  Yashirish
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} />
                                  Batafsil ({item.used_by.length})
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                    {expandedRows[item.id] &&
                      item.used_by &&
                      item.used_by.length > 0 && (
                        <tr key={`${index}-details`} className="bg-blue-50">
                          <td colSpan={8} className="px-4 py-2 border">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm text-gray-700">
                                Chiqimlar ({item.used_by.length}):
                              </h4>
                              {item.used_by.map((used, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-xs bg-white p-2 rounded border"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {used.expense_purpose || "-"}
                                    </div>
                                    <div className="text-gray-500">
                                      ID: {used.expense_transaction_id} •{" "}
                                      {used.expense_date
                                        ?.split("-")
                                        .reverse()
                                        .join(".")}
                                    </div>
                                  </div>
                                  <div className="font-semibold text-blue-600">
                                    {parseFloat(used.amount).toLocaleString(
                                      "ru-RU",
                                      {
                                        maximumFractionDigits: 2,
                                      },
                                    )}{" "}
                                    {item.currency?.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                  </>
                ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length > 0 && (
        <div className="mt-4 border-t pt-4 text-sm text-gray-700">
          <h2 className="font-semibold mb-2">
            Jami miqdor (valyuta bo'yicha):
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(getTotalsByCurrency()).map(([currency, total]) => (
              <div
                key={currency}
                className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2"
              >
                <strong>{total.toLocaleString("ru-RU")}</strong> {currency}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
