import { useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";

const Specification = () => {
  const { toast } = useToast();

  const [pastedData, setPastedData] = useState("");
  const [matchedOrders, setMatchedOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [parsedSizes, setParsedSizes] = useState([]);
  const [capacities, setCapacities] = useState({});
  const [kgs, setKgs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const extractAndSearchOrders = async () => {
    const lines = pastedData
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast({
        title: "Xatolik",
        description: "Iltimos, avval ma'lumotlarni joylang",
        variant: "destructive",
      });
      return;
    }

    const topLine = lines[0].replace(/\t/g, " ").trim();
    const searchTerm = topLine.split(/\s+/)[0];

    if (!searchTerm) {
      toast({
        title: "Xatolik",
        description: "Qidirish uchun so'rov topilmadi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get("/packageMaster/orders", {
        params: { search: searchTerm },
      });

      const orders = Array.isArray(response.data) ? response.data : [];
      setMatchedOrders(orders);

      if (orders.length === 0) {
        toast({
          title: "Topilmadi",
          description: `"${searchTerm}" bo‘yicha buyurtma topilmadi`,
          variant: "destructive",
          duration: 1500,
        });
      } else {
        toast({
          title: "Muvaffaqiyatli",
          description: `${orders.length} ta buyurtma topildi`,
          duration: 1200,
        });
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtmalarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOrderSelection = (order) => {
    const exists = selectedOrders.some((o) => o.id === order.id);
    if (exists) {
      setSelectedOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else {
      setSelectedOrders((prev) => [...prev, order]);
    }
  };

  const normalizeSizeName = (value = "") => {
    return String(value).replace(/\s+/g, "").trim();
  };

  const parseExcelData = () => {
    const rawLines = pastedData
      .split("\n")
      .map((line) => line.replace(/\r/g, ""));

    const lines = rawLines.filter((line) => line.trim() !== "");

    if (lines.length < 4) {
      toast({
        title: "Xatolik",
        description: "Excel ma'lumotlari yetarli emas",
        variant: "destructive",
      });
      return;
    }

    const headerIndex = lines.findIndex((line) => {
      const cells = line.split("\t").map((cell) => cell.trim().toLowerCase());
      return cells[0] === "размер";
    });

    if (headerIndex === -1) {
      toast({
        title: "Xatolik",
        description: "Header topilmadi. 'Размер' qatori bo‘lishi kerak",
        variant: "destructive",
      });
      return;
    }

    const headerCells = lines[headerIndex]
      .split("\t")
      .map((cell) => cell.trim())
      .filter((cell) => cell !== "");

    if (headerCells.length < 3) {
      toast({
        title: "Xatolik",
        description: "Color ustunlari topilmadi",
        variant: "destructive",
      });
      return;
    }

    const colorNames = headerCells.slice(1, -1);

    const dataLines = lines.slice(headerIndex + 1).filter((line) => {
      const firstCell = (line.split("\t")[0] || "").trim().toLowerCase();
      return firstCell && firstCell !== "об.кол";
    });

    const parsed = dataLines
      .map((line) => {
        const rawCells = line.split("\t").map((cell) => cell.trim());

        const cells = rawCells.filter(
          (_, index) =>
            !(
              index > 0 &&
              rawCells[index] === "" &&
              rawCells[index - 1] === ""
            ),
        );

        const sizeName = (cells[0] || "").trim();
        if (!sizeName) return null;

        const colorValues = cells.slice(1, 1 + colorNames.length);

        const colors = colorNames.map((colorName, index) => ({
          [colorName]: Number(colorValues[index]) || 0,
        }));

        return {
          size_name: normalizeSizeName(sizeName),
          colors,
        };
      })
      .filter(Boolean);

    if (parsed.length === 0) {
      toast({
        title: "Xatolik",
        description: "Razmerlar parse bo‘lmadi",
        variant: "destructive",
      });
      return;
    }

    setParsedSizes(parsed);

    const nextCapacities = {};
    const nextKgs = {};

    parsed.forEach((item) => {
      nextCapacities[item.size_name] = capacities[item.size_name] || "";
      nextKgs[item.size_name] = kgs[item.size_name] || "";
    });

    setCapacities(nextCapacities);
    setKgs(nextKgs);

    toast({
      title: "Tayyor",
      description: `${parsed.length} ta razmer parse qilindi`,
      duration: 1200,
    });
  };

  const handleCapacityChange = (sizeName, value) => {
    setCapacities((prev) => ({
      ...prev,
      [sizeName]: value,
    }));
  };

  const handleKgChange = (sizeName, value) => {
    setKgs((prev) => ({
      ...prev,
      [sizeName]: value,
    }));
  };

  const getAllColorNames = (sizes) => {
    const set = new Set();
    sizes.forEach((size) => {
      size.colors.forEach((colorObj) => {
        const key = Object.keys(colorObj)[0];
        if (key) set.add(key);
      });
    });
    return Array.from(set);
  };

  const getColorMap = (colors) => {
    const map = {};
    colors.forEach((item) => {
      const [key, value] = Object.entries(item)[0];
      map[key] = Number(value) || 0;
    });
    return map;
  };

  const getColumnTotal = (sizes, colorName) => {
    return sizes.reduce((sum, size) => {
      const found = size.colors.find((c) => Object.keys(c)[0] === colorName);
      return sum + (found ? Number(Object.values(found)[0]) || 0 : 0);
    }, 0);
  };

  const getRowTotal = (size) => {
    return size.colors.reduce((sum, item) => {
      return sum + (Number(Object.values(item)[0]) || 0);
    }, 0);
  };

  const handleGenerateJson = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta buyurtma tanlang",
        variant: "destructive",
      });
      return;
    }

    if (parsedSizes.length === 0) {
      toast({
        title: "Xatolik",
        description: "Avval excelni tahlil qiling",
        variant: "destructive",
      });
      return;
    }

    const sizes = parsedSizes.map((size) => ({
      size_name: size.size_name,
      colors: size.colors,
      capacity: Number(capacities[size.size_name]),
      kg: Number(kgs[size.size_name]),
    }));

    const hasMissingCapacity = sizes.some(
      (item) => item.capacity === 0 || Number.isNaN(item.capacity),
    );
    if (hasMissingCapacity) {
      toast({
        title: "Xatolik",
        description: "Barcha razmerlarga capacity kiriting",
        variant: "destructive",
      });
      return;
    }

    const hasMissingKg = sizes.some(
      (item) => item.kg === 0 || Number.isNaN(item.kg),
    );
    if (hasMissingKg) {
      toast({
        title: "Xatolik",
        description: "Barcha razmerlarga kg kiriting",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      orders: selectedOrders.map((order) => order.id),
      sizes,
    };

    console.log("payload:", payload);

    setIsSending(true);
    try {
      const response = await api.post("/packageMaster/packageStore", payload);

      if (response?.data?.url) {
        const link = document.createElement("a");
        link.href = response.data.url;
        link.target = "_blank";
        link.download = response.data.url.split("/").pop() || "download.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Muvaffaqiyatli",
        description: response?.data?.message || "Ma'lumot yuborildi",
        duration: 1800,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Excel ma'lumotlarini kiriting</CardTitle>
          <CardDescription>
            Exceldan copy qilingan jadvalni shu yerga joylang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="excel-data">Excel ma'lumotlari</Label>
              <Textarea
                id="excel-data"
                className="min-h-[220px] font-mono text-sm"
                placeholder={`8м0326
Размер\tфундук\t\tОб.кол
56-62\t40\t\t40
62-68\t50\t\t50
68-74\t60\t\t60
об.кол\t150\t\t150`}
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={extractAndSearchOrders}
                disabled={isLoading || !pastedData.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Qidirilmoqda...
                  </>
                ) : (
                  "Buyurtmalarni qidirish"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={parseExcelData}
                disabled={!pastedData.trim()}
              >
                Excelni tahlil qilish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {matchedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Topilgan buyurtmalar</CardTitle>
            <CardDescription>
              {selectedOrders.length} ta tanlangan / {matchedOrders.length} ta
              topilgan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedOrders.map((order) => {
                const isSelected = selectedOrders.some(
                  (o) => o.id === order.id,
                );

                return (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary border-primary" : ""
                    }`}
                    onClick={() => toggleOrderSelection(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="w-full">
                          <div className="flex items-center gap-2 w-full justify-between flex-wrap">
                            <h4 className="font-semibold">#{order.id}</h4>
                            <p
                              className={
                                "text-xs rounded-full px-2 py-1 text-white " +
                                (statuses[order.status]?.color || "bg-gray-500")
                              }
                            >
                              {statuses[order.status]?.text || order.status}
                            </p>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {order.order_model?.model?.name || "Model yo‘q"} •{" "}
                            {order.quantity || 0} ta
                          </p>

                          {order.order_model?.submodels?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {order.order_model.submodels.map((s, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {s.submodel?.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {parsedSizes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Excel jadvali</CardTitle>
            <CardDescription>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>Exceldan olingan razmer va colorlar</div>
                <Button
                  onClick={handleGenerateJson}
                  disabled={isSending || parsedSizes.length === 0}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    "Yuborish"
                  )}
                </Button>
              </div>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="h-10 px-4 text-left font-medium text-gray-700 text-xs uppercase tracking-wider">
                        Размер
                      </th>
                      <th className="h-10 px-4 text-left font-medium text-gray-700 text-xs uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="h-10 px-4 text-left font-medium text-gray-700 text-xs uppercase tracking-wider">
                        Kg
                      </th>
                      {getAllColorNames(parsedSizes).map((color, idx) => (
                        <th
                          key={idx}
                          className="h-10 px-4 text-center font-medium text-gray-700 text-xs uppercase tracking-wider"
                        >
                          {color}
                        </th>
                      ))}
                      <th className="h-10 px-4 text-center font-medium text-gray-700 text-xs uppercase tracking-wider">
                        Об.кол
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {parsedSizes.map((size, index) => {
                      const colorMap = getColorMap(size.colors);
                      const allColors = getAllColorNames(parsedSizes);
                      const total = getRowTotal(size);

                      return (
                        <tr
                          key={`${size.size_name}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium text-sm text-gray-900">
                            {size.size_name}
                          </td>

                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-8 w-24 text-center"
                              value={capacities[size.size_name] || ""}
                              onChange={(e) =>
                                handleCapacityChange(
                                  size.size_name,
                                  e.target.value,
                                )
                              }
                            />
                          </td>

                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-8 w-24 text-center"
                              value={kgs[size.size_name] || ""}
                              onChange={(e) =>
                                handleKgChange(size.size_name, e.target.value)
                              }
                            />
                          </td>

                          {allColors.map((color, idx) => (
                            <td key={idx} className="p-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full bg-gray-100 px-2">
                                {colorMap[color] || 0}
                              </span>
                            </td>
                          ))}

                          <td className="p-3 text-center">
                            <Badge
                              variant="secondary"
                              className="text-xs font-semibold"
                            >
                              {total}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="bg-gray-50 font-semibold">
                      <td className="p-3 text-sm text-gray-900">об.кол</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>

                      {getAllColorNames(parsedSizes).map((color, idx) => (
                        <td key={idx} className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold"
                          >
                            {getColumnTotal(parsedSizes, color)}
                          </Badge>
                        </td>
                      ))}

                      <td className="p-3 text-center">
                        <Badge className="bg-primary text-white text-xs font-semibold">
                          {parsedSizes.reduce(
                            (sum, size) => sum + getRowTotal(size),
                            0,
                          )}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted p-4">
              <div className="text-sm font-medium mb-2">
                Yuboriladigan format:
              </div>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    orders: selectedOrders.map((order) => order.id),
                    sizes: parsedSizes.map((size) => ({
                      size_name: size.size_name,
                      colors: size.colors,
                      capacity: Number(capacities[size.size_name]) || 0,
                      kg: Number(kgs[size.size_name]) || 0,
                    })),
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Specification;
