"use client";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

const EditOrder = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [materials, setMaterials] = useState([]);
  const [models, setModels] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [contragentOpen, setContragentOpen] = useState(false);
  const [colorOpens, setColorOpens] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        materialsResponse,
        modelsResponse,
        contragentsResponse,
        colorsResponse,
      ] = await Promise.all([
        api.get("/orderManager/materials"),
        api.get("/orderManager/models"),
        api.get("/orderManager/contragents"),
        api.get("/orderManager/colors"),
      ]);
      setMaterials(materialsResponse.data);
      setModels(modelsResponse.data);
      setContragents(contragentsResponse.data);
      setColors(colorsResponse.data);
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
    price: "",
    start_date: "",
    end_date: "",
    rasxod: "",
    comment: "",
    model: {
      id: "",
      material_id: "",
      submodels: [],
      sizes: [],
      sizesList: [],
    },
    material: null,
    submodels: [],
    contragent: {
      id: null,
      name: "",
      isNew: false,
    },
  });

  const fetchOrderData = async () => {
    if (!id) return;

    try {
      const response = await api.get(`/orderManager/orders/${id}`);
      const orderData = response.data;

      // Format dates to YYYY-MM-DD format for input fields
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      // Map API response to payload format
      const mappedPayload = {
        name: orderData.name || "",
        quantity: orderData.quantity?.toString() || "",
        price: orderData.price?.toString() || "",
        start_date: formatDate(orderData.start_date),
        end_date: formatDate(orderData.end_date),
        rasxod: orderData.rasxod?.toString() || "",
        comment: orderData.comment || "",
        model: {
          id: orderData.order_model?.model?.id || "",
          name: orderData.order_model?.model?.name || "",
          material_id: orderData.order_model?.material?.id || "",
          submodels:
            orderData.order_model?.submodels?.map((sm) => sm.submodel.id) || [],
          sizes:
            orderData.order_model?.sizes?.map((size) => ({
              id: size.size.id,
              sizeId: size.id, // Store the size's ID for later use in the payload
              name: size.size.name,
              quantity: size.quantity,
              color: size.color
                ? {
                    id: size.color.id,
                    name: size.color.name,
                    isNew: false,
                    isNewlyCreated: false, // Existing colors from the database
                  }
                : {
                    id: null,
                    name: "",
                    isNew: false,
                    isNewlyCreated: false,
                  },
            })) || [],
          sizesList: [], // Will be populated when model is selected
        },
        material: orderData.order_model?.material
          ? {
              id: orderData.order_model.material.id,
              name: orderData.order_model.material.name,
              price: orderData.order_model.material.price,
              code: orderData.order_model.material.code,
            }
          : null,
        submodels:
          orderData.order_model?.submodels?.map((sm) => sm.submodel.id) || [],
        contragent: {
          id: orderData.contragent?.id || null,
          name: orderData.contragent?.name || "",
          isNew: false,
        },
      };

      setPayload(mappedPayload);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtma ma'lumotlarini yuklashda xatolik",
        variant: "destructive",
      });
    }
  };

  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !payload.name ||
      !payload.model.id ||
      !payload.price ||
      !payload.model.material_id ||
      !payload.model.submodels.length ||
      !payload.model.sizes.length
    ) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlar to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }

    // Calculate total quantity from all sizes
    const sizes =
      payload.model.sizes
        ?.map((size) => {
          const sizeData = {
            // Only include id if sizeId exists (for existing sizes)
            ...(size.sizeId && { id: size.sizeId }),
            quantity: Number.parseInt(size.quantity) || 0,
            size_id: size.id, // The size ID (e.g., 5770)
          };

          // For new colors, always use color_name
          if (size.color?.isNew) {
            sizeData.color_name = size.color.name;
          }
          // For existing colors that were previously created in this session
          else if (size.color?.isNewlyCreated) {
            sizeData.color_name = size.color.name;
          }
          // For pre-existing colors from the database
          else if (size.color?.id) {
            sizeData.color_id = size.color.id;
          }

          return sizeData;
        })
        .filter((size) => (size.id || size.size_id) && size.quantity > 0) || [];

    const totalQuantity = sizes.reduce(
      (sum, size) => sum + (size.quantity || 0),
      0
    );

    const formattedPayload = {
      name: payload.name,
      quantity: totalQuantity,
      price: payload.price,
      start_date: payload.start_date,
      end_date: payload.end_date,
      rasxod: payload.rasxod,
      comment: payload.comment,
      model: {
        id: payload.model.id,
        material_id: payload.model.material_id,
        submodels:
          payload.model.submodels
            ?.map((submodel) =>
              typeof submodel === "object" ? submodel.id : submodel
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
      await api.patch(`/orderManager/orders/${id}`, formattedPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli yangilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Buyurtma yangilashda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleColorOpen = (index, isOpen) => {
    setColorOpens((prev) => ({
      ...prev,
      [index]: isOpen,
    }));
  };

  useEffect(() => {
    fetchData();
    fetchOrderData();
  }, [id]);

  // Update model sizes list when model changes
  useEffect(() => {
    if (payload.model.id && models.length > 0) {
      const selectedModel = models.find((m) => m.id === payload.model.id);
      if (selectedModel) {
        setPayload((prev) => ({
          ...prev,
          model: {
            ...prev.model,
            sizesList: selectedModel.sizes || [],
          },
        }));
      }
    }
  }, [payload.model.id, models]);

  return (
    <>
      <div className="text-2xl font-bold mb-4">Buyurtmani tahrirlash</div>
      {loading ? (
        <div className="w-full h-[80vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
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
                                '[placeholder="Kontragent qidirish yoki yaratish..."]'
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
                                  : "opacity-0"
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
              <Label htmlFor="orderPrice">Buyurtma narxi</Label>
              <Input
                type="number"
                id="orderPrice"
                placeholder="Buyurtma narxi"
                value={payload.price}
                min={0}
                step={0.01}
                className="bg-white"
                required
                onChange={(e) => {
                  setPayload({ ...payload, price: e.target.value });
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="orderRasxod">Rasxod</Label>
              <Input
                type="number"
                id="orderRasxod"
                placeholder="Rasxod"
                value={payload.rasxod}
                min={0}
                step={0.01}
                className="bg-white"
                required
                onChange={(e) => {
                  setPayload({ ...payload, rasxod: e.target.value });
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="orderStartDate">Boshlanish sanasi</Label>
              <Input
                type="date"
                id="orderStartDate"
                placeholder="Boshlanish sanasi"
                value={payload.start_date}
                className="bg-white"
                onChange={(e) => {
                  setPayload({ ...payload, start_date: e.target.value });
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="orderEndDate">Tugash sanasi</Label>
              <Input
                type="date"
                id="orderEndDate"
                placeholder="Tugash sanasi"
                value={payload.end_date}
                min={payload.start_date}
                className="bg-white"
                onChange={(e) => {
                  setPayload({ ...payload, end_date: e.target.value });
                }}
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
                              setPayload({
                                ...payload,
                                model: {
                                  ...model,
                                  sizesList: model.sizes,
                                  sizes: [
                                    {
                                      id: "",
                                      quantity: "",
                                      color: {
                                        id: null,
                                        name: "",
                                        isNew: false,
                                      },
                                    },
                                  ],
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
                                model.id === payload.model.id
                                  ? "opacity-100"
                                  : "opacity-0"
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
                    {payload.material?.name || "Material tanlang"}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Materialni qidirish..." />
                    <CommandList>
                      <CommandEmpty>Material topilmadi</CommandEmpty>
                      <CommandGroup>
                        {materials.map((material) => (
                          <CommandItem
                            key={material.id}
                            value={material.name}
                            onSelect={() => {
                              setPayload({
                                ...payload,
                                material: material,
                                model: {
                                  ...payload.model,
                                  material_id: material.id,
                                },
                              });
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
                                material.id === payload.material?.id
                                  ? "opacity-100"
                                  : "opacity-0"
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
                          setPayload({
                            ...payload,
                            model: {
                              ...payload.model,
                              submodels: payload.model.submodels?.includes(
                                submodel.id
                              )
                                ? payload.model.submodels?.filter(
                                    (id) => id !== submodel.id
                                  )
                                : [
                                    ...(payload.model.submodels?.filter(
                                      (id) => id
                                    ) || []),
                                    submodel.id,
                                  ],
                            },
                          });
                        }}
                      >
                        {submodel.name}
                      </Button>
                    </div>
                  ))}
              </div>

              {/* Sizes section */}
              <div className="mt-4 flex flex-col gap-4">
                <div className="font-medium">O'lcham va ranglar</div>
                {payload?.model?.sizes?.map((size, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {/* Size selection */}
                    <Select
                      value={size.id?.toString() || ""}
                      onValueChange={(value) => {
                        const selectedSize = payload.model.sizesList.find(
                          (s) => s.id === Number.parseInt(value)
                        );
                        const newSizes = [...payload.model.sizes];
                        newSizes[index] = {
                          ...newSizes[index],
                          id: Number.parseInt(value),
                          name: selectedSize?.name || "",
                        };
                        setPayload({
                          ...payload,
                          model: {
                            ...payload.model,
                            sizes: newSizes,
                          },
                        });
                      }}
                    >
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="O'lcham tanlang">
                          {size.id
                            ? payload.model.sizesList?.find(
                                (s) => s.id === size.id
                              )?.name ||
                              size.name ||
                              ""
                            : ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {payload.model?.sizesList?.map((sizeItem) => (
                          <SelectItem
                            key={sizeItem.id}
                            value={sizeItem.id.toString()}
                          >
                            {sizeItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Searchable Color selection */}
                    <Popover
                      open={colorOpens[index] || false}
                      onOpenChange={(isOpen) => handleColorOpen(index, isOpen)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={colorOpens[index] || false}
                          className="w-fit justify-between bg-white"
                        >
                          {size.color?.name || "Rang tanlang"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Rang qidirish yoki yaratish..." />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-start"
                                  onClick={() => {
                                    const input = document.querySelector(
                                      '[placeholder="Rang qidirish yoki yaratish..."]'
                                    );
                                    const searchValue = input?.value || "";
                                    if (searchValue.trim()) {
                                      const newColor = {
                                        id: Date.now(), // Temporary ID for local state
                                        name: searchValue.trim(),
                                        isNewlyCreated: true, // Mark as newly created in this session
                                      };

                                      // Add the new color to the colors state
                                      setColors([...colors, newColor]);

                                      const newSizes = [...payload.model.sizes];
                                      newSizes[index] = {
                                        ...newSizes[index],
                                        color: {
                                          ...newColor,
                                          isNew: true,
                                        },
                                      };
                                      setPayload({
                                        ...payload,
                                        model: {
                                          ...payload.model,
                                          sizes: newSizes,
                                        },
                                      });
                                      handleColorOpen(index, false);
                                    }
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Yangi rang yaratish
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {colors.map((color) => (
                                <CommandItem
                                  key={color.id}
                                  value={color.name}
                                  onSelect={() => {
                                    const newSizes = [...payload.model.sizes];
                                    newSizes[index] = {
                                      ...newSizes[index],
                                      color: {
                                        id: color.id,
                                        name: color.name,
                                        isNew: false,
                                        // Preserve the isNewlyCreated flag if this color was created in this session
                                        isNewlyCreated:
                                          color.isNewlyCreated || false,
                                      },
                                    };
                                    setPayload({
                                      ...payload,
                                      model: {
                                        ...payload.model,
                                        sizes: newSizes,
                                      },
                                    });
                                    handleColorOpen(index, false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      size.color?.id === color.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {color.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {size.color?.isNew && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        Yangi
                      </div>
                    )}

                    {/* Quantity input */}
                    <Input
                      type="number"
                      placeholder="Miqdori"
                      className="w-[120px] bg-white"
                      value={size.quantity}
                      onChange={(e) => {
                        const newSizes = [...payload.model.sizes];
                        newSizes[index] = {
                          ...newSizes[index],
                          quantity: Number.parseInt(e.target.value),
                        };
                        setPayload({
                          ...payload,
                          model: {
                            ...payload.model,
                            sizes: newSizes,
                          },
                        });
                      }}
                    />

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newSizes = payload.model.sizes.filter(
                          (_, i) => i !== index
                        );
                        setPayload({
                          ...payload,
                          model: {
                            ...payload.model,
                            sizes: newSizes,
                          },
                        });
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}

                {/* sum of quantity */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Jami:</span>
                  <span className="text-lg font-semibold">
                    {payload.model.sizes.reduce(
                      (sum, size) =>
                        sum + (Number.parseInt(size.quantity) || 0),
                      0
                    )}
                  </span>
                </div>

                {/* Add new size button */}
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-fit"
                  onClick={() => {
                    setPayload({
                      ...payload,
                      model: {
                        ...payload.model,
                        sizes: [
                          ...payload.model.sizes,
                          {
                            id: "",
                            quantity: "",
                            color: {
                              id: null,
                              name: "",
                              isNew: false,
                            },
                          },
                        ],
                      },
                    });
                  }}
                >
                  <Plus />
                  Qo'shish
                </Button>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button type="submit" className="mt-4" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yangilanmoqda...
                </>
              ) : (
                <>
                  <Save />
                  Yangilash
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default EditOrder;
