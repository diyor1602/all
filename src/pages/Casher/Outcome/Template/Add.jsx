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

  // Fetch initial data on component mount
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array - runs once on mount

  const fetchData = async () => {
    try {
      // Fetch currencies, comments, and purposes in parallel
      const [currenciesResponse, commentsResponse, purposesResponse] =
        await Promise.all([
          api.get("/casher/currencies"),
          api.get("/casher/comments", {
            params: {
              type: "expense",
            },
          }),
          api.get("/casher/purposes", {
            params: {
              type: "expense",
            },
          }),
        ]);

      // Update state with fetched data
      setCurrincies(currenciesResponse.data);
      setComments(commentsResponse.data);
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
    if (!payload.purpose) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: "Chiqim turi to'ldirilishi shart!",
        duration: 2000,
      });
      return;
    }
    try {
      setSending(true);

      await api.post("/casher/expenses", payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Chiqim qo'shildi!",
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
        comment: "",
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

        {/* Purpose Input with Datalist Suggestions */}
        <div className="flex flex-col gap-2">
          <Label>Chiqim turi</Label>
          <div className="relative">
            <Select
              value={payload.purpose}
              onValueChange={(value) =>
                setPayload({ ...payload, purpose: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chiqim turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="фурнитура">фурнитура</SelectItem>
                <SelectItem value="озик овкат">озик овкат</SelectItem>
                <SelectItem value="бошка чикимлар">бошка чикимлар</SelectItem>
                <SelectItem value="цех харачатлари">цех харачатлари</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comment Input with Datalist Suggestions */}
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

        <Button onClick={handleSubmit} disabled={sending} className="self-end">
          {sending ? "Yuborilmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
};

export default Add;
