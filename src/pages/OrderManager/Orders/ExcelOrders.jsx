import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, X, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ExcelOrders = () => {
  const [contragents, setContragents] = useState([]);
  const [selectedContragent, setSelectedContragent] = useState("");
  const { toast } = useToast();
  const [formData, setFormData] = useState({ data: [] });
  const [loading, setLoading] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState([]);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Process incoming data to add unique IDs
  const processImportedData = (data) => {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return { data: [] };
    }

    return {
      ...data,
      data: data.data.map((model, modelIndex) => ({
        ...model,
        // Ensure images is always an array even if it's null or missing
        images: Array.isArray(model.images)
          ? model.images.map((img, imgIndex) => {
              // Extract the filename from the image URL (last part after the last slash)
              const fullUrl = img || "";
              const fileName = fullUrl.split("/").pop() || "";

              return {
                id: `image-${modelIndex}-${imgIndex}`,
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
      })),
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

  const sendFile = async (file) => {
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/orderManager/import-orders", formData);

      // Process the data to ensure all fields are safe
      setFormData(processImportedData(response.data));
      setLoading(false);
    } catch (error) {
      setLoading(false);
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
    const file = event.dataTransfer.files[0];
    if (file) {
      sendFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Handle image reordering within a model
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Extract model indices from droppable IDs
    // Format is now "model-{modelIndex}-images"
    const sourceModelIndex = parseInt(source.droppableId.split("-")[1]);
    const destModelIndex = parseInt(destination.droppableId.split("-")[1]);

    // Check if indices are valid
    if (isNaN(sourceModelIndex) || isNaN(destModelIndex)) return;
    if (sourceModelIndex < 0 || sourceModelIndex >= formData.data.length)
      return;
    if (destModelIndex < 0 || destModelIndex >= formData.data.length) return;

    const newFormData = { ...formData };

    // Check if we're moving within the same model
    if (sourceModelIndex === destModelIndex) {
      // Handle reordering within the same model
      const images = [...newFormData.data[sourceModelIndex].images];

      if (source.index >= images.length) return;

      // Reorder images
      const [movedImage] = images.splice(source.index, 1);
      images.splice(destination.index, 0, movedImage);

      newFormData.data[sourceModelIndex].images = images;
    } else {
      // Handle moving between models
      const sourceImages = [...newFormData.data[sourceModelIndex].images];
      const destImages = [...newFormData.data[destModelIndex].images];

      if (source.index >= sourceImages.length) return;

      // Move image between models
      const [movedImage] = sourceImages.splice(source.index, 1);
      destImages.splice(destination.index, 0, movedImage);

      newFormData.data[sourceModelIndex].images = sourceImages;
      newFormData.data[destModelIndex].images = destImages;
    }

    setFormData(newFormData);
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

  // Submit all models with their assigned contragents
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
        model: model.model,
        status: "pending", // pending, success, error
        message: "",
      }));

      setSubmissionProgress(progressState);
      setShowProgressModal(true);

      // Send each model individually
      for (let i = 0; i < submissionData.length; i++) {
        try {
          // Update current model status to processing
          setSubmissionProgress((prev) =>
            prev.map((item) =>
              item.id === i
                ? { ...item, status: "processing", message: "Yuborilmoqda..." }
                : item
            )
          );

          // Send request to the endpoint
          await api.post("orderManager/orderStore/", submissionData[i]);

          // Update success status
          setSubmissionProgress((prev) =>
            prev.map((item) =>
              item.id === i
                ? {
                    ...item,
                    status: "success",
                    message: "Muvaffaqiyatli saqlandi",
                  }
                : item
            )
          );

          // Add small delay between requests to prevent API rate limiting
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          // Update error status
          setSubmissionProgress((prev) =>
            prev.map((item) =>
              item.id === i
                ? {
                    ...item,
                    status: "error",
                    message:
                      error.response?.data?.message || "Xatolik yuz berdi",
                  }
                : item
            )
          );
        }
      }

      // Check if all submissions were successful
      const allSuccess = submissionData.length > 0;

      if (allSuccess) {
        toast({
          title: "Muvaffaqiyatli",
          description: "Barcha buyurtmalar muvaffaqiyatli saqlandi",
        });
      } else {
        toast({
          title: "Qisman muvaffaqiyatli",
          description:
            "Ba'zi buyurtmalar saqlanmadi. Batafsil ma'lumot uchun hisobotni tekshiring",
          variant: "warning",
        });
      }

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

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buyurtmalar yuklash</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg cursor-pointer mb-4"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <p className="text-gray-500 mb-2">
              Faylni shu yerga tashlang yoki tanlang
            </p>
            <Input
              type="file"
              onChange={(e) => sendFile(e.target.files?.[0])}
              className="cursor-pointer"
            />
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={selectedContragent}
              onChange={(e) => setSelectedContragent(e.target.value)}
              className="w-full p-4 border rounded"
            >
              <option value="">Kontragentni tanlang</option>
              {contragents.map((contragent) => (
                <option
                  key={contragent.id || `contragent-${Math.random()}`}
                  value={contragent.id}
                >
                  {contragent.name || "Nomsiz kontragent"}
                </option>
              ))}
            </select>

            <Button
              onClick={applyContragentToAll}
              disabled={!selectedContragent || !formData.data?.length}
            >
              Barchasi uchun qo'llash
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center my-8">Yuklanmoqda...</div>}

      {formData.data && formData.data.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">
            Modelllar ({formData.data.length})
          </h2>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formData.data.map((model, modelIndex) => (
                <Card key={`model-${modelIndex}`} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">
                      {model.model} - {model.submodel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Narx: ${model.price}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Miqdor: {model.quantity}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Umumiy: $
                        {typeof model.model_summa === "number"
                          ? model.model_summa.toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        O'lchamlar: {model.sizes.join(", ")}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Kontragent:
                      </label>
                      <select
                        value={model.contragent_id || ""}
                        onChange={(e) =>
                          handleModelContragentChange(
                            modelIndex,
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Kontragentni tanlang</option>
                        {contragents.map((contragent) => (
                          <option
                            key={`${model.model}-${
                              contragent.id || Math.random()
                            }`}
                            value={contragent.id}
                          >
                            {contragent.name || "Nomsiz kontragent"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Rasmlar ({model.images.length}):
                      </label>
                      <Droppable
                        droppableId={`model-${modelIndex}-images`}
                        direction="horizontal"
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex gap-2 overflow-x-auto pb-2 min-h-16 border border-dashed border-gray-200 rounded p-2"
                          >
                            {model.images.map((img, imgIndex) => (
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
                                    className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative border border-gray-200"
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
                                    <div className="absolute top-0 right-0 bg-black text-white rounded-bl px-1 text-xs">
                                      {imgIndex + 1}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {model.images.length === 0 && (
                              <div className="w-full h-24 flex items-center justify-center text-gray-400">
                                <p>Bu yerga rasmlarni tashlash mumkin</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DragDropContext>

          <div className="mt-6 text-right">
            <Button
              onClick={handleSubmit}
              disabled={loading || formData.data.length === 0}
              className="px-6"
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
        </div>
      )}

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buyurtmalarni saqlash</DialogTitle>
            <DialogDescription>
              Buyurtmalar ketma-ket serverga yuborilmoqda. Iltimos kuting...
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Overall progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Umumiy progress</span>
                <span>
                  {
                    submissionProgress.filter(
                      (item) => item.status === "success"
                    ).length
                  }{" "}
                  / {submissionProgress.length}
                </span>
              </div>
              <Progress
                value={
                  submissionProgress.length > 0
                    ? (submissionProgress.filter(
                        (item) => item.status === "success"
                      ).length /
                        submissionProgress.length) *
                      100
                    : 0
                }
              />
            </div>

            {/* Individual model progress */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {submissionProgress.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-2 border rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.model}</p>
                    <p className="text-sm text-gray-500">{item.message}</p>
                  </div>
                  <div>
                    {item.status === "pending" && (
                      <div className="h-6 w-6 rounded-full bg-gray-200" />
                    )}
                    {item.status === "processing" && (
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    )}
                    {item.status === "success" && (
                      <Check className="h-6 w-6 text-green-500" />
                    )}
                    {item.status === "error" && (
                      <X className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowProgressModal(false);
                // If all were successful, reset the form
                if (
                  submissionProgress.every((item) => item.status === "success")
                ) {
                  setFormData({ data: [] });
                }
              }}
              className="w-full"
            >
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExcelOrders;
