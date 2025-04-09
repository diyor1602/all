import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronsUpDown,
  Calendar,
  Package,
  User,
  FileText,
  ClipboardList,
  Search,
  PlusCircle,
  Tag,
  Ruler,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const NewOrder = () => {
  const [models, setModels] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [contragentsOpen, setContragentsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedContragent, setSelectedContragent] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [contragentInput, setContragentInput] = useState("");
  const [isNewContragent, setIsNewContragent] = useState(false);
  const [filteredContragents, setFilteredContragents] = useState([]);

  // New states for submodels and sizes
  const [selectedSubmodels, setSelectedSubmodels] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sizesWithQuantity, setSizesWithQuantity] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    start_date: "",
    end_date: "",
    rasxod: "",
    comment: "",
    model_id: null,
    material_id: null,
    contragent_id: null,
    contragent_name: "",
  });

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orderManager/models");
      const modelData = response.data || [];
      setModels(modelData);
    } catch (error) {
      toast({
        title: "Xato",
        description: "Modellarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orderManager/materials");
      const materialData = response.data || [];
      setMaterials(materialData);
    } catch (error) {
      toast({
        title: "Xato",
        description: "Materiallarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContragents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orderManager/contragents");
      const contragentData = response.data || [];
      setContragents(contragentData);
      setFilteredContragents(contragentData);
    } catch (error) {
      toast({
        title: "Xato",
        description: "Kontragentlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchMaterials();
    fetchContragents();
  }, []);

  // Reset submodels and sizes when model changes
  useEffect(() => {
    if (selectedModel) {
      setSelectedSubmodels([]);
      setSelectedSizes([]);
      setSizesWithQuantity([]);
    }
  }, [selectedModel]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleContragentInputChange = (value) => {
    setContragentInput(value);
    setFormData({
      ...formData,
      contragent_name: value,
    });

    if (value.trim() === "") {
      setFilteredContragents(contragents);
      setIsNewContragent(false);
      return;
    }

    const filtered = contragents.filter((c) =>
      c.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredContragents(filtered);
    setIsNewContragent(filtered.length === 0);
  };

  const handleSelectContragent = (contragent) => {
    setSelectedContragent(contragent);
    setContragentInput(contragent.name);
    setFormData({
      ...formData,
      contragent_id: contragent.id,
      contragent_name: "",
    });
    setIsNewContragent(false);
    setContragentsOpen(false);
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    setModelsOpen(false);
    setFormData({
      ...formData,
      model_id: model.id,
    });
  };

  const handleSubmodelToggle = (submodel) => {
    setSelectedSubmodels((prev) => {
      const isSelected = prev.some((sm) => sm.id === submodel.id);
      if (isSelected) {
        return prev.filter((sm) => sm.id !== submodel.id);
      } else {
        return [...prev, submodel];
      }
    });
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes((prev) => {
      // Check if size is already selected
      const isSelected = prev.some((s) => s.id === size.id);

      if (isSelected) {
        setSizesWithQuantity((prevSizes) =>
          prevSizes.filter((s) => s.id !== size.id)
        );
        return prev.filter((s) => s.id !== size.id);
      } else {
        // Add to sizesWithQuantity with default quantity
        setSizesWithQuantity((prevSizes) => [
          ...prevSizes,
          { id: size.id, name: size.name, quantity: 1 },
        ]);
        return [...prev, size];
      }
    });
  };

  const handleSizeQuantityChange = (sizeId, quantity) => {
    setSizesWithQuantity((prev) =>
      prev.map((size) =>
        size.id === sizeId ? { ...size, quantity: parseInt(quantity) } : size
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedModel) {
      toast({
        title: "Diqqat",
        description: "Iltimos, modelni tanlang",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMaterial) {
      toast({
        title: "Diqqat",
        description: "Iltimos, materialni tanlang",
        variant: "destructive",
      });
      return;
    }

    if (selectedSizes.length === 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, kamida bitta o'lchamni tanlang",
        variant: "destructive",
      });
      return;
    }

    if (selectedSubmodels.length === 0 && selectedModel.submodels?.length > 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, kamida bitta sub-modelni tanlang",
        variant: "destructive",
      });
      return;
    }

    // check sizes with quantity is number and greater than 0
    if (
      sizesWithQuantity.some(
        (size) => isNaN(size.quantity) || size.quantity <= 0
      )
    ) {
      toast({
        title: "Diqqat",
        description: "Iltimos, miqdorni to'g'ri kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!formData.contragent_id && !formData.contragent_name) {
      toast({
        title: "Diqqat",
        description:
          "Iltimos, kontragentni tanlang yoki yangi kontragent nomini kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Calculate total quantity from sizes
      const totalQuantity = sizesWithQuantity.reduce(
        (sum, size) => sum + size.quantity,
        0
      );

      // Prepare the submission data
      const orderData = {
        name: formData.name,
        quantity: totalQuantity,
        start_date: formData.start_date,
        end_date: formData.end_date,
        rasxod: formData.rasxod,
        comment: formData.comment,
        model: {
          id: selectedModel.id,
          material_id: selectedMaterial.id,
          submodels: selectedSubmodels.map((sm) => sm.id),
          sizes: sizesWithQuantity.map((size) => ({
            id: size.id,
            quantity: size.quantity,
          })),
        },
      };

      // Handle contragent (existing or new)
      if (selectedContragent && !isNewContragent) {
        orderData.contragent_id = selectedContragent.id;
      } else if (contragentInput.trim() !== "") {
        orderData.contragent_name = contragentInput;
      }

      const response = await api.post("/orderManager/orders", orderData);

      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli yaratildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      navigate(`/orderManager/orders/${response.data.order.id}`);
    } catch (error) {
      toast({
        title: "Xato",
        description: "Buyurtmani yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total quantity from selected sizes
  const totalQuantity = sizesWithQuantity.reduce(
    (sum, size) => sum + size.quantity,
    0
  );

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-md">
      <CardHeader className="bg-slate-50">
        <CardTitle className="text-2xl font-bold text-slate-800">
          <ClipboardList className="inline-block mr-2 mb-1" size={24} />
          Yangi Buyurtma
        </CardTitle>
        <CardDescription>
          Quyidagi formani to'ldirish orqali yangi buyurtma yarating
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="overflow-x-auto w-full flex justify-start">
              <TabsTrigger value="general">Asosiy Ma'lumotlar</TabsTrigger>
              <TabsTrigger value="model">Model va Material</TabsTrigger>
              <TabsTrigger value="sizes">O'lchamlar va Miqdorlar</TabsTrigger>
            </TabsList>

            {/* Tab 1: General Information */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      <FileText className="inline-block mr-2 mb-1" size={16} />
                      Buyurtma Nomi
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Buyurtma nomini kiriting"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="font-medium">
                      <Calendar className="inline-block mr-2 mb-1" size={16} />
                      Boshlanish Sanasi
                    </Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="font-medium">
                      <Calendar className="inline-block mr-2 mb-1" size={16} />
                      Tugash Sanasi
                    </Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">
                      <User className="inline-block mr-2 mb-1" size={16} />
                      Kontragent
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Kontragentni qidiring yoki yangi kontragent qo'shing..."
                        value={contragentInput}
                        onChange={(e) =>
                          handleContragentInputChange(e.target.value)
                        }
                        className="w-full pr-10"
                        onClick={() => setContragentsOpen(true)}
                      />
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                    </div>

                    {contragentsOpen && (
                      <div className="absolute z-10 w-full max-w-md bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                        <div className="p-2">
                          {filteredContragents.length > 0 && (
                            <div className="text-xs font-medium text-gray-500 mb-2 pl-2">
                              Mavjud Kontragentlar
                            </div>
                          )}

                          {filteredContragents.map((contragent) => (
                            <div
                              key={contragent.id}
                              className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                              onClick={() => handleSelectContragent(contragent)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedContragent?.id === contragent.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div>
                                <div>{contragent.name}</div>
                                {contragent.description && (
                                  <div className="text-xs text-gray-500">
                                    {contragent.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {contragentInput.trim() !== "" && (
                            <>
                              {filteredContragents.length > 0 && (
                                <Separator className="my-2" />
                              )}
                              <div
                                className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                                onClick={() => {
                                  setIsNewContragent(true);
                                  setFormData({
                                    ...formData,
                                    contragent_id: null,
                                    contragent_name: contragentInput,
                                  });
                                  setContragentsOpen(false);
                                }}
                              >
                                <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
                                <div>
                                  <div className="text-blue-600">
                                    Yangi kontragent yaratish
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    "{contragentInput}"
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {isNewContragent && (
                      <div className="text-sm text-blue-600 mt-1 flex items-center">
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Yangi kontragent yaratilmoqda: "{contragentInput}"
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rasxod" className="font-medium">
                      Rasxod (
                      {parseFloat(formData.rasxod).toLocaleString("ru-RU")})
                    </Label>
                    <Input
                      id="rasxod"
                      name="rasxod"
                      placeholder="Rasxodni kiriting"
                      value={formData.rasxod}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment" className="font-medium">
                      <FileText className="inline-block mr-2 mb-1" size={16} />
                      Izohlar
                    </Label>
                    <Textarea
                      id="comment"
                      name="comment"
                      placeholder="Qo'shimcha izohlarni kiriting..."
                      value={formData.comment}
                      onChange={handleInputChange}
                      className="w-full min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Model and Material Selection */}
            <TabsContent value="model" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Models Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">
                      <Package className="inline-block mr-2 mb-1" size={16} />
                      Modelni Tanlang
                    </Label>
                    <Popover open={modelsOpen} onOpenChange={setModelsOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={modelsOpen}
                          className="w-full justify-between"
                        >
                          {selectedModel
                            ? models.find(
                                (model) => model.id === selectedModel.id
                              )?.name
                            : "Modelni tanlang"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Modellarni qidirish..." />
                          <CommandList>
                            <CommandEmpty>Modellar topilmadi.</CommandEmpty>
                            <CommandGroup>
                              {models.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.id}
                                  onSelect={() => handleSelectModel(model)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedModel?.id === model.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col gap-1 cursor-pointer">
                                    <div>{model?.name}</div>
                                    <div className="text-gray-500 text-xs flex items-center">
                                      <span className="mr-2">
                                        Rasxod:{" "}
                                        {model?.rasxod || "Ko'rsatilmagan"}
                                      </span>
                                      {model?.submodels?.length > 0 && (
                                        <Badge
                                          variant="outline"
                                          className="mr-1"
                                        >
                                          {model.submodels.length} ta sub-model
                                        </Badge>
                                      )}
                                      {model?.sizes?.length > 0 && (
                                        <Badge variant="outline">
                                          {model.sizes.length} ta o'lcham
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedModel &&
                    selectedModel.submodels &&
                    selectedModel.submodels.length > 0 && (
                      <div className="space-y-2 bg-slate-50 p-4 rounded-md">
                        <Label className="font-medium">
                          <Tag className="inline-block mr-2 mb-1" size={16} />
                          Sub-modellarni Tanlang
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {selectedModel.submodels.map((submodel) => (
                            <div
                              key={submodel.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`submodel-${submodel.id}`}
                                checked={selectedSubmodels.some(
                                  (sm) => sm.id === submodel.id
                                )}
                                onCheckedChange={() =>
                                  handleSubmodelToggle(submodel)
                                }
                              />
                              <label
                                htmlFor={`submodel-${submodel.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {submodel.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Materials Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">
                      <Package className="inline-block mr-2 mb-1" size={16} />
                      Materialni Tanlang
                    </Label>
                    <Popover
                      open={materialsOpen}
                      onOpenChange={setMaterialsOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={materialsOpen}
                          className="w-full justify-between"
                        >
                          {selectedMaterial
                            ? materials.find(
                                (material) =>
                                  material.id === selectedMaterial.id
                              )?.name
                            : "Materialni tanlang"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Materiallarni qidirish..." />
                          <CommandList>
                            <CommandEmpty>Materiallar topilmadi.</CommandEmpty>
                            <CommandGroup>
                              {materials.map((material) => (
                                <CommandItem
                                  key={material.id}
                                  value={material.id}
                                  onSelect={() => {
                                    setSelectedMaterial(material);
                                    setMaterialsOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedMaterial?.id === material.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col gap-1">
                                    <div>{material?.name}</div>
                                    <div className="text-gray-500">
                                      {material?.description}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedModel && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                        <FileText className="inline-block mr-2" size={16} />
                        Model Ma'lumotlari
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Nomi:</span>{" "}
                          {selectedModel.name}
                        </p>
                        <p>
                          <span className="font-medium">Rasxod:</span>{" "}
                          {selectedModel.rasxod || "Ko'rsatilmagan"}
                        </p>
                        <p>
                          <span className="font-medium">Sub-modellar:</span>{" "}
                          {selectedModel.submodels &&
                          selectedModel.submodels.length > 0
                            ? `${selectedModel.submodels.length} ta`
                            : "Yo'q"}
                        </p>
                        <p>
                          <span className="font-medium">O'lchamlar:</span>{" "}
                          {selectedModel.sizes && selectedModel.sizes.length > 0
                            ? `${selectedModel.sizes.length} ta`
                            : "Yo'q"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Sizes and Quantities */}
            <TabsContent value="sizes" className="space-y-6">
              {!selectedModel ? (
                <div className="text-center p-6 bg-amber-50 rounded-md">
                  <p className="text-amber-600 font-medium">
                    Iltimos, avval modelni tanlang
                  </p>
                </div>
              ) : selectedModel.sizes && selectedModel.sizes.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium flex items-center">
                      <Ruler className="inline-block mr-2" size={16} />
                      O'lchamlarni Tanlang va Miqdorlarni Kiriting
                    </Label>
                    {selectedSizes.length > 0 && (
                      <Badge variant="secondary" className="px-2 py-1">
                        {selectedSizes.length} ta o'lcham tanlangan
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3 bg-slate-50">
                      <h3 className="font-medium mb-3">Mavjud O'lchamlar</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1">
                        {selectedModel.sizes.map((size) => (
                          <div
                            key={size.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`size-${size.id}`}
                              checked={selectedSizes.some(
                                (s) => s.id === size.id
                              )}
                              onCheckedChange={() => handleSizeToggle(size)}
                            />
                            <label
                              htmlFor={`size-${size.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {size.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-md p-3">
                      <h3 className="font-medium mb-3">
                        Tanlangan o'lchamlar uchun miqdorlar
                      </h3>
                      {selectedSizes.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          Hali o'lchamlar tanlanmagan
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                          {sizesWithQuantity.map((size) => (
                            <div
                              key={size.id}
                              className="flex items-center space-x-3"
                            >
                              <span className="text-sm font-medium min-w-[80px]">
                                {size.name}:
                              </span>
                              <Input
                                type="number"
                                value={size.quantity}
                                onChange={(e) =>
                                  handleSizeQuantityChange(
                                    size.id,
                                    e.target.value
                                  )
                                }
                                className="w-24"
                              />
                              <span className="text-sm text-gray-500">
                                dona
                              </span>
                            </div>
                          ))}

                          <div className="pt-2 mt-3 border-t">
                            <div className="flex justify-between items-center font-medium">
                              <span>Jami:</span>
                              <span>{totalQuantity} dona</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p className="text-gray-600">
                    Bu modelda o'lchamlar mavjud emas
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-between gap-2 flex-wrap">
            <div>
              {selectedModel && selectedSizes.length > 0 && (
                <div className="bg-blue-50 rounded-md px-4 py-2 text-blue-800">
                  <span className="font-medium">Jami:</span> {totalQuantity}{" "}
                  dona
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Reset form
                  setFormData({
                    name: "",
                    quantity: 1,
                    start_date: "",
                    end_date: "",
                    rasxod: "",
                    comment: "",
                    model_id: null,
                    material_id: null,
                    contragent_id: null,
                    contragent_name: "",
                  });
                  setSelectedModel(null);
                  setSelectedMaterial(null);
                  setSelectedContragent(null);
                  setContragentInput("");
                  setSelectedSubmodels([]);
                  setSelectedSizes([]);
                  setSizesWithQuantity([]);
                }}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  loading ||
                  !selectedModel ||
                  selectedSizes.length === 0
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "Yuborilmoqda..." : "Buyurtma yaratish"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewOrder;
