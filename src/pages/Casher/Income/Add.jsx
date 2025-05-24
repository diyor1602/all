import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Add = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    currency_id: "",
    source_id: "",
    via_id: "",
    purpose: "",
    comment: "",
  });

  const [currencies, setCurrencies] = useState([]);
  const [sources, setSources] = useState([]);
  const [vias, setVias] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        currenciesResponse,
        sourcesResponse,
        viasResponse,
        cashboxesResponse,
      ] = await Promise.all([
        api.get("/casher/currencies"),
        api.get("/casher/sources"),
        api.get("/casher/via"),
        api.get("/casher/balances"),
      ]);
      setCurrencies(currenciesResponse.data);
      setSources(sourcesResponse.data);
      setVias(viasResponse.data);
      setCashboxes(cashboxesResponse.data.cashboxes);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response.data.message ||
          "Ma'lumotlarni olishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || !form.currency_id || !form.source_id || !form.via_id) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: "Barcha maydonlar to'ldirilishi shart!",
      });
      return;
    }

    try {
      setLoading(true);

      const matchedSource = sources.find((s) => s.name === form.source_id);
      const matchedVia = vias.find((v) => v.name === form.via_id);

      const payload = {
        amount: form.amount,
        currency_id: form.currency_id,
        purpose: form.purpose,
        cashbox_id: form.cashbox_id,
        comment: form.comment,
        ...(matchedSource
          ? { source_id: matchedSource.id }
          : { source_name: form.source_id }),
        ...(matchedVia ? { via_id: matchedVia.id } : { via_name: form.via_id }),
      };

      await api.post("/casher/incomes", payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Kirim qo'shildi!",
      });
      navigate("/casher/income");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response.data.message || "Kirim qo'shishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 bg-white md:p-6"
    >
      <Input
        type="number"
        placeholder="Miqdor"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <Select
        value={form.currency_id}
        onValueChange={(value) => setForm({ ...form, currency_id: value })}
      >
        <SelectTrigger className="max-w-[180px]">
          <SelectValue placeholder="Valyuta" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.id} value={currency.id.toString()}>
              {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={form.cashbox_id}
        onValueChange={(value) => setForm({ ...form, cashbox_id: value })}
      >
        <SelectTrigger className="max-w-[180px]">
          <SelectValue placeholder="Cashbox" />
        </SelectTrigger>
        <SelectContent>
          {cashboxes.map((cashbox) => (
            <SelectItem key={cashbox.id} value={cashbox.id.toString()}>
              {cashbox.name} {cashbox.balances?.amount}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Source input or select */}
      <Input
        placeholder="Manba (Source)"
        list="source-list"
        value={form.source_id}
        onChange={(e) => setForm({ ...form, source_id: e.target.value })}
      />
      <datalist id="source-list">
        {sources.map((source) => (
          <option key={source.id} value={source.name} />
        ))}
      </datalist>

      {/* Via input or select */}
      <Input
        placeholder="Orqali (Via)"
        list="via-list"
        value={form.via_id}
        onChange={(e) => setForm({ ...form, via_id: e.target.value })}
      />
      <datalist id="via-list">
        {vias.map((via) => (
          <option key={via.id} value={via.name} />
        ))}
      </datalist>
      <Input
        placeholder="Sabab"
        value={form.purpose}
        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
      />
      <Input
        placeholder="Izoh"
        value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
      />
      <Button type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          "Qo'shish"
        )}
      </Button>
    </form>
  );
};

export default Add;
