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
  DollarSign,
  ArrowLeft,
  Loader2,
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
import { useNavigate, useParams } from "react-router-dom";

const EditOrder = () => {
  const { id } = useParams();
  const [materials, setMaterials] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [contragentsOpen, setContragentsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedContragent, setSelectedContragent] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [contragentInput, setContragentInput] = useState("");
  const [isNewContragent, setIsNewContragent] = useState(false);
  const [filteredContragents, setFilteredContragents] = useState([]);
  const [currentTab, setCurrentTab] = useState("general");

  // New states for submodels and sizes
  const [selectedSubmodels, setSelectedSubmodels] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sizesWithQuantity, setSizesWithQuantity] = useState([]);
  const [order, setOrder] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    quantity: 1,
    start_date: "",
    end_date: "",
    rasxod: "",
    comment: "-",
    model_id: null,
    material_id: null,
    contragent_id: null,
    contragent_name: "",
  });

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orderManager/orders/${id}`);
        setOrder(response.data);

        // Set form data
        const orderData = response.data;
        setFormData({
          name: orderData.name || "",
          price: orderData.price || 0,
          quantity: orderData.quantity || 1,
          start_date: orderData.start_date
            ? orderData.start_date.split(" ")[0]
            : "",
          end_date: orderData.end_date ? orderData.end_date.split(" ")[0] : "",
          rasxod: orderData.rasxod || "",
          comment: orderData.comment || "-",
          model_id: orderData.order_model?.model?.id || null,
          material_id: orderData.order_model?.material?.id || null,
          contragent_id: orderData.contragent?.id || null,
          contragent_name: "",
        });

        // Set selected contragent
        if (orderData.contragent) {
          setSelectedContragent(orderData.contragent);
          setContragentInput(orderData.contragent.name);
        }
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Buyurtma ma'lumotlarini yuklashda xatolik yuz berdi",
          variant: "destructive",
        });
        navigate("/technolog/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, toast]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orderManager/models");
      const modelData = response.data || [];

      // Set selected model after fetching models
      if (order?.order_model?.model) {
        const model = modelData.find(
          (m) => m.id === order.order_model.model.id
        );
        if (model) {
          setSelectedModel(model);

          // Set selected submodels if available
          if (order.order_model.submodels && model.submodels) {
            const submodelsToSelect = order.order_model.submodels
              .map((sm) => {
                return model.submodels.find(
                  (submodel) => submodel.id === sm.submodel.id
                );
              })
              .filter(Boolean);

            setSelectedSubmodels(submodelsToSelect);
          }

          // Set selected sizes if available - all sizes from original order must be included
          if (order.order_model.sizes && model.sizes) {
            const sizesToSelect = order.order_model.sizes
              .map((s) => {
                return model.sizes.find((size) => size.id === s.size.id);
              })
              .filter(Boolean);

            setSelectedSizes(sizesToSelect);

            // Set sizes with quantities from original order
            const sizesWithQuantityData = order.order_model.sizes.map((s) => ({
              id: s.size.id,
              name: s.size.name,
              quantity: s.quantity || 1,
            }));

            setSizesWithQuantity(sizesWithQuantityData);
          }
        }
      }
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

      // Set selected material after fetching materials
      if (order?.order_model?.material) {
        const material = materialData.find(
          (m) => m.id === order.order_model.material.id
        );
        if (material) {
          setSelectedMaterial(material);
        }
      }
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
    if (order) {
      fetchModels();
      fetchMaterials();
      fetchContragents();
    }
  }, [order]);

  // Reset submodels and sizes when model changes
  useEffect(() => {
    if (selectedModel && !order) {
      // Only reset if not initial load
      setSelectedSubmodels([]);
      setSelectedSizes([]);
      setSizesWithQuantity([]);
    }
  }, [selectedModel, order]);

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

  // Update the handleSizeToggle function to prevent deselection of already selected sizes
  const handleSizeToggle = (size) => {
    // Check if size was in the original order
    const wasInOriginalOrder = order?.order_model?.sizes?.some(
      (s) => s.size.id === size.id
    );

    // If it was in the original order, it shouldn't be toggled (checkbox is disabled)
    if (wasInOriginalOrder) return;

    setSelectedSizes((prev) => {
      // Check if size is already selected
      const isSelected = prev.some((s) => s.id === size.id);

      if (isSelected) {
        // Remove from sizesWithQuantity
        setSizesWithQuantity((prevSizes) =>
          prevSizes.filter((s) => s.id !== size.id)
        );
        // Remove from selected sizes
        return prev.filter((s) => s.id !== size.id);
      } else {
        // Add to sizesWithQuantity with default quantity
        setSizesWithQuantity((prevSizes) => [
          ...prevSizes,
          { id: size.id, name: size.name, quantity: 1 },
        ]);
        // Add to selected sizes
        return [...prev, size];
      }
    });
  };

  // Simplified handleSizeQuantityChange to just update the value
  const handleSizeQuantityChange = (sizeId, quantity) => {
    // Convert to number
    const newQuantity = parseInt(quantity, 10);

    // Update the quantity without restriction
    setSizesWithQuantity((prev) =>
      prev.map((size) =>
        size.id === sizeId ? { ...size, quantity: newQuantity } : size
      )
    );
  };

  // Update the sizes rendering section in the JSX to disable checkboxes for original sizes
  // Replace the existing sizes mapping in the "Mavjud O'lchamlar" section with:
  {
    selectedModel?.sizes.map((size) => {
      // Check if this size was in the original order
      const wasInOriginalOrder = order?.order_model?.sizes?.some(
        (s) => s.size.id === size.id
      );
      const isSelected = selectedSizes.some((s) => s.id === size.id);

      return (
        <div key={size.id} className="flex items-center space-x-2">
          <Checkbox
            id={`size-${size.id}`}
            disabled={wasInOriginalOrder} // Disable if it was in the original order
            checked={isSelected}
            onCheckedChange={() => handleSizeToggle(size)}
          />
          <label
            htmlFor={`size-${size.id}`}
            className={`text-sm font-medium leading-none ${
              wasInOriginalOrder ? "text-gray-600" : ""
            }`}
          >
            {size.name}
            {wasInOriginalOrder && " (tanlangan)"}
          </label>
        </div>
      );
    });
  }

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

    if (isNaN(formData.price) || formData.price <= 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, narxni to'g'ri kiriting",
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

    // Check sizes with quantity is number and greater than 0
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

    // Validate that quantities of original sizes are not decreased
    // and also fix any quantities that are less than original
    let hasDecreasedQuantities = false;
    const correctedSizesWithQuantity = [...sizesWithQuantity]; // Create a copy to make corrections if needed

    order?.order_model?.sizes?.forEach((originalSize) => {
      const updatedSizeIndex = correctedSizesWithQuantity.findIndex(
        (s) => s.id === originalSize.size.id
      );

      if (updatedSizeIndex !== -1) {
        const updatedSize = correctedSizesWithQuantity[updatedSizeIndex];

        if (updatedSize.quantity < originalSize.quantity) {
          hasDecreasedQuantities = true;
          // Correct the quantity to the original value
          correctedSizesWithQuantity[updatedSizeIndex] = {
            ...updatedSize,
            quantity: originalSize.quantity,
          };
        }
      }
    });

    if (hasDecreasedQuantities) {
      // Update the state with corrected quantities
      setSizesWithQuantity(correctedSizesWithQuantity);

      toast({
        title: "Diqqat",
        description:
          "Mavjud o'lchamlar miqdorini kamaytirish mumkin emas! Miqdorlar asl qiymatlarga qaytarildi.",
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
        _method: "PATCH",
        name: formData.name,
        quantity: totalQuantity,
        price: formData.price,
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

      await api.post(`/orderManager/orders/${id}`, orderData);

      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli yangilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      navigate(`/orderManager/orders/${id}`);
    } catch (error) {
      toast({
        title: "Xato",
        description: "Buyurtmani yangilashda xatolik yuz berdi",
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

  if (loading && !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-lg text-gray-600">Yuklanyapti...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-md">
      <CardHeader className="bg-slate-50">
        <div className="flex items-center mb-2">
          <Button
            variant="ghost"
            className="flex items-center text-gray-600 hover:text-blue-600 mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-slate-800">
            <ClipboardList className="inline-block mr-2 mb-1" size={24} />
            Buyurtmani tahrirlash #{id}
          </CardTitle>
        </div>
        <CardDescription>
          Quyidagi formani to'ldirish orqali buyurtmani yangilang
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} className="w-full">
            <TabsList className="overflow-x-auto w-full flex justify-start">
              <TabsTrigger
                value="general"
                onClick={() => setCurrentTab("general")}
              >
                Asosiy Ma'lumotlar
              </TabsTrigger>
              <TabsTrigger value="model" onClick={() => setCurrentTab("model")}>
                Model va Material
              </TabsTrigger>
              <TabsTrigger value="sizes" onClick={() => setCurrentTab("sizes")}>
                O'lchamlar va Miqdorlar
              </TabsTrigger>
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
                    <Label htmlFor="price" className="font-medium">
                      <DollarSign
                        className="inline-block mr-2 mb-1"
                        size={16}
                      />
                      Buyurtma Narxi (
                      {formData.price
                        ? parseFloat(formData.price).toLocaleString("en-EN")
                        : ""}{" "}
                      $)
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step={0.001}
                      placeholder="Buyurtma narxini kiriting"
                      value={formData.price}
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
                      {formData.rasxod
                        ? parseFloat(formData.rasxod).toLocaleString("en-EN")
                        : ""}{" "}
                      $)
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
                      Model:
                    </Label>
                    <div className="font-bold">
                      {selectedModel && selectedModel?.name}
                    </div>
                  </div>

                  {selectedModel &&
                    selectedModel.submodels &&
                    selectedModel.submodels.length > 0 && (
                      <div className="space-y-2 bg-slate-50 p-4 rounded-md">
                        <Label className="font-medium">
                          <Tag className="inline-block mr-2 mb-1" size={16} />
                          Sub-modellar:
                        </Label>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {selectedModel.submodels.map((submodel) => (
                            <div
                              key={submodel.id}
                              className="bg-slate-200 px-2 py-1 rounded-md"
                            >
                              {submodel.name}
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
                            ? selectedMaterial.name
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
                          {parseFloat(selectedModel.rasxod).toLocaleString(
                            "en-EN"
                          ) || "-"}{" "}
                          so'm
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
                        {selectedModel.sizes.map((size) => {
                          // Check if this size was in the original order
                          const wasInOriginalOrder =
                            order?.order_model?.sizes?.some(
                              (s) => s.size.id === size.id
                            );
                          const isSelected = selectedSizes.some(
                            (s) => s.id === size.id
                          );

                          return (
                            <div
                              key={size.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`size-${size.id}`}
                                disabled={wasInOriginalOrder} // Disable if it was in the original order
                                checked={isSelected}
                                onCheckedChange={() => handleSizeToggle(size)}
                              />
                              <label
                                htmlFor={`size-${size.id}`}
                                className={`text-sm font-medium leading-none ${
                                  wasInOriginalOrder ? "text-gray-600" : ""
                                }`}
                              >
                                {size.name}
                                {wasInOriginalOrder && " (tanlangan)"}
                              </label>
                            </div>
                          );
                        })}
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

          <div className="mt-8 flex justify-between gap-3 items-center flex-wrap">
            <div>
              {selectedModel && selectedSizes.length > 0 && (
                <div className="bg-blue-50 rounded-md px-4 py-2 text-blue-800">
                  <span className="font-medium">Jami:</span> {totalQuantity}{" "}
                  dona
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/orderManager/orders/${id}`)}
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
                {submitting ? "Yuborilmoqda..." : "Buyurtmani yangilash"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditOrder;
