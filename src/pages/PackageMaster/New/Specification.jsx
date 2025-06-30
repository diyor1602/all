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
import { Loader2, ClipboardCopy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Specification = () => {
  const { toast } = useToast();

  const [pastedData, setPastedData] = useState("");
  const [matchedOrders, setMatchedOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [resultJson, setResultJson] = useState(null);
  const [capacities, setCapacities] = useState({});
  const [parsedSizes, setParsedSizes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const extractAndSearchOrders = async () => {
    const lines = pastedData.trim().split("\n");
    if (lines.length === 0) {
      toast({
        title: "Xatolik",
        description: "Iltimos, avval ma'lumotlarni joylang",
        variant: "destructive",
      });
      return;
    }

    const topLine = lines[0].replace(/\t/g, "").trim();
    const searchTerm = topLine.split(" ")[0];

    if (!searchTerm) {
      toast({
        title: "Xatolik",
        description: "Qidirish uchun so'rov kiritilmagan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get("/packageMaster/orders", {
        params: { search: searchTerm },
      });
      if (response.data.length === 0) {
        toast({
          title: "Topilmadi",
          description: `Buyurtmalar: "${searchTerm}" topilmadi`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Muvaffaqiyatli",
          description: `${response.data.length} ta buyurtma topildi`,
        });
      }
      setMatchedOrders(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtma olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getColorMap = (colors) => {
    const map = {};
    colors.forEach((c) => {
      const [name, value] = Object.entries(c)[0];
      map[name] = value;
    });
    return map;
  };

  const getAllColorNames = (sizes) => {
    const set = new Set();
    sizes.forEach((s) => s.colors.forEach((c) => set.add(Object.keys(c)[0])));
    return Array.from(set);
  };

  const getColumnTotal = (sizes, colorName) => {
    return sizes.reduce((sum, s) => {
      const match = s.colors.find((c) => Object.keys(c)[0] === colorName);
      return sum + (match ? Object.values(match)[0] : 0);
    }, 0);
  };

  const getSizeNameById = (id) => {
    for (const order of selectedOrders) {
      for (const s of order.order_model?.sizes || []) {
        if (s.id === id) return s.size.name;
      }
    }
    return "-";
  };

  const parseExcelData = () => {
    const lines = pastedData.trim().split("\n");
    if (lines.length < 2) return;

    const headers = lines[1].split("\t").slice(1, -1);
    const sizeLines = lines.slice(2, -2);

    const sizeMap = {};
    selectedOrders.forEach((order) => {
      order.order_model?.sizes.forEach((s) => {
        const key = s.size.name.replace(/\s/g, "").replace("-", "/");
        sizeMap[key] = { id: s.id };
      });
    });

    const parsed = sizeLines
      .map((line) => {
        const [sizeLabel, ...values] = line.split("\t");
        const cleanSize = sizeLabel.trim().replace("-", "/");
        const size = sizeMap[cleanSize];

        if (!size) return null;

        const colors = headers.map((color, idx) => ({
          [color.trim()]: parseInt(values[idx], 10) || 0,
        }));

        return {
          size_id: size.id,
          colors,
        };
      })
      .filter(Boolean);

    setParsedSizes(parsed);
    toast({ title: "Ma'lumot tahlil qilindi" });
  };

  const handleGenerateJson = () => {
    const sizes = parsedSizes.map((sizeObj) => ({
      ...sizeObj,
      capacity: capacities[sizeObj.size_id],
    }));

    const hasMissingCapacities = sizes.some((s) => !s.capacity);
    if (hasMissingCapacities) {
      toast({
        title: "Xatolik",
        description: "Barcha o'lchamlar uchun sig'im kiritilishi kerak",
        variant: "destructive",
      });
      return;
    }

    const orders = selectedOrders.map((o) => o.id);
    setResultJson({ orders, sizes });
  };

  const handleCapacityChange = (sizeId, value) => {
    setCapacities({ ...capacities, [sizeId]: parseInt(value) });
  };

  const toggleOrderSelection = (order) => {
    if (selectedOrders.find((o) => o.id === order.id)) {
      setSelectedOrders(selectedOrders.filter((o) => o.id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order]);
    }
  };

  const copyToClipboard = () => {
    if (!resultJson) return;
    navigator.clipboard.writeText(JSON.stringify(resultJson, null, 2));
    setCopied(true);
    toast({
      title: "Nusxalandi!",
      description: "JSON nusxalandi",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Excel Ma'lumotlarni Kiriting</CardTitle>
          <CardDescription>
            Excel jadvalidan nusxalangan ma'lumotlarni quyidagi maydonga joylang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="excel-data">Excel Ma'lumotlari</Label>
              <Textarea
                id="excel-data"
                className="min-h-[200px] font-mono text-sm"
                placeholder="Exceldan jadvalni shu yerga qo'ying..."
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
                disabled={!pastedData.trim() || matchedOrders.length === 0}
              >
                Tahlil qilish
              </Button>
              <Button
                variant="secondary"
                onClick={handleGenerateJson}
                disabled={parsedSizes.length === 0}
              >
                JSON yaratish
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
              {selectedOrders.length} ta tanlangan {matchedOrders.length} ta dan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedOrders.map((order) => {
                const isSelected = selectedOrders.some(
                  (o) => o.id === order.id
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
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">#{order.id}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.order_model?.model?.name} • {order.quantity}{" "}
                            ta
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
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
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
        <Tabs defaultValue="table" className="w-full">
          <TabsList>
            <TabsTrigger value="table">Jadval Ko'rinishi</TabsTrigger>
            <TabsTrigger value="json" disabled={!resultJson}>
              JSON Ma'lumotlari
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Excel Jadvali</CardTitle>
                <CardDescription>
                  Tahlil qilingan ma'lumotlar jadvali
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="h-10 px-4 text-left align-middle font-medium text-gray-700 text-xs uppercase tracking-wider">
                            Размер
                          </th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-gray-700 text-xs uppercase tracking-wider">
                            Sig'imi
                          </th>
                          {getAllColorNames(parsedSizes).map((color, idx) => (
                            <th
                              key={idx}
                              className="h-10 px-4 text-center align-middle font-medium text-gray-700 text-xs uppercase tracking-wider"
                            >
                              {color}
                            </th>
                          ))}
                          <th className="h-10 px-4 text-center align-middle font-medium text-gray-700 text-xs uppercase tracking-wider">
                            Об.кол
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedSizes.map((sizeObj, rowIdx) => {
                          const colorValues = getColorMap(sizeObj.colors);
                          const colorNames = getAllColorNames(parsedSizes);
                          const total = Object.values(colorValues).reduce(
                            (sum, val) => sum + val,
                            0
                          );

                          return (
                            <tr
                              key={rowIdx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="p-3 align-middle font-medium text-sm text-gray-900">
                                {getSizeNameById(sizeObj.size_id)}
                              </td>
                              <td className="p-3 align-middle">
                                <Input
                                  type="number"
                                  className="h-8 w-20 text-center text-sm border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                  value={capacities[sizeObj.size_id] || ""}
                                  onChange={(e) =>
                                    handleCapacityChange(
                                      sizeObj.size_id,
                                      e.target.value
                                    )
                                  }
                                  required
                                  min="1"
                                />
                              </td>
                              {colorNames.map((color, i) => (
                                <td
                                  key={i}
                                  className="p-3 align-middle text-center text-sm text-gray-800"
                                >
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                                    {colorValues[color] || 0}
                                  </span>
                                </td>
                              ))}
                              <td className="p-3 align-middle text-center">
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
                          <td className="p-3 text-sm text-gray-900 font-semibold">
                            об.кол
                          </td>
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
                                (sum, sizeObj) =>
                                  sum +
                                  sizeObj.colors.reduce(
                                    (s, c) => s + Object.values(c)[0],
                                    0
                                  ),
                                0
                              )}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json">
            {resultJson && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Yaratilgan JSON</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" /> Nusxalandi
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-4 w-4" /> Nusxalash
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="relative rounded-md bg-muted p-4 overflow-x-auto text-sm">
                    <code>{JSON.stringify(resultJson, null, 2)}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Specification;
