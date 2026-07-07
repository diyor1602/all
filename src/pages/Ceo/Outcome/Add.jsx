import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Edit2, PlusCircle, CheckCircle, Trash2, Magnet } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import formatNumber from "@/utils/formatNumber";

const Add = ({ onSuccess }) => {
  const { toast } = useToast();

  // State for dropdown data
  const [currincies, setCurrincies] = useState([]);
  const [comments, setComments] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [sending, setSending] = useState(false);

  // Form payload state
  const [payload, setPayload] = useState({
    amount: "",
    currency_id: "",
    purpose: "",
    comment: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Sources tracking state
  const [availableSources, setAvailableSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]); // Dynamic list of { id, allocatedAmount, ...sourceData }
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    getAvailableSources();
    setSelectedSources([]); // Reset selections if currency changes
  }, [payload.currency_id]);

  const getAvailableSources = async () => {
    if (!payload.currency_id) return;
    try {
      const res = await api.get("/ceo/cashbox/available-sources", {
        params: { currency_id: payload.currency_id },
      });
      setAvailableSources(res.data);
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kirim ma'lumotlarini olib bo'lmadi",
      });
    }
  };

  const fetchData = async () => {
    try {
      const [currenciesResponse, commentsResponse, purposesResponse] =
        await Promise.all([
          api.get("/ceo/currencies"),
          api.get("/ceo/comments", { params: { type: "expense" } }),
          api.get("/ceo/purposes", { params: { type: "expense" } }),
        ]);

      setCurrincies(currenciesResponse.data);
      setComments(commentsResponse.data);
      setPurposes(purposesResponse.data);

      const soM = currenciesResponse.data.find(
        (currency) => currency.name.toLowerCase() === "so'm",
      );
      if (soM) {
        setPayload((prevPayload) => ({
          ...prevPayload,
          currency_id: soM.id,
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Ma'lumotlarni olishda xatolik yuz berdi!",
      });
    }
  };

  // Manage selection additions/removals
  const toggleSourceSelection = (source) => {
    const exists = selectedSources.find((s) => s.id === source.id);
    if (exists) {
      setSelectedSources(selectedSources.filter((s) => s.id !== source.id));
    } else {
      setSelectedSources([
        ...selectedSources,
        { ...source, allocatedAmount: "" },
      ]);
    }
  };

  // Manage dynamic typed amounts per chosen source
  const handleAllocatedAmountChange = (sourceId, value) => {
    const source = selectedSources.find((s) => s.id === sourceId);
    if (!source) return;

    const numericValue = parseFloat(value) || 0;
    if (numericValue > source.remaining_amount) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: `Kiritilgan summa qoldiqdan (${formatNumber(source.remaining_amount)}) oshmasligi kerak!`,
        duration: 2500,
      });
      return;
    }

    setSelectedSources(
      selectedSources.map((s) =>
        s.id === sourceId ? { ...s, allocatedAmount: value } : s,
      ),
    );
  };

  // Aggregate selected sum total
  const totalSelectedAmount = selectedSources.reduce(
    (sum, s) => sum + (parseFloat(s.allocatedAmount) || 0),
    0,
  );

  const handleSubmit = async () => {
    if (!payload.amount || !payload.currency_id || !payload.date) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: "Barcha maydonlar to'ldirilishi shart!",
        duration: 2000,
      });
      return;
    }

    const mainAmount = parseFloat(payload.amount) || 0;

    // Validate that the main total matches aggregated manual source inputs
    if (mainAmount !== totalSelectedAmount) {
      toast({
        variant: "destructive",
        title: "Tafovut aniqlandi!",
        description: `Chiqim miqdori (${formatNumber(mainAmount)}) tanlangan manbalar yig'indisiga (${formatNumber(totalSelectedAmount)}) teng bo'lishi shart.`,
        duration: 4000,
      });
      return;
    }

    // Map source structure as required by the backend API schema
    const formattedSources = selectedSources.map((s) => ({
      income_transaction_id: s.id,
      amount: parseFloat(s.allocatedAmount),
    }));

    const finalPayload = {
      ...payload,
      amount: mainAmount,
      sources: formattedSources,
    };

    try {
      setSending(true);
      await api.post("/ceo/expenses", finalPayload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Chiqim qo'shildi!",
        style: { background: "green", color: "white" },
        duration: 2000,
      });

      setPayload({
        amount: "",
        purpose: "",
        comment: "",
        currency_id: payload.currency_id,
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedSources([]);

      if (onSuccess) onSuccess();
      fetchData();
      getAvailableSources();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Chiqim qo'shishda xatolik yuz berdi!",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-xl shadow-md">
      <div className="text-2xl font-bold mb-5">Chiqim qilish</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <Label>
            Miqdori{" "}
            {payload.amount
              ? `(${parseFloat(payload.amount)?.toLocaleString("ru-RU", {
                  maximumFractionDigits: 2,
                })})`
              : ""}
          </Label>
          <Input
            type="number"
            placeholder="Miqdori"
            value={payload.amount}
            onChange={(e) => setPayload({ ...payload, amount: e.target.value })}
          />
        </div>

        {/* Currency Select */}
        <div className="flex flex-col gap-2">
          <Label>Valyuta</Label>
          <Select
            value={payload.currency_id}
            onValueChange={(value) =>
              setPayload({ ...payload, currency_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Valyuta" />
            </SelectTrigger>
            <SelectContent>
              {currincies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Purpose Input */}
        <div className="flex flex-col gap-2">
          <Label>Maxsulot yoki shaxs ismi</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Maxsulot yoki shaxs ismi"
              value={payload.purpose}
              onChange={(e) =>
                setPayload({ ...payload, purpose: e.target.value })
              }
              list="purposes-datalist"
            />
            <datalist id="purposes-datalist">
              {purposes.map((purpose, index) => (
                <option key={index} value={purpose} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Comment Input */}
        <div className="flex flex-col gap-2">
          <Label>Ochiqlama</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Ochiqlama"
              value={payload.comment}
              onChange={(e) =>
                setPayload({ ...payload, comment: e.target.value })
              }
              list="comments-datalist"
            />
            <datalist id="comments-datalist">
              {comments.map((comment, index) => (
                <option key={index} value={comment} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Date Input */}
        <div className="flex flex-col gap-2">
          <Label>Sana</Label>
          <Input
            type="date"
            placeholder="Sana"
            value={payload.date}
            onChange={(e) => setPayload({ ...payload, date: e.target.value })}
          />
        </div>

        {/* Selected Sources Preview Area */}
        <div className="flex flex-col gap-2">
          <Label>Tanlangan Kirim Manbalari</Label>
          <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-gray-50 h-10">
            <div className="text-sm font-medium truncate max-w-[180px]">
              {selectedSources.length > 0
                ? `${selectedSources.length} ta manba (${formatNumber(totalSelectedAmount)})`
                : "Tanlanmagan"}
            </div>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => setSourceDialogOpen(true)}
            >
              {selectedSources.length > 0 ? (
                <Edit2 className="w-4 h-4" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={sending}
          className="self-end md:col-span-3 mt-2 md:w-48 ml-auto"
        >
          {sending ? "Yuborilmoqda..." : "Saqlash"}
        </Button>
      </div>

      {/* Optimized Dialog Setup */}
      <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Manbalarni tanlash va taqsimlash
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4 bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
            <div>
              Umumiy Chiqim Miqdori:{" "}
              <strong className="text-blue-700">
                {formatNumber(payload.amount || 0)}
              </strong>
            </div>
            <div>
              Taqsimlandi:{" "}
              <strong
                className={
                  totalSelectedAmount === parseFloat(payload.amount)
                    ? "text-green-600"
                    : "text-amber-600"
                }
              >
                {formatNumber(totalSelectedAmount)}
              </strong>
            </div>
          </div>

          <div>
            <Input
              type="text"
              placeholder="Izoh, maqsad yoki summa bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto pr-1 flex flex-col gap-3 flex-1 min-h-[250px] max-h-[50vh]">
            {availableSources?.sources
              ?.filter(
                (source) =>
                  source?.comment
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  source?.purpose
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  source?.remaining_amount?.toString().includes(searchTerm) ||
                  source?.amount?.toString().includes(searchTerm),
              )
              ?.map((source) => {
                const targetSelection = selectedSources.find(
                  (s) => s.id === source.id,
                );
                const isSelected = !!targetSelection;

                return (
                  <div
                    key={source.id}
                    className={`border rounded-xl p-4 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-sm"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {source?.purpose || "Maqsad ko'rsatilmagan"}
                          </span>
                          {isSelected && (
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Tanlandi
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {source?.comment || "Izohsiz"}
                        </p>
                        <div className="flex gap-4 text-xs font-medium pt-1">
                          <span className="text-gray-600">
                            Jami: {formatNumber(source?.amount)}
                          </span>
                          <span className="text-emerald-600">
                            Qoldiq: {formatNumber(source?.remaining_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isSelected && (
                          <div className="flex flex-col gap-1 w-32">
                            <Label className="text-[11px] text-gray-500">
                              Kiritilayotgan summa
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                size="sm"
                                className="h-8 py-1 text-sm bg-white"
                                placeholder="Miqdor"
                                value={targetSelection.allocatedAmount}
                                onChange={(e) =>
                                  handleAllocatedAmountChange(
                                    source.id,
                                    e.target.value,
                                  )
                                }
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  const remainingNeeded =
                                    parseFloat(payload.amount) -
                                    totalSelectedAmount;
                                  const amountToFill = Math.min(
                                    remainingNeeded,
                                    source.remaining_amount,
                                  );
                                  handleAllocatedAmountChange(
                                    source.id,
                                    amountToFill,
                                  );
                                }}
                                title="Qoldiqni avtomatik to'ldirish"
                              >
                                <Magnet className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "destructive" : "outline"}
                          className="h-8 mt-auto"
                          onClick={() => toggleSourceSelection(source)}
                        >
                          {isSelected ? (
                            <Trash2 className="w-4 h-4" />
                          ) : (
                            "Tanlash"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {availableSources?.sources?.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                Ushbu valyutada ochiq kirim manbalari mavjud emas.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedSources([]);
                setSourceDialogOpen(false);
              }}
            >
              Tozalash
            </Button>
            <Button type="button" onClick={() => setSourceDialogOpen(false)}>
              Tasdiqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Add;
