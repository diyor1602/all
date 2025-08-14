"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Loader2,
  FileUp,
  DollarSign,
  Package,
  Tag,
  Users,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ExcelOrders = () => {
  const [contragents, setContragents] = useState([]);
  const [selectedContragent, setSelectedContragent] = useState("");
  const { toast } = useToast();
  const [formData, setFormData] = useState({ data: [] });
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [overallProgress, setOverallProgress] = useState({
    total: 0,
    success: 0,
    error: 0,
    pending: 0,
    processing: 0,
  });

  // Process incoming data to add unique IDs
  const processImportedData = (data) => {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return { data: [] };
    }

    return {
      ...data,
      data: data.data.map((model, modelIndex) => {
        // Create a unique key for this model to help with React key stability
        const modelKey = `model-${Date.now()}-${modelIndex}`;

        return {
          ...model,
          modelKey,
          // Ensure images is always an array even if it's null or missing
          images: Array.isArray(model.images)
            ? model.images.map((img, imgIndex) => {
                // Extract the filename from the image URL (last part after the last slash)
                const fullUrl = img || "";
                const fileName = fullUrl.split("/").pop() || "";

                return {
                  id: `image-${modelIndex}-${imgIndex}-${Date.now()}`, // Add timestamp for uniqueness
                  url: fullUrl,
                  fileName: fileName,
                };
              })
            : [],
          // Ensure sizes is always an array
          sizes: Array.isArray(model.sizes) ? model.sizes : [],
          // Add safe default values for potentially missing fields
          model: model.model || `model-${modelIndex}`,
          submodel: model.submodel || "",
          price: model.price || 0,
          quantity: model.quantity || 0,
          model_summa: model.model_summa || 0,
        };
      }),
    };
  };

  const fetchContragents = async () => {
    try {
      const response = await api.get("/orderManager/contragents");
      setContragents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kontragentlarni yuklashda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchContragents();
  }, []);

  // Update overall progress whenever submission progress changes
  useEffect(() => {
    if (submissionProgress.length === 0) return;

    const counts = submissionProgress.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    setOverallProgress({
      total: submissionProgress.length,
      success: counts.success || 0,
      error: counts.error || 0,
      pending: counts.pending || 0,
      processing: counts.processing || 0,
    });
  }, [submissionProgress]);

  const sendFile = async (file) => {
    if (!file) return;

    try {
      setFileLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/orderManager/import-orders", formData);

      // Process the data to ensure all fields are safe
      setFormData(processImportedData(response.data));
      setFileLoading(false);

      toast({
        title: "Muvaffaqiyatli",
        description: "Fayl muvaffaqiyatli yuklandi",
      });
    } catch (error) {
      setFileLoading(false);
      toast({
        title: "Xatolik",
        description: "Buyurtmalar Excell faylga yuklashda xatolik",
        variant: "destructive",
      });
    }
  };

  // Handle file drop
  const handleFileDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      sendFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  // Handle image reordering within a model - with improved reliability
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    try {
      // Extract model indices from droppable IDs
      // Format is now "model-{modelIndex}-images"
      const sourceModelIndex = Number.parseInt(
        source.droppableId.split("-")[1]
      );
      const destModelIndex = Number.parseInt(
        destination.droppableId.split("-")[1]
      );

      // Check if indices are valid
      if (isNaN(sourceModelIndex) || isNaN(destModelIndex)) return;
      if (sourceModelIndex < 0 || sourceModelIndex >= formData.data.length)
        return;
      if (destModelIndex < 0 || destModelIndex >= formData.data.length) return;

      // Create a deep copy of formData to prevent mutation issues
      const newFormData = JSON.parse(JSON.stringify(formData));

      // Check if we're moving within the same model
      if (sourceModelIndex === destModelIndex) {
        // Handle reordering within the same model
        const images = [...newFormData.data[sourceModelIndex].images];

        if (source.index >= images.length) return;

        // Reorder images
        const [movedImage] = images.splice(source.index, 1);
        images.splice(destination.index, 0, movedImage);

        // Assign completely new IDs to prevent stale references
        const updatedImages = images.map((img, idx) => ({
          ...img,
          id: `image-${sourceModelIndex}-${idx}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
        }));

        newFormData.data[sourceModelIndex].images = updatedImages;
      } else {
        // Handle moving between models
        const sourceImages = [...newFormData.data[sourceModelIndex].images];
        const destImages = [...newFormData.data[destModelIndex].images];

        if (source.index >= sourceImages.length) return;

        // Move image between models
        const [movedImage] = sourceImages.splice(source.index, 1);
        destImages.splice(destination.index, 0, movedImage);

        // Reassign IDs for both source and destination models
        const updatedSourceImages = sourceImages.map((img, idx) => ({
          ...img,
          id: `image-${sourceModelIndex}-${idx}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
        }));

        const updatedDestImages = destImages.map((img, idx) => ({
          ...img,
          id: `image-${destModelIndex}-${idx}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
        }));

        newFormData.data[sourceModelIndex].images = updatedSourceImages;
        newFormData.data[destModelIndex].images = updatedDestImages;
      }

      // Use a timeout to ensure the state update happens after the current render cycle
      setTimeout(() => {
        setFormData(newFormData);
      }, 0);
    } catch (error) {
      // Refresh the entire formData to reset any inconsistent state
      setFormData((prevData) => JSON.parse(JSON.stringify(prevData)));
    }
  };

  // Assign contragent to a specific model
  const handleModelContragentChange = (modelIndex, contragentId) => {
    if (modelIndex < 0 || modelIndex >= formData.data.length) return;

    const newFormData = { ...formData };
    newFormData.data[modelIndex].contragent_id = contragentId;
    setFormData(newFormData);
  };

  // Prepare data for submission
  const prepareDataForSubmission = () => {
    return formData.data.map((model) => ({
      data: {
        model: model.model,
        submodel: model.submodel,
        price: model.price,
        quantity: model.quantity,
        sizes: model.sizes,
        model_summa: model.model_summa,
        contragent_id: model.contragent_id,
        // Convert our image objects to just filenames for the API
        images: model.images.map((img) => img.fileName),
      },
    }));
  };

  // Submit all models with their assigned contragents - with batch processing
  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Check if all models have contragent assigned
      const allHaveContragent = formData.data.every(
        (model) => model.contragent_id
      );

      if (!allHaveContragent) {
        toast({
          title: "Xatolik",
          description: "Barcha modellarga kontragent biriktiring",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Prepare data for submission
      const submissionData = prepareDataForSubmission();

      // Create progress tracking state
      const progressState = submissionData.map((model, index) => ({
        id: index,
        model: model.data.model,
        submodel: model.data.submodel,
        status: "pending", // pending, success, error, processing
        message: "Kutilmoqda...",
      }));

      setSubmissionProgress(progressState);
      setShowProgressModal(true);

      // Process in batches of 100 requests
      const BATCH_SIZE = 100;
      const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

      for (
        let batchStart = 0;
        batchStart < submissionData.length;
        batchStart += BATCH_SIZE
      ) {
        // Get current batch (up to 20 items)
        const currentBatch = submissionData.slice(
          batchStart,
          Math.min(batchStart + BATCH_SIZE, submissionData.length)
        );

        // Mark all items in this batch as processing
        setSubmissionProgress((prev) =>
          prev.map((item) =>
            currentBatch.findIndex((_, idx) => idx + batchStart === item.id) !==
            -1
              ? { ...item, status: "processing", message: "Yuborilmoqda..." }
              : item
          )
        );

        // Create an array of promises for all requests in this batch
        const batchPromises = currentBatch.map((item, batchIndex) => {
          const globalIndex = batchStart + batchIndex;

          return api
            .post("orderManager/orderStore/", item)
            .then(() => {
              // On success
              return {
                index: globalIndex,
                success: true,
                message: "Muvaffaqiyatli saqlandi",
              };
            })
            .catch((error) => {
              // On error
              return {
                index: globalIndex,
                success: false,
                message: error.response?.data?.message || "Xatolik yuz berdi",
              };
            });
        });

        // Execute all requests in the batch concurrently
        const results = await Promise.all(batchPromises);

        // Update progress based on results
        setSubmissionProgress((prev) =>
          prev.map((item) => {
            const result = results.find((r) => r.index === item.id);
            if (result) {
              return {
                ...item,
                status: result.success ? "success" : "error",
                message: result.message,
              };
            }
            return item;
          })
        );

        // Wait before processing the next batch (if there are more items)
        if (batchStart + BATCH_SIZE < submissionData.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_BATCHES)
          );
        }
      }

      // Check if all submissions were successful
      setSubmissionProgress((prev) => {
        const allSuccess = prev.every((item) => item.status === "success");

        if (allSuccess) {
          toast({
            title: "Muvaffaqiyatli",
            description: "Barcha buyurtmalar muvaffaqiyatli saqlandi",
            style: {
              backgroundColor: "green",
              color: "white",
            },
          });
        } else {
          toast({
            title: "Qisman muvaffaqiyatli",
            description:
              "Ba'zi buyurtmalar saqlanmadi. Batafsil ma'lumot uchun hisobotni tekshiring",
            style: {
              backgroundColor: "yellow",
              color: "black",
            },
          });
        }

        setLoading(false);

        return prev;
      });

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Xatolik",
        description: "Buyurtmalarni saqlashda xatolik",
        variant: "destructive",
      });

      // Close progress modal on complete error
      setShowProgressModal(false);
    }
  };

  // Set the same contragent for all models
  const applyContragentToAll = () => {
    if (!selectedContragent) {
      toast({
        title: "Xatolik",
        description: "Avval kontragentni tanlang",
        variant: "destructive",
      });
      return;
    }

    const newFormData = { ...formData };
    newFormData.data = newFormData.data.map((model) => ({
      ...model,
      contragent_id: selectedContragent,
    }));

    setFormData(newFormData);

    toast({
      title: "Muvaffaqiyatli",
      description: "Kontragent barcha modellarga biriktirildi",
    });
  };

  // Calculate success/error percentages for progress display
  const calculateProgressPercentages = () => {
    const { total, success, error } = overallProgress;
    if (total === 0) return { success: 0, error: 0 };

    return {
      success: (success / total) * 100,
      error: (error / total) * 100,
    };
  };

  const percentages = calculateProgressPercentages();

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6 shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <FileUp className="h-5 w-5" />
            Buyurtmalar yuklash
          </CardTitle>
          <CardDescription>
            Excel fayldan buyurtmalarni import qilish
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg cursor-pointer mb-6 transition-all duration-200 ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
            }`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="p-8 text-center">
              {fileLoading ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200 opacity-25"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                      <FileUp className="h-8 w-8" />
                    </div>
                  </div>
                  <p className="text-blue-600 font-medium">
                    Fayl yuklanmoqda...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <FileUp className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-gray-600 mb-2 font-medium">
                      Faylni shu yerga tashlang yoki tanlang
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Excel (.xlsx, .xls) formatidagi fayllar
                      qo'llab-quvvatlanadi
                    </p>
                    <Input
                      type="file"
                      onChange={(e) => sendFile(e.target.files?.[0])}
                      className="cursor-pointer max-w-md"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg">
            <div className="w-full md:w-3/4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                <Users className="h-4 w-4 inline mr-1" /> Kontragentni tanlang:
              </label>
              <Select
                value={selectedContragent}
                onValueChange={(value) => setSelectedContragent(value)}
              >
                <SelectTrigger className="w-full p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Kontragentni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {contragents.map((contragent) => (
                    <SelectItem
                      key={contragent.id || `contragent-${Math.random()}`}
                      value={contragent.id || `contragent-${Math.random()}`}
                    >
                      {contragent.name || "Nomsiz kontragent"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={applyContragentToAll}
              disabled={!selectedContragent || !formData.data?.length}
            >
              Barchasi uchun qo'llash
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !showProgressModal && (
        <div className="flex justify-center items-center my-12">
          <div className="text-center">
            <div className="mb-4 relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-blue-500 text-lg font-semibold">
                  Yuklanmoqda
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              Ma'lumotlar tayyorlanmoqda, iltimos kuting...
            </p>
          </div>
        </div>
      )}

      {formData.data && formData.data.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              Modelllar{" "}
              <Badge variant="secondary" className="ml-2">
                {formData.data.length}
              </Badge>
            </h2>

            <Button
              onClick={handleSubmit}
              disabled={loading || formData.data.length === 0}
              className="px-6 bg-green-600 hover:bg-green-700 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {formData.data.map((model, modelIndex) => (
                <Card
                  key={model.modelKey || `model-${modelIndex}-${Date.now()}`}
                  className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-3 sm:p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="text-base sm:text-lg flex flex-wrap items-center justify-between">
                      <span className="truncate max-w-[200px]">
                        {model.model}
                      </span>
                      {model.submodel && (
                        <Badge
                          variant="outline"
                          className="ml-2 font-normal text-xs"
                        >
                          {model.submodel}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Narx:</p>
                          <p className="font-medium truncate">${model.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <Package className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Miqdor:</p>
                          <p className="font-medium truncate">
                            {model.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Umumiy:</p>
                          <p className="font-medium truncate">
                            $
                            {typeof model.model_summa === "number"
                              ? model.model_summa.toFixed(2)
                              : "0.00"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <Tag className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">O'lchamlar:</p>
                          <p className="font-medium text-xs sm:text-sm max-h-[100px] overflow-auto">
                            {model.sizes.join(", ") || "Mavjud emas"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 bg-gray-50 p-2 sm:p-3 rounded-md">
                      <label className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Users className="h-4 w-4 text-indigo-500" />
                        Kontragent:
                      </label>
                      <Select
                        value={model.contragent_id || undefined}
                        onValueChange={(value) =>
                          handleModelContragentChange(modelIndex, value)
                        }
                      >
                        <SelectTrigger
                          className={`w-full p-2 transition-colors ${
                            model.contragent_id
                              ? "border-green-300 bg-green-50"
                              : "border-red-300 bg-red-50"
                          }`}
                        >
                          <SelectValue placeholder="Kontragentni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {contragents.map((contragent) => (
                            <SelectItem
                              key={`${model.modelKey}-${
                                contragent.id || Math.random()
                              }`}
                              value={
                                contragent.id || `contragent-${Math.random()}`
                              }
                            >
                              {contragent.name || "Nomsiz kontragent"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-1">
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                        Rasmlar{" "}
                        <Badge variant="secondary" className="ml-1">
                          {model.images.length}
                        </Badge>
                      </label>

                      {/* Key with unique timestamp to prevent stale droppable references */}
                      <Droppable
                        droppableId={`model-${modelIndex}-images`}
                        direction="horizontal"
                        key={`droppable-${modelIndex}-${Date.now()}`}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex gap-2 overflow-x-auto pb-2 min-h-16 border border-dashed border-gray-200 rounded p-2 bg-gray-50"
                          >
                            {model.images.length > 0 ? (
                              model.images.map((img, imgIndex) => (
                                <Draggable
                                  key={img.id}
                                  draggableId={img.id}
                                  index={imgIndex}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded overflow-hidden flex-shrink-0 relative border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                      <img
                                        src={img.url}
                                        alt={`${model.model}-${imgIndex}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = "/placeholder.jpg"; // Fallback image
                                        }}
                                      />
                                      <div className="absolute top-0 right-0 bg-indigo-500 text-white rounded-bl px-1 sm:px-2 py-0 sm:py-1 text-xs">
                                        {imgIndex + 1}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            ) : (
                              <div className="w-full h-16 sm:h-24 flex items-center justify-center text-gray-400">
                                <p className="text-center text-xs sm:text-sm">
                                  <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-gray-300" />
                                  Bu yerga rasmlarni tashlash mumkin
                                </p>
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DragDropContext>

          <div className="mt-8 text-right">
            <Button
              onClick={handleSubmit}
              disabled={loading || formData.data.length === 0}
              className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                "Barcha buyurtmalarni saqlash"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Progress Modal with Responsive Fixes */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              Buyurtmalarni saqlash
            </DialogTitle>
            <DialogDescription>
              Buyurtmalar ketma-ket serverga yuborilmoqda. Bu jarayon bir necha
              soniya davom etishi mumkin.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Enhanced loader animation */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                {overallProgress.pending > 0 ? (
                  <>
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-100 opacity-20"></div>
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-blue-500 font-bold">
                      {overallProgress.success + overallProgress.error}/
                      {overallProgress.total}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-100 opacity-20"></div>
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500"></div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-blue-500 font-bold">
                      {overallProgress.success + overallProgress.error}/
                      {overallProgress.total}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Overall progress statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                <div className="text-green-600 font-bold text-2xl">
                  {overallProgress.success}
                </div>
                <div className="text-sm text-green-600">Muvaffaqiyatli</div>
              </div>

              <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                <div className="text-red-600 font-bold text-2xl">
                  {overallProgress.error}
                </div>
                <div className="text-sm text-red-600">Xatolik</div>
              </div>

              <div className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-indigo-600 font-bold text-2xl">
                  {overallProgress.pending + overallProgress.processing}
                </div>
                <div className="text-sm text-indigo-600">Kutilmoqda</div>
              </div>
            </div>

            {/* Overall combined progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Umumiy progress</span>
                <span>
                  {overallProgress.success + overallProgress.error} /{" "}
                  {overallProgress.total} (
                  {Math.round(
                    ((overallProgress.success + overallProgress.error) /
                      Math.max(overallProgress.total, 1)) *
                      100
                  )}
                  %)
                </span>
              </div>

              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                {/* Success part of the progress bar */}
                <div
                  className="h-full bg-green-500 float-left transition-all duration-500 ease-out"
                  style={{ width: `${percentages.success}%` }}
                ></div>
                {/* Error part of the progress bar */}
                <div
                  className="h-full bg-red-500 float-left transition-all duration-500 ease-out"
                  style={{ width: `${percentages.error}%` }}
                ></div>
              </div>
            </div>

            {/* Individual model progress with improved visuals */}
            <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2 mt-4">
              {submissionProgress.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center p-3 border rounded-lg transition-all duration-300 ${
                    item.status === "success"
                      ? "bg-green-50 border-green-200"
                      : item.status === "error"
                      ? "bg-red-50 border-red-200"
                      : item.status === "processing"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span className="truncate max-w-[150px] sm:max-w-none">
                        {item.model}
                      </span>
                      {item.submodel && (
                        <span className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">
                          ({item.submodel})
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        item.status === "success"
                          ? "text-green-600"
                          : item.status === "error"
                          ? "text-red-600"
                          : item.status === "processing"
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {item.message}
                    </p>
                  </div>
                  <div className="ml-2">
                    {item.status === "pending" && (
                      <div className="h-8 w-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">
                          {item.id + 1}
                        </span>
                      </div>
                    )}
                    {item.status === "processing" && (
                      <div className="relative h-8 w-8">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-blue-500 text-xs">
                            {item.id + 1}
                          </span>
                        </div>
                      </div>
                    )}
                    {item.status === "success" && (
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                        <X className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowProgressModal(false);
              }}
              className="w-full sm:w-auto"
              disabled={overallProgress.processing > 0}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                setShowProgressModal(false);
                // If all were processed (success or error), offer to reset the form
                if (
                  overallProgress.pending === 0 &&
                  overallProgress.processing === 0
                ) {
                  if (overallProgress.success === overallProgress.total) {
                    // All successful - reset form
                    setFormData({ data: [] });
                  }
                }
              }}
              className={`w-full sm:w-auto ${
                overallProgress.processing > 0
                  ? "bg-gray-500"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              disabled={overallProgress.processing > 0}
            >
              {overallProgress.processing > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Jarayon tugashini kuting...
                </>
              ) : overallProgress.pending === 0 ? (
                "Yopish"
              ) : (
                "Jarayonni to'xtatish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExcelOrders;
