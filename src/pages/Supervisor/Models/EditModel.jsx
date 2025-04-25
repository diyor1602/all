import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package2,
  Save,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import api from "@/utils/api";
import { useNavigate, useParams } from "react-router-dom";
import NoImage from "/noimage.png";

const EditModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingModel, setFetchingModel] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);

  // New size and submodel inputs
  const [newSize, setNewSize] = useState("");
  const [newSubmodel, setNewSubmodel] = useState("");

  // Model form data
  const [model, setModel] = useState({
    name: "",
    description: "",
    rasxod: "",
    submodels: [],
    sizes: [],
    images: [],
  });

  // Fetch model data
  useEffect(() => {
    const fetchModel = async () => {
      try {
        setFetchingModel(true);
        const response = await api.get(`/supervisor/models/${id}`);
        const modelData = response.data;

        setModel({
          ...modelData,
          // Ensure we have the correct structure for all fields
          description: modelData.description || "",
          sizes: modelData.sizes || [],
          submodels: modelData.submodels || [],
          rasxod: parseFloat(modelData.rasxod / 250).toFixed(3) || "",
          images: modelData.images || [],
        });
      } catch (error) {
        toast({
          title: "Xato",
          description: "Modelni yuklashda xatolik yuz berdi",
          variant: "destructive",
        });
      } finally {
        setFetchingModel(false);
      }
    };

    if (id) {
      fetchModel();
    }
  }, [id, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModel({
      ...model,
      [name]: value,
    });
  };

  const handleAddSize = () => {
    if (newSize.trim()) {
      setModel({
        ...model,
        sizes: [...model.sizes, { name: newSize.trim(), id: Date.now() }],
      });
      setNewSize("");
    }
  };

  const handleRemoveSize = (sizeId) => {
    setModel({
      ...model,
      sizes: model.sizes.filter((s) => s.id !== sizeId),
    });
  };

  const handleAddSubmodel = () => {
    if (newSubmodel.trim()) {
      setModel({
        ...model,
        submodels: [
          ...model.submodels,
          { name: newSubmodel.trim(), id: Date.now() },
        ],
      });
      setNewSubmodel("");
    }
  };

  const handleRemoveSubmodel = (submodelId) => {
    setModel({
      ...model,
      submodels: model.submodels.filter((sm) => sm.id !== submodelId),
    });
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      // Preview images locally
      const newImages = Array.from(files).map((file) => ({
        id: `new_${Math.random().toString()}`,
        file: file,
        preview: URL.createObjectURL(file),
        name: file.name,
        isNew: true, // Mark as a new image
      }));

      setModel({
        ...model,
        images: [...model.images, ...newImages],
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Rasmlar yuklandi",
      });
    } catch (error) {
      toast({
        title: "Xato",
        description: "Rasmlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageId) => {
    const image = model.images.find((img) => img.id === imageId);

    // Set the current image as being deleted
    setDeletingImageId(imageId);

    try {
      // If it's an existing image (not newly added), delete it from the server
      if (image && !image.isNew) {
        await api.delete(`/supervisor/models/image/${imageId}`);
        toast({
          title: "Muvaffaqiyatli",
          description: "Rasm o'chirildi",
        });
      }

      // Revoke object URL for new images to prevent memory leaks
      if (image && image.isNew && image.preview) {
        URL.revokeObjectURL(image.preview);
      }

      // Update the model state
      setModel({
        ...model,
        images: model.images.filter((img) => img.id !== imageId),
      });
    } catch (error) {
      toast({
        title: "Xato",
        description: "Rasmni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      // Clear the deleting image state
      setDeletingImageId(null);
    }
  };

  const validateForm = () => {
    if (!model.name.trim()) {
      toast({
        title: "Xato",
        description: "Model nomi kiritilishi shart",
        variant: "destructive",
      });
      return false;
    }

    if (model.submodels.length === 0) {
      toast({
        title: "Xato",
        description: "Kamida bitta submodel kiritilishi shart",
        variant: "destructive",
      });
      return false;
    }

    if (!model.rasxod || isNaN(parseFloat(model.rasxod))) {
      toast({
        title: "Xato",
        description: "Rasxod kiritilishi shart va raqam bo'lishi kerak",
        variant: "destructive",
      });
      return false;
    }

    if (model.sizes.length === 0) {
      toast({
        title: "Xato",
        description: "Kamida bitta o'lcham kiritilishi shart",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Separate existing and new images
      const existingImages = model.images.filter((img) => !img.isNew);
      const newImages = model.images.filter((img) => img.isNew);

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("_method", "PATCH");

      // Add main data as JSON
      formData.append(
        "data",
        JSON.stringify({
          name: model.name,
          description: model.description,
          sizes: model.sizes.map((size) => ({
            id: size.id > 10000000 ? null : size.id,
            name: size.name,
          })),
          submodels: model.submodels.map((submodel) => ({
            id: submodel.id > 10000000 ? null : submodel.id,
            name: submodel.name,
          })),
          rasxod: parseFloat(model.rasxod) * 250,
          images: existingImages.map((image) => ({ id: image.id })),
        })
      );

      // Add all new images
      newImages.forEach((image, index) => {
        if (image.file) {
          formData.append(`images${index + 1}`, image.file);
        }
      });

      await api.post(`/supervisor/models/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Model muvaffaqiyatli yangilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      navigate("/supervisor/models");
    } catch (error) {
      toast({
        title: "Xato",
        description: "Modelni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingModel) {
    return (
      <div className="md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            Model ma'lumotlari yuklanmoqda...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/supervisor/models")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Orqaga
            </Button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package2 className="text-blue-500" />
              Model tahrirlash: {model.name}
            </h1>
            <p className="text-gray-500 mt-1">Model ma'lumotlarini yangilang</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500 mb-6">
            <CardHeader>
              <CardTitle>Asosiy ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Model nomi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={model.name}
                    onChange={handleInputChange}
                    placeholder="Model nomini kiriting"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rasxod">
                    Daqiqa (bitish minuti)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rasxod"
                    name="rasxod"
                    type="number"
                    step="0.01"
                    value={model.rasxod}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={model.description || ""}
                  onChange={handleInputChange}
                  placeholder="Model haqida qo'shimcha ma'lumot..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="flex items-center gap-2">
                    Submodellar ({model.submodels.length}){" "}
                    <span className="text-red-500">*</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSubmodel}
                      onChange={(e) => setNewSubmodel(e.target.value)}
                      placeholder="Yangi submodel nomi"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSubmodel.trim()) {
                          e.preventDefault();
                          handleAddSubmodel();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddSubmodel}
                      disabled={!newSubmodel.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {model.submodels.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {model.submodels.map((submodel) => (
                        <div
                          key={submodel.id}
                          className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-md"
                        >
                          <span>{submodel.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubmodel(submodel.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Hozircha submodellar qo'shilmagan
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="flex items-center gap-2">
                    O'lchamlar ({model.sizes.length}){" "}
                    <span className="text-red-500">*</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="Yangi o'lcham (masalan: 12-24)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSize.trim()) {
                          e.preventDefault();
                          handleAddSize();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddSize}
                      disabled={!newSize.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {model.sizes.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {model.sizes.map((size) => (
                        <div
                          key={size.id}
                          className="flex items-center justify-between p-2 bg-purple-50 border border-purple-100 rounded-md"
                        >
                          <span>{size.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSize(size.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Hozircha o'lchamlar qo'shilmagan
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <div className="flex items-center gap-2">
                  Rasmlar ({model.images.length}){" "}
                  <span className="text-gray-500 text-sm">(ixtiyoriy)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <label htmlFor="images" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-blue-500 mb-2" />
                      <p className="text-sm text-gray-700 font-medium">
                        Rasmlarni yuklash uchun bosing yoki bu yerga tashlang
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, JPEG
                      </p>
                      {uploading && (
                        <div className="flex items-center mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
                          <span className="text-sm text-blue-500">
                            Yuklanmoqda...
                          </span>
                        </div>
                      )}
                    </div>
                    <Input
                      id="images"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {model.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {model.images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={
                            image.isNew ? image.preview : image.image || NoImage
                          }
                          alt={image.name || "Model rasmi"}
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            e.target.src = NoImage;
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(image.id)}
                          disabled={deletingImageId === image.id}
                        >
                          {deletingImageId === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mb-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/supervisor/models")}
            >
              <X className="mr-2 h-4 w-4" />
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Saqlash
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModel;
