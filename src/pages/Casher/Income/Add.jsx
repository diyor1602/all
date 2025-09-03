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

const Add = ({ onSuccess }) => {
  // Accept onSuccess callback prop
  const { toast } = useToast();

  // State for dropdown data
  const [currincies, setCurrincies] = useState([]);
  const [sources, setSources] = useState([]);
  const [purposes, setPurposes] = useState([]);

  const [sending, setSending] = useState(false);

  // Form payload state
  const [payload, setPayload] = useState({
    amount: "",
    currency_id: "",
    purpose: "",
    source: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fetch initial data on component mount
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array - runs once on mount

  const fetchData = async () => {
    try {
      // Fetch currencies, sources, and purposes in parallel
      const [currenciesResponse, sourcesResponse, purposesResponse] =
        await Promise.all([
          api.get("/casher/currencies"),
          api.get("/casher/sources", {
            params: {
              type: "income",
            },
          }),
          api.get("/casher/purposes", {
            params: {
              type: "income",
            },
          }),
        ]);

      // Update state with fetched data
      setCurrincies(currenciesResponse.data);
      setSources(sourcesResponse.data);
      setPurposes(purposesResponse.data);

      // Set default currency to "So'm" if available
      const soM = currenciesResponse.data.find(
        (currency) => currency.name.toLowerCase() === "so'm"
      );
      if (soM) {
        setPayload((prevPayload) => ({
          ...prevPayload,
          currency_id: soM.id,
        }));
      }
    } catch (error) {
      // Show error toast if data fetching fails
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Ma'lumotlarni olishda xatolik yuz berdi!",
      });
    }
  };

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
    try {
      setSending(true);

      await api.post("/casher/incomes", payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Kirim qo'shildi!",
        style: {
          background: "green",
          color: "white",
        },
        duration: 2000,
      });

      // Reset form
      setPayload({
        amount: "",
        purpose: "",
        source: "",
        currency_id: payload.currency_id, // Keep the currency selected
        date: new Date().toISOString().split("T")[0], // Reset to today
      });

      // Call the onSuccess callback to refresh parent data
      if (onSuccess) {
        onSuccess();
      }

      fetchData(); // Refresh dropdown data if needed
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Kirim qo'shishda xatolik yuz berdi!",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-xl shadow-md">
      <div className="text-2xl font-bold mb-5">Kirim qilish</div>
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

        {/* Source Input with Datalist Suggestions */}
        <div className="flex flex-col gap-2">
          <Label>Manba</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Manba"
              value={payload.source}
              onChange={(e) =>
                setPayload({ ...payload, source: e.target.value })
              }
              list="sources-datalist"
            />
            <datalist id="sources-datalist">
              {sources.map((source, index) => (
                <option key={index} value={source} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Purpose Input with Datalist Suggestions */}
        <div className="flex flex-col gap-2">
          <Label>Sabab</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Sabab"
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

        <Button onClick={handleSubmit} disabled={sending} className="self-end">
          {sending ? "Yuborilmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
};

export default Add;
