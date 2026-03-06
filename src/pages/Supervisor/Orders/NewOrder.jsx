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
import { useNavigate } from "react-router-dom";

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [materials, setMaterials] = useState([]);
  const [models, setModels] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
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
      const [materialsResponse, modelsResponse, contragentsResponse] =
        await Promise.all([
          api.get("/supervisor/materials"),
          api.get("/supervisor/models"),
          api.get("/supervisor/contragents"),
        ]);
      setMaterials(materialsResponse.data);
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

  const [payload, setPayload] = useState({
    name: "",
    quantity: "",
    comment: "",
    season_year: new Date().getFullYear(),
    season_type: "",
    model: {
      id: "",
      material_id: null,
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
      price: 0,
      comment: payload.comment,
      season_year: payload.season_year,
      season_type: payload.season_type,
      model: {
        id: payload.model.id,
        material_id: payload.model.material_id,
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

    if (payload.model.material?.isNew) {
      formattedPayload.model.material_name = payload.model.material.name;
      delete formattedPayload.model.material_id;
    } else {
      formattedPayload.model.material_id = payload.model.material_id;
    }

    setIsSending(true);
    try {
      await api.post("/supervisor/orders", formattedPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli yaratildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });
      navigate("/supervisor/orders");
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Buyurtma yaratishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="text-2xl font-bold mb-4">Yangi buyurtma yaratish</div>
      {loading ? (
        <div className="w-full h-[80vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            <div className="flex flex-col gap-2">
              <Label htmlFor="season_year">Yil</Label>
              <Select
                value={String(payload.season_year)}
                onValueChange={(value) =>
                  setPayload({ ...payload, season_year: Number(value) })
                }
              >
                <SelectTrigger className="bg-white">
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
              <Label htmlFor="season_type">Mavsum</Label>
              <Select
                value={payload.season_type}
                onValueChange={(value) =>
                  setPayload({ ...payload, season_type: value })
                }
              >
                <SelectTrigger className="bg-white">
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
              <Label htmlFor="orderContragent">Kontragent</Label>
              <Popover open={contragentOpen} onOpenChange={setContragentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={contragentOpen}
                    className="justify-between bg-white"
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
              <Label htmlFor="orderName">Buyurtma nomi</Label>
              <Input
                type="text"
                id="orderName"
                placeholder="Buyurtma nomi"
                value={payload.name}
                required
                className="bg-white"
                onChange={(e) =>
                  setPayload({ ...payload, name: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="orderModel">Modelni tanlang</Label>
              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelOpen}
                    className="justify-between bg-white"
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="orderMaterial">Materialni tanlang</Label>
              <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={materialOpen}
                    className="justify-between bg-white"
                  >
                    {payload.model.material?.name || "Material tanlang"}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Materialni qidirish yoki yaratish..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              const input = document.querySelector(
                                '[placeholder="Materialni qidirish yoki yaratish..."]',
                              );
                              const searchValue = input?.value || "";
                              if (searchValue.trim()) {
                                setPayload((prev) => ({
                                  ...prev,
                                  model: {
                                    ...prev.model,
                                    material_id: null,
                                    material: {
                                      name: searchValue.trim(),
                                      isNew: true,
                                    },
                                  },
                                }));
                                setMaterialOpen(false);
                              }
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Yangi material yaratish
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {materials.map((material) => (
                          <CommandItem
                            key={material.id}
                            value={material.name}
                            onSelect={() => {
                              setPayload((prev) => ({
                                ...prev,
                                model: {
                                  ...prev.model,
                                  material_id: material.id,
                                  material: { ...material, isNew: false },
                                },
                              }));
                              setMaterialOpen(false);
                            }}
                          >
                            <div className="w-full flex flex-col gap-1">
                              <div>{material.name}</div>
                              <div className="text-xs text-gray-500">
                                {material.color?.name} {material.lot}
                              </div>
                            </div>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                material.id === payload.model.material_id
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
              {payload.model.material?.isNew && (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Yangi material: {payload.model.material.name}
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="orderComment">Izoh</Label>
              <Input
                id="orderComment"
                name="orderComment"
                value={payload.comment}
                className="bg-white"
                onChange={(e) =>
                  setPayload({ ...payload, comment: e.target.value })
                }
                placeholder="Buyurtma haqida izoh"
              />
            </div>
          </div>

          {payload?.model?.id && (
            <>
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                Submodel:
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
                                  : [submodel.id], // ✅ allow only ONE
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

              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addSize}
                    className="bg-blue-500 hover:bg-blue-400"
                  >
                    <Plus className="w-4 h-4 mr-1" /> O'lcham
                  </Button>

                  <Button
                    type="button"
                    onClick={addColor}
                    className="bg-orange-500 hover:bg-orange-400"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Rang
                  </Button>
                </div>

                <div className="overflow-auto">
                  <table className="border w-full text-sm">
                    <thead>
                      <tr>
                        <th className="border p-2">O'lcham / Rang</th>

                        {matrix.colors.map((color) => (
                          <th key={color.id} className="border p-2">
                            <div className="flex gap-1">
                              <Input
                                value={color.name}
                                placeholder="Rang"
                                className="bg-white"
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
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </th>
                        ))}
                        <th className="border p-2 bg-gray-100 font-bold">
                          Jami (qator)
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {matrix.sizes.map((size) => {
                        // Calculate row total for this size
                        const rowTotal = matrix.colors.reduce((sum, color) => {
                          const key = `${size.id}-${color.id}`;
                          return sum + Number(matrix.quantities[key] || 0);
                        }, 0);

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
                            <td className="border p-2 bg-gray-100 font-bold text-center">
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
                              return sum + Number(matrix.quantities[key] || 0);
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
                                  rowTotal + Number(matrix.quantities[key] || 0)
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

          <div className="flex justify-end">
            <Button type="submit" className="mt-4" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save />
                  Saqlash
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default NewOrder;
