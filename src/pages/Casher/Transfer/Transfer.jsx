"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  Wallet,
  TrendingUp,
  Calendar,
  MessageSquare,
  Magnet,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import api from "@/utils/api";

const Transfer = () => {
  const { toast } = useToast();

  const [currencies, setCurrencies] = useState([]);
  const [balances, setBalances] = useState([]);
  const [form, setForm] = useState({
    from_currency_id: "",
    to_currency_id: "",
    from_amount: "",
    exchange_rate: "",
    date: "",
    comment: "",
    to_amount: "",
  });

  // Format number to ru-RU locale
  const formatNumber = (num) => {
    const numValue = typeof num === "string" ? Number.parseFloat(num) : num;
    if (isNaN(numValue)) return "0";
    return numValue.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format number for input display
  const formatInputNumber = (num) => {
    const numValue = typeof num === "string" ? Number.parseFloat(num) : num;
    if (isNaN(numValue)) return "";
    return numValue.toLocaleString("ru-RU");
  };

  const fetchCurrencies = async () => {
    try {
      const response = await api.get("/casher/currencies");
      setCurrencies(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Valyuta turlarini olishda xatolik yuz berdi",
      });
    }
  };

  const fetchBalances = async () => {
    try {
      const response = await api.get("/casher/balances");
      setBalances(response.data.cashboxes);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Balanslarni olishda xatolik yuz berdi",
      });
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchBalances();
  }, []);

  const getMaxFromAmount = (currencyId) => {
    const selectedCurrency = currencies.find(
      (c) => String(c.id) === String(currencyId)
    );
    if (!selectedCurrency) return null;

    const cashbox = balances.find((cb) => cb.id === 1);
    const balanceItem = cashbox?.balance.find(
      (b) => b.currency === selectedCurrency.name
    );

    if (!balanceItem) return null;

    return Number.parseFloat(
      balanceItem.amount.replace(/\s/g, "").replace(",", ".")
    );
  };

  const getAvailableToCurrencies = () => {
    return currencies.filter(
      (currency) => String(currency.id) !== String(form.from_currency_id)
    );
  };

  const getAvailableFromCurrencies = () => {
    return currencies.filter(
      (currency) => String(currency.id) !== String(form.to_currency_id)
    );
  };

  const handleChange = (key, value) => {
    const updatedForm = { ...form, [key]: value };

    // Reset to_currency if same as from_currency
    if (key === "from_currency_id" && value === form.to_currency_id) {
      updatedForm.to_currency_id = "";
    }

    // Reset from_currency if same as to_currency
    if (key === "to_currency_id" && value === form.from_currency_id) {
      updatedForm.from_currency_id = "";
    }

    // Prevent over-limit from_amount
    if (key === "from_amount") {
      const max = getMaxFromAmount(updatedForm.from_currency_id);
      const inputVal = Number.parseFloat(
        value.replace(/\s/g, "").replace(",", ".")
      );

      if (max && inputVal > max) {
        toast({
          variant: "destructive",
          title: "Limit oshib ketdi",
          description: `Maksimal ${formatNumber(
            max
          )} miqdorida pul o'tkazishingiz mumkin.`,
        });
        return;
      }
    }

    // Recalculate to_amount when from_amount or exchange_rate changes
    if (
      (key === "from_amount" || key === "exchange_rate") &&
      updatedForm.from_amount &&
      updatedForm.exchange_rate
    ) {
      const fromAmount = Number.parseFloat(
        updatedForm.from_amount.replace(/\s/g, "").replace(",", ".")
      );
      const exchangeRate = Number.parseFloat(
        updatedForm.exchange_rate.replace(/\s/g, "").replace(",", ".")
      );
      const toAmount = fromAmount * exchangeRate;
      updatedForm.to_amount = isNaN(toAmount) ? "" : toAmount.toFixed(2);
    }

    // Recalculate exchange_rate when to_amount changes
    if (key === "to_amount" && updatedForm.from_amount) {
      const fromAmount = Number.parseFloat(
        updatedForm.from_amount.replace(/\s/g, "").replace(",", ".")
      );
      const toAmount = Number.parseFloat(
        value.replace(/\s/g, "").replace(",", ".")
      );
      const newRate = toAmount / fromAmount;
      updatedForm.exchange_rate = isNaN(newRate) ? "" : newRate.toFixed(5);
      updatedForm.to_amount = value;
    }

    setForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/casher/transfers", form);
      toast({
        variant: "default",
        title: "Muvaffaqiyatli",
        description: "Pul muvaffaqiyatli o'tkazildi",
      });
      setForm({
        from_currency_id: "",
        to_currency_id: "",
        from_amount: "",
        exchange_rate: "",
        date: "",
        comment: "",
        to_amount: "",
      });
      fetchBalances();
      fetchCurrencies();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error.response.data.message || "Pul o'tkazishda xatolik yuz berdi",
      });
    }
  };

  const maxAmount = getMaxFromAmount(form.from_currency_id);
  const fromCurrency = currencies.find(
    (c) => String(c.id) === String(form.from_currency_id)
  );
  const toCurrency = currencies.find(
    (c) => String(c.id) === String(form.to_currency_id)
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Valyuta almashinuvi
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Balance Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Mavjud balanslar
          </h2>
          {balances.map((cashbox) => (
            <Card key={cashbox.id} className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  {cashbox.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cashbox.balance.map((balance, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-700">
                      {balance.currency}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-sm font-semibold"
                    >
                      {balance.amount}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Currency Selection */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Qaysi valyutadan
                    </Label>
                    <Select
                      value={form.from_currency_id}
                      onValueChange={(val) =>
                        handleChange("from_currency_id", val)
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Valyuta tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFromCurrencies().map((cur) => (
                          <SelectItem key={cur.id} value={String(cur.id)}>
                            {cur.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Qaysi valyutaga
                    </Label>
                    <Select
                      value={form.to_currency_id}
                      onValueChange={(val) =>
                        handleChange("to_currency_id", val)
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Valyuta tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableToCurrencies().map((cur) => (
                          <SelectItem key={cur.id} value={String(cur.id)}>
                            {cur.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Maximum Amount Display */}
                {maxAmount && fromCurrency && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Maksimal miqdor: {formatNumber(maxAmount)}{" "}
                        {fromCurrency.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Amount and Rate */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      O'tkaziladigan miqdor{" "}
                      {fromCurrency ? `(${fromCurrency.name})` : ""}
                      <Magnet
                        className="ml-auto cursor-pointer text-yellow-500"
                        onClick={() => {
                          if (maxAmount) {
                            handleChange("from_amount", maxAmount.toString());
                          }
                        }}
                      />
                    </Label>
                    <Input
                      type="text"
                      value={
                        form.from_amount
                          ? formatInputNumber(form.from_amount)
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\s/g, "")
                          .replace(",", ".");
                        handleChange("from_amount", value);
                      }}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ayirboshlash kursi
                    </Label>
                    <Input
                      type="text"
                      value={form.exchange_rate}
                      onChange={(e) =>
                        handleChange("exchange_rate", e.target.value)
                      }
                      placeholder="0,0000"
                      inputMode="decimal"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 text-lg"
                    />
                  </div>
                </div>

                {/* Result Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Olinadigan miqdor {toCurrency ? `(${toCurrency.name})` : ""}
                  </Label>
                  <Input
                    type="text"
                    value={
                      form.to_amount ? formatInputNumber(form.to_amount) : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\s/g, "")
                        .replace(",", ".");
                      handleChange("to_amount", value);
                    }}
                    placeholder="0,00"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 text-lg bg-green-50"
                  />
                </div>

                <Separator />

                {/* Date and Comment */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Sana
                    </Label>
                    <Input
                      type="date"
                      value={form.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => handleChange("date", e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Izoh
                    </Label>
                    <Textarea
                      value={form.comment}
                      onChange={(e) => handleChange("comment", e.target.value)}
                      placeholder="Izoh qo'shish..."
                      className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  disabled={
                    !form.from_currency_id ||
                    !form.to_currency_id ||
                    !form.from_amount ||
                    !form.exchange_rate ||
                    !form.date
                  }
                >
                  <ArrowRightLeft className="h-5 w-5 mr-2" />
                  O'tkazmani amalga oshirish
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
