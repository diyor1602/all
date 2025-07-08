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

const NewOrder = () => {
  const { toast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [models, setModels] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

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
    },
    contragent_id: "",
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the payload in the required format
    // Calculate total quantity from all sizes
    const sizes =
      payload.model.sizes
        ?.map((size) => ({
          id: size.id,
          quantity: parseInt(size.quantity) || 0,
          color_id: size.color_id,
        }))
        .filter((size) => size.id && size.quantity > 0) || [];

    const totalQuantity = sizes.reduce(
      (sum, size) => sum + (size.quantity || 0),
      0
    );

    const formattedPayload = {
      name: payload.name,
      quantity: totalQuantity, // Use calculated total quantity
      price: payload.price,
      start_date: payload.start_date,
      end_date: payload.end_date,
      rasxod: payload.rasxod,
      comment: payload.comment,
      model: {
        id: payload.model.id,
        material_id: payload.material?.id || "",
        submodels:
          payload.model.submodels
            ?.map((submodel) =>
              typeof submodel === "object" ? submodel.id : submodel
            )
            .filter(Boolean) || [],
        sizes: sizes,
      },
      contragent_id: payload.contragent_id,
    };

    setIsSending(true);
    try {
      await api.post("/orderManager/orders", formattedPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli yaratildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
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
      <div className="text-2xl font-semibold mb-4">Yangi buyurtma yaratish</div>
      {loading ? (
        <div className="w-full h-[90vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="orderContragent">Kontragent</Label>
              <Select
                value={payload.contragent_id?.toString()}
                onValueChange={(value) => {
                  setPayload((prev) => ({
                    ...prev,
                    contragent_id: parseInt(value) || "",
                  }));
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Kontragent tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {contragents.map((contragent) => (
                    <SelectItem
                      key={contragent.id}
                      value={contragent.id.toString()}
                      className="capitalize"
                    >
                      {contragent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                required
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
                required
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
                    className="justify-between"
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
                                  sizesList: model.sizes, // Store available sizes for selection
                                  sizes: [
                                    {
                                      id: "",
                                      quantity: "",
                                      color_id: "",
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
                                model === payload.model
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
                    className="justify-between"
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
                              setPayload({ ...payload, material: material });
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
                                material === payload.material
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
                          payload.submodels?.includes(submodel.id)
                            ? "default"
                            : "outline"
                        }
                        type="button"
                        onClick={() => {
                          setPayload({
                            ...payload,
                            submodels: payload.submodels?.includes(submodel.id)
                              ? payload.submodels?.filter(
                                  (id) => id !== submodel.id
                                )
                              : [
                                  ...(payload.submodels?.filter((id) => id) ||
                                    []),
                                  submodel.id,
                                ],
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
                      value={size.id}
                      onValueChange={(value) => {
                        const selectedSize = payload.model.sizesList.find(
                          (s) => s.id === parseInt(value)
                        );
                        const newSizes = [...payload.model.sizes];
                        newSizes[index] = {
                          ...newSizes[index],
                          id: parseInt(value),
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
                              )?.name || ""
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

                    {/* Color selection */}
                    <Select
                      value={size.color_id}
                      onValueChange={(value) => {
                        const selectedColor = colors.find(
                          (c) => c.id === parseInt(value)
                        );
                        const newSizes = [...payload.model.sizes];
                        newSizes[index] = {
                          ...newSizes[index],
                          color_id: parseInt(value),
                          color_name: selectedColor?.name || "",
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
                        <SelectValue placeholder="Rang tanlang">
                          {size.color_id
                            ? colors?.find((c) => c.id === size.color_id)
                                ?.name || ""
                            : ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {colors?.map((color) => (
                          <SelectItem
                            key={color.id}
                            value={color.id.toString()}
                          >
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Quantity input */}
                    <Input
                      type="number"
                      placeholder="Miqdori"
                      min="1"
                      className="w-[120px] bg-white"
                      value={size.quantity}
                      onChange={(e) => {
                        const newSizes = [...payload.model.sizes];
                        newSizes[index] = {
                          ...newSizes[index],
                          quantity: parseInt(e.target.value) || 0,
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
                            color_id: "",
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
