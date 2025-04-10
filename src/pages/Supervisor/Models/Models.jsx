import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package2,
  Image as ImageIcon,
  Ruler,
  RefreshCw,
  PlusCircle,
  Edit,
  Search,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import { useNavigate } from "react-router-dom";
import NoImage from "/noimage.png";

const Models = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubmodelNames, setActiveSubmodelNames] = useState([]);
  const [allSubmodels, setAllSubmodels] = useState([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openModelMap, setOpenModelMap] = useState({});

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await api.get("/supervisor/models");
      const modelData = response.data || [];
      setModels(modelData);
      setFilteredModels(modelData);

      // Extract all unique submodel names
      const submodelNames = new Set();
      modelData.forEach((model) => {
        (model.submodels || []).forEach((submodel) => {
          if (submodel && submodel.name) {
            submodelNames.add(submodel.name);
          }
        });
      });

      // Convert to array of objects for easier use in the UI
      const uniqueSubmodels = Array.from(submodelNames).map((name) => ({
        name: name,
      }));
      setAllSubmodels(uniqueSubmodels);
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

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    filterModels();
  }, [searchTerm, activeSubmodelNames, models]);

  // const handleDownload = async (modelId) => {
  //   console.log("Downloading");
  // };

  const handleToggleImage = (modelId) => {
    // Update the open state map for this specific model
    setOpenModelMap((prevState) => ({
      ...prevState,
      [modelId]: !prevState[modelId], // Toggle the state for only this model
    }));
  };
  const filterModels = () => {
    let filtered = [...models];

    // Filter by search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (model) =>
          (model.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (model.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by active submodel names - show models that have ALL selected submodels
    if (activeSubmodelNames.length > 0) {
      filtered = filtered.filter((model) => {
        const modelSubmodelNames = (model.submodels || []).map(
          (sm) => sm.name || ""
        );

        // Check if ALL selected submodel names are in this model
        return activeSubmodelNames.every((activeName) =>
          modelSubmodelNames.includes(activeName)
        );
      });
    }

    setFilteredModels(filtered);
  };

  const handleToggleSubmodel = (submodelName) => {
    if (activeSubmodelNames.includes(submodelName)) {
      setActiveSubmodelNames(
        activeSubmodelNames.filter((name) => name !== submodelName)
      );
    } else {
      setActiveSubmodelNames([...activeSubmodelNames, submodelName]);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSubmodelNames([]);
  };

  const ModelCard = ({ model }) => {
    if (!model) return null;

    return (
      <Card className="bg-white hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 h-fit max-w-[330px] md:max-w-full w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Package2 className="text-blue-500" />
              {model.name || "Nomsiz model"}
            </div>
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col gap-1">
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                    {parseFloat(model?.rasxod)?.toLocaleString("ru-RU") || "0"}{" "}
                    so'm
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                    {(parseFloat(model?.rasxod) / 250)?.toLocaleString(
                      "ru-RU"
                    ) || "0"}{" "}
                    daqiqa
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Patok uchun ajratiladigan summa</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="text-gray-600">{model?.description || ""}</div>
          <div className="flex justify-start space-x-2 mt-2 mb-4 gap-2">
            {/* <Button
              variant="outline"
              size="sm"
              className="border-blue-200 hover:bg-blue-50 flex items-center gap-1"
              disabled={isDownloading}
              onClick={() => handleDownload(model.id)}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  Yuklab olinmoqda...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-blue-600" />
                  Yuklab olish
                </>
              )}
            </Button> */}
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 hover:bg-blue-50 flex items-center gap-1"
              onClick={() => navigate(`/supervisor/models/edit/${model.id}`)}
            >
              <Edit className="h-4 w-4 text-blue-600" />
              Tahrirlash
            </Button>
          </div>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="sizes" className="border-b border-blue-100">
              <AccordionTrigger className="flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Ruler className="text-purple-500" />
                  <span className="font-medium">
                    O'lchamlar ({(model.sizes || []).length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                {(model.sizes || []).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                    {(model.sizes || []).map((size) => (
                      <Badge
                        key={size?.id || Math.random()}
                        variant="outline"
                        className="text-center py-1 border-purple-200 bg-purple-50"
                      >
                        {size?.name || "O'lcham"}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic px-3">
                    O'lchamlar mavjud emas
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="submodels"
              className="border-b border-blue-100"
            >
              <AccordionTrigger className="hover:bg-blue-50 px-3 py-2 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Package2 className="text-green-500" />
                  <span className="font-medium">
                    Submodellar ({(model.submodels || []).length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                {(model.submodels || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(model.submodels || []).map((submodel) => (
                      <Badge
                        key={submodel?.id || Math.random()}
                        className="bg-green-100 text-green-700 py-1"
                      >
                        {submodel?.name || "Kichik model"}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic px-3">
                    Submodellar mavjud emas
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="images">
              <AccordionTrigger
                className="hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
                onClick={() => handleToggleImage(model.id)}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-rose-500" />
                  <span className="font-medium">
                    Rasmlar ({(model.images || []).length})
                  </span>
                </div>
              </AccordionTrigger>
              {openModelMap[model.id] ? (
                (model.images || []).length > 0 ? (
                  (model.images || []).length > 2 ? (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {(model.images || []).map((img) => (
                          <CarouselItem
                            key={img?.id || Math.random()}
                            className="md:basis-1/4"
                          >
                            <div className="p-1">
                              <div
                                className="relative aspect-square overflow-hidden rounded-xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                              >
                                <img
                                  src={img?.image || NoImage}
                                  loading="lazy"
                                  alt={model.name || "Model rasmi"}
                                  className="object-cover w-full h-full transition-transform hover:scale-105 duration-300 cursor-pointer"
                                  onError={(e) => {
                                    e.target.src = NoImage;
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedImage(img?.image || NoImage);
                                    setImageDialogOpen(true);
                                    return false;
                                  }}
                                />
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {(model.images || []).map((img) => (
                        <div
                          key={img?.id || Math.random()}
                          className="relative aspect-square"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <img
                            src={img?.image || NoImage}
                            loading="lazy"
                            alt={model.name || "Model rasmi"}
                            className="rounded-lg object-cover w-full h-full hover:opacity-90 transition-opacity cursor-pointer"
                            onError={(e) => {
                              e.target.src = NoImage;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setSelectedImage(img?.image || NoImage);
                              setImageDialogOpen(true);
                              return false;
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-gray-500 text-sm italic px-3">
                    Rasmlar mavjud emas
                  </p>
                )
              ) : null}
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package2 className="text-blue-500" />
              Modellar{" "}
              <span className="text-blue-600">
                ({filteredModels.length}/{(models || []).length})
              </span>
            </h1>
            <p className="text-gray-500 mt-1">Barcha modellar ro'yxati</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/supervisor/models/add")}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Yangi model
            </Button>
            <Button
              onClick={fetchModels}
              variant="outline"
              className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Yangilash
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Model nomi bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-400"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {activeSubmodelNames.length > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
                size="sm"
              >
                Filterni tozalash
                <X className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>

          {allSubmodels.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Submodellar bo'yicha filtrlash:
              </h3>
              <div className="flex flex-wrap gap-2">
                {allSubmodels.map((submodel, index) => (
                  <Badge
                    key={index}
                    className={`py-1 px-3 cursor-pointer ${
                      activeSubmodelNames.includes(submodel.name)
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => handleToggleSubmodel(submodel.name)}
                  >
                    {submodel.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredModels.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-2 border-blue-200 bg-white/80">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Search className="h-16 w-16 text-blue-300" />
              <h3 className="text-2xl font-semibold text-gray-700">
                {models.length === 0
                  ? "Modellar topilmadi"
                  : "Qidiruv bo'yicha natija topilmadi"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {models.length === 0
                  ? "Hozirda mavjud modellar yo'q. Yangi model qo'shish uchun \"Yangi model\" tugmasini bosing."
                  : "Qidiruv mezonlaringizga mos keladigan modellar topilmadi. Boshqa parametrlarni sinab ko'ring yoki filterni tozalang."}
              </p>
              {models.length > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-2"
                >
                  Filterni tozalash
                </Button>
              )}
              {models.length === 0 && (
                <Button
                  onClick={() => navigate("/supervisor/models/add")}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Yangi model qo'shish
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredModels.map((model) => (
              <ModelCard key={model?.id || Math.random()} model={model} />
            ))}
          </div>
        )}
      </div>
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center max-w-[80vw] max-h-[80vh] overflow-auto">
            <img
              src={selectedImage || NoImage}
              className="w-full h-full object-contain"
              alt="Model Image"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Models;
