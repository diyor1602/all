import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  ChevronsUpDown,
  Check,
  Trash2,
  Plus,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";

const EditOrder = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [models, setModels] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [contragentOpen, setContragentOpen] = useState(false);
  const [matrix, setMatrix] = useState({
    sizes: [],
    colors: [],
    quantities: {},
  });

  const uid = () => Math.random().toString(36).slice(2, 9);

  const addSize = () => {
    setMatrix((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { id: uid(), name: "" }],
    }));
  };

  const addColor = () => {
    setMatrix((prev) => ({
      ...prev,
      colors: [...prev.colors, { id: uid(), name: "" }],
    }));
  };

  const updateQty = (sizeId, colorId, value) => {
    const key = `${sizeId}-${colorId}`;

    setMatrix((prev) => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [key]: value,
      },
    }));
  };

  const deleteSize = (sizeId) => {
    setMatrix((prev) => {
      const sizes = prev.sizes.filter((s) => s.id !== sizeId);

      const quantities = { ...prev.quantities };

      Object.keys(quantities).forEach((key) => {
        if (key.startsWith(sizeId + "-")) {
          delete quantities[key];
        }
      });

      return { ...prev, sizes, quantities };
    });
  };

  const deleteColor = (colorId) => {
    setMatrix((prev) => {
      const colors = prev.colors.filter((c) => c.id !== colorId);

      const quantities = { ...prev.quantities };

      Object.keys(quantities).forEach((key) => {
        if (key.endsWith("-" + colorId)) {
          delete quantities[key];
        }
      });

      return { ...prev, colors, quantities };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modelsResponse, contragentsResponse] = await Promise.all([
        api.get("/cuttingMaster/models"),
        api.get("/cuttingMaster/contragents"),
      ]);
      setModels(modelsResponse.data);
      setContragents(contragentsResponse.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderData = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/cuttingMaster/orders2/${id}`);
      const orderData = res.data;

      const mappedPayload = {
        name: orderData.name || "",
        quantity: orderData.quantity?.toString() || "",
        price: orderData.price?.toString() || "",
        comment: orderData.comment || "",
        season_year: orderData.season_year || "",
        season_type: orderData.season_type || "",
        model: {
          id: orderData.order_model?.model?.id || "",
          name: orderData.order_model?.model?.name || "",
          submodels:
            orderData.order_model?.submodels?.map((sm) => sm.submodel.id) || [],
          sizes:
            orderData.order_model?.sizes?.map((size) => ({
              size_name: size.size_name,
              color_name: size.color_name,
              quantity: size.quantity,
            })) || [],
        },
        submodels:
          orderData.order_model?.submodels?.map((sm) => sm.submodel.id) || [],
        contragent: {
          id: orderData.contragent?.id || null,
          name: orderData.contragent?.name || "",
          isNew: false,
        },
      };

      setPayload(mappedPayload);
      // Extract unique sizes and colors from the order data
      const sizesData = orderData.order_model?.sizes || [];
      const uniqueSizes = [
        ...new Map(
          sizesData.map((item) => [
            item.size_name,
            { id: uid(), name: item.size_name },
          ]),
        ).values(),
      ];
      const uniqueColors = [
        ...new Map(
          sizesData.map((item) => [
            item.color_name,
            { id: uid(), name: item.color_name },
          ]),
        ).values(),
      ];

      // Build the quantities matrix
      const quantities = {};
      sizesData.forEach((item) => {
        const sizeId = uniqueSizes.find((s) => s.name === item.size_name)?.id;
        const colorId = uniqueColors.find(
          (c) => c.name === item.color_name,
        )?.id;
        if (sizeId && colorId) {
          quantities[`${sizeId}-${colorId}`] = item.quantity;
        }
      });

      setMatrix({
        sizes: uniqueSizes,
        colors: uniqueColors,
        quantities: quantities,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        variant: "destructive",
        description: "Ma'lumotlarni olib bo'lmadi",
      });
    }
  };

  const [payload, setPayload] = useState({
    name: "",
    quantity: "",
    price: "",
    comment: "",
    season_year: new Date().getFullYear(),
    season_type: "",
    model: {
      id: "",
      submodels: [],
      sizes: [],
    },
    contragent: {
      id: null,
      name: "",
      isNew: false,
    },
  });

  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !payload.name ||
      !payload.model.submodels.length ||
      !payload.model.sizes.length ||
      !payload.season_year ||
      !payload.season_type
    ) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlar to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }

    if (payload.season_year < 2020) {
      toast({
        title: "Xatolik",
        description: "Yil 2020 dan katta bo'lishi shart",
        variant: "destructive",
      });
      return;
    }

    // Check for empty size or color names
    const hasEmptySize = matrix.sizes.some((size) => !size.name.trim());
    const hasEmptyColor = matrix.colors.some((color) => !color.name.trim());

    if (hasEmptySize || hasEmptyColor) {
      toast({
        title: "Xatolik",
        description: "Barcha o'lcham va rang nomlari to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }

    const sizesPayload = [];

    matrix.sizes.forEach((size) => {
      matrix.colors.forEach((color) => {
        const key = `${size.id}-${color.id}`;
        const qty = Number(matrix.quantities[key] || 0);

        if (size.name && color.name && qty > 0) {
          sizesPayload.push({
            size_name: size.name,
            color_name: color.name,
            quantity: qty,
          });
        }
      });
    });

    const sizes = sizesPayload;

    const totalQuantity = sizes.reduce(
      (sum, size) => sum + (size.quantity || 0),
      0,
    );

    const formattedPayload = {
      name: payload.name,
      quantity: totalQuantity,
      price: payload.price,
      comment: payload.comment,
      season_year: payload.season_year,
      season_type: payload.season_type,
      model: {
        id: payload.model.id,
        submodels:
          payload.model.submodels
            ?.map((submodel) =>
              typeof submodel === "object" ? submodel.id : submodel,
            )
            .filter(Boolean) || [],
        sizes: sizes,
      },
    };

    // Only include contragent_id OR contragent_name, not both
    if (payload.contragent.isNew) {
      formattedPayload.contragent_name = payload.contragent.name;
    } else if (payload.contragent.id) {
      formattedPayload.contragent_id = payload.contragent.id;
    }

    setIsSending(true);
    try {
      await api.patch(`/cuttingMaster/orders2/${id}`, formattedPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli tahrirlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });
      fetchData();
      fetchOrderData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Buyurtmani tahrirlashda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOrderData();
  }, []);

  return (
    <div className="">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Buyurtmani tahrirlash
        </h1>
      </div>
      {loading ? (
        <div className="w-full h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2
              className="animate-spin text-primary mx-auto mb-4"
              size={48}
            />
            <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="w-2 h-8 bg-blue-500 rounded mr-3"></span>
              Asosiy ma'lumotlar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="season_year"
                  className="text-sm font-medium text-gray-700"
                >
                  Yil
                </Label>
                <Select
                  value={String(payload.season_year)}
                  onValueChange={(value) =>
                    setPayload({ ...payload, season_year: Number(value) })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Yil tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 7 }, (_, i) => {
                      const year = new Date().getFullYear() - 3 + i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="season_type"
                  className="text-sm font-medium text-gray-700"
                >
                  Mavsum
                </Label>
                <Select
                  value={payload.season_type}
                  onValueChange={(value) =>
                    setPayload({ ...payload, season_type: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Mavsum tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="winter">Qish</SelectItem>
                    <SelectItem value="summer">Bahor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Searchable Contragent Selection */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="orderContragent"
                  className="text-sm font-medium text-gray-700"
                >
                  Kontragent
                </Label>
                <Popover open={contragentOpen} onOpenChange={setContragentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={contragentOpen}
                      className="justify-between bg-white border-gray-300 hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500"
                    >
                      {payload.contragent.name || "Kontragent tanlang"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Kontragent qidirish yoki yaratish..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                const input = document.querySelector(
                                  '[placeholder="Kontragent qidirish yoki yaratish..."]',
                                );
                                const searchValue = input?.value || "";
                                if (searchValue.trim()) {
                                  setPayload((prev) => ({
                                    ...prev,
                                    contragent: {
                                      id: null,
                                      name: searchValue.trim(),
                                      isNew: true,
                                    },
                                  }));
                                  setContragentOpen(false);
                                }
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Yangi kontragent yaratish
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {contragents.map((contragent) => (
                            <CommandItem
                              key={contragent.id}
                              value={contragent.name}
                              onSelect={() => {
                                setPayload((prev) => ({
                                  ...prev,
                                  contragent: {
                                    id: contragent.id,
                                    name: contragent.name,
                                    isNew: false,
                                  },
                                }));
                                setContragentOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  payload.contragent.id === contragent.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {contragent.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {payload.contragent.isNew && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Yangi kontragent: {payload.contragent.name}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="orderName"
                  className="text-sm font-medium text-gray-700"
                >
                  Buyurtma nomi
                </Label>
                <Input
                  type="text"
                  id="orderName"
                  placeholder="Buyurtma nomi"
                  value={payload.name}
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) =>
                    setPayload({ ...payload, name: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="orderModel"
                  className="text-sm font-medium text-gray-700"
                >
                  Modelni tanlang
                </Label>
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={modelOpen}
                      className="justify-between bg-white border-gray-300 hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500"
                    >
                      {payload.model.name || "Model tanlang"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Modelni qidirish..." />
                      <CommandList>
                        <CommandEmpty>Model topilmadi</CommandEmpty>
                        <CommandGroup>
                          {models.map((model) => (
                            <CommandItem
                              key={model.id}
                              value={model.name}
                              onSelect={() => {
                                const selectedModel = models.find(
                                  (m) => m.id === model.id,
                                );
                                const hasOnlyOneSubmodel =
                                  selectedModel?.submodels?.length === 1;

                                setPayload({
                                  ...payload,
                                  model: {
                                    ...model,
                                    submodels: hasOnlyOneSubmodel
                                      ? [selectedModel.submodels[0].id]
                                      : [], // auto-select if only one
                                  },
                                });

                                setModelOpen(false);
                              }}
                            >
                              <div className="w-full flex flex-col gap-1">
                                <div>{model.name}</div>
                                <div className="flex gap-2 flex-wrap">
                                  {model.submodels?.map((submodel) => (
                                    <span
                                      key={submodel.id}
                                      className="rounded-full bg-gray-200 px-2 py-1 text-xs"
                                    >
                                      {submodel.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  model === payload.model
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="orderComment"
                  className="text-sm font-medium text-gray-700"
                >
                  Izoh
                </Label>
                <Input
                  id="orderComment"
                  name="orderComment"
                  value={payload.comment}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) =>
                    setPayload({ ...payload, comment: e.target.value })
                  }
                  placeholder="Buyurtma haqida izoh"
                />
              </div>
            </div>

            {payload?.model?.id && (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-8 bg-green-500 rounded mr-3"></span>
                    Submodel tanlash
                  </h2>
                  <div className="flex flex-wrap gap-3 items-center">
                    {models
                      ?.find((model) => model.id === payload.model.id)
                      ?.submodels.map((submodel) => (
                        <div key={submodel.id}>
                          <Button
                            variant={
                              payload.model.submodels?.includes(submodel.id)
                                ? "default"
                                : "outline"
                            }
                            type="button"
                            className={`transition-all duration-200 ${
                              payload.model.submodels?.includes(submodel.id)
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                            }`}
                            onClick={() => {
                              const currentModel = models.find(
                                (m) => m.id === payload.model.id,
                              );
                              const hasOnlyOneSubmodel =
                                currentModel?.submodels?.length === 1;

                              // Don't allow unselecting if there's only one submodel
                              if (
                                hasOnlyOneSubmodel &&
                                payload.model.submodels?.includes(submodel.id)
                              ) {
                                return;
                              }

                              setPayload((prev) => {
                                const exists = prev.model.submodels?.includes(
                                  submodel.id,
                                );
                                return {
                                  ...prev,
                                  model: {
                                    ...prev.model,
                                    submodels: exists
                                      ? [] // if clicked again, unselect
                                      : [submodel.id], // allow only ONE
                                  },
                                };
                              });
                            }}
                          >
                            {submodel.name}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="w-2 h-8 bg-purple-500 rounded mr-3"></span>
                    O'lcham va rang matritsasi
                  </h2>

                  <div className="flex gap-3 mb-6 flex-wrap">
                    <Button
                      type="button"
                      onClick={addSize}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" /> O'lcham qo'shish
                    </Button>

                    <Button
                      type="button"
                      onClick={addColor}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Rang qo'shish
                    </Button>
                  </div>

                  <div className="overflow-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-3 font-semibold text-gray-700">
                            O'lcham / Rang
                          </th>

                          {matrix.colors.map((color) => (
                            <th key={color.id} className="border p-3">
                              <div className="flex gap-2">
                                <Input
                                  value={color.name}
                                  placeholder="Rang"
                                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                  onChange={(e) => {
                                    setMatrix((prev) => ({
                                      ...prev,
                                      colors: prev.colors.map((c) =>
                                        c.id === color.id
                                          ? { ...c, name: e.target.value }
                                          : c,
                                      ),
                                    }));
                                  }}
                                />

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  type="button"
                                  onClick={() => deleteColor(color.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </th>
                          ))}
                          <th className="border p-3 bg-blue-50 font-bold text-gray-700">
                            Jami (qator)
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {matrix.sizes.map((size) => {
                          // Calculate row total for this size
                          const rowTotal = matrix.colors.reduce(
                            (sum, color) => {
                              const key = `${size.id}-${color.id}`;
                              return sum + Number(matrix.quantities[key] || 0);
                            },
                            0,
                          );

                          return (
                            <tr key={size.id}>
                              <td className="border p-2">
                                <div className="flex gap-1">
                                  <Input
                                    value={size.name}
                                    placeholder="O'lcham"
                                    className="bg-white"
                                    onChange={(e) => {
                                      setMatrix((prev) => ({
                                        ...prev,
                                        sizes: prev.sizes.map((s) =>
                                          s.id === size.id
                                            ? { ...s, name: e.target.value }
                                            : s,
                                        ),
                                      }));
                                    }}
                                  />

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    type="button"
                                    onClick={() => deleteSize(size.id)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>

                              {matrix.colors.map((color) => {
                                const key = `${size.id}-${color.id}`;

                                return (
                                  <td key={color.id} className="border p-1">
                                    <Input
                                      type="number"
                                      className="bg-white"
                                      value={matrix.quantities[key] || ""}
                                      onChange={(e) =>
                                        updateQty(
                                          size.id,
                                          color.id,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                );
                              })}
                              <td className="border p-3 bg-blue-50 font-bold text-center text-gray-700">
                                {rowTotal}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Column totals row */}
                        <tr>
                          <td className="border p-2 bg-gray-100 font-bold">
                            Jami (ustun)
                          </td>
                          {matrix.colors.map((color) => {
                            // Calculate column total for this color
                            const columnTotal = matrix.sizes.reduce(
                              (sum, size) => {
                                const key = `${size.id}-${color.id}`;
                                return (
                                  sum + Number(matrix.quantities[key] || 0)
                                );
                              },
                              0,
                            );

                            return (
                              <td
                                key={color.id}
                                className="border p-2 bg-gray-100 font-bold text-center"
                              >
                                {columnTotal}
                              </td>
                            );
                          })}
                          <td className="border p-2 bg-gray-200 font-bold text-center">
                            {matrix.sizes.reduce(
                              (grandTotal, size) =>
                                grandTotal +
                                matrix.colors.reduce((rowTotal, color) => {
                                  const key = `${size.id}-${color.id}`;
                                  return (
                                    rowTotal +
                                    Number(matrix.quantities[key] || 0)
                                  );
                                }, 0),
                              0,
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 shadow-lg transition-all duration-200 disabled:opacity-50"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Buyurtmani saqlash
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditOrder;
