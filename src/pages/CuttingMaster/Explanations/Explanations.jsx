import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

const Explanations = () => {
  const { toast } = useToast();
  const [explanations, setExplanations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addDialogOpen, setDialogOpen] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    meter: "",
    price_per_meter_usd: "",
    comment: "",
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cuttingMaster/employee-explanations");
      setExplanations(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const response = await api.get("/cuttingMaster/employees", {
        params: {
          search: searchTerm,
          status: "working",
        },
      });
      setSearchResults(response.data?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    // Form validation
    if (!formData.meter || !formData.price_per_meter_usd) {
      toast({
        title: "Xatolik",
        description: "Metr va narx maydonlari to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const formDataToSend = new FormData();
      formDataToSend.append("employee_id", formData.employee_id);
      formDataToSend.append("meter", formData.meter);
      formDataToSend.append(
        "price_per_meter_usd",
        formData.price_per_meter_usd,
      );
      formDataToSend.append("apply_penalty", formData.apply_penalty);
      formDataToSend.append("comment", formData.comment);

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await api.post("/cuttingMaster/employee-explanations", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Izoh muvaffaqiyatli saqlandi",
      });

      // Reset form and close dialog
      setSelectedResult(null);
      setFormData({
        employee_id: "",
        meter: "",
        price_per_meter_usd: "",
        comment: "",
        image: null,
      });
      setImagePreview(null);
      setSearchResults([]);
      setSearchTerm("");
      setDialogOpen(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      // Refresh the data
      getData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarni saqlab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSearchResults([]);
                setSelectedResult(null);
                setDialogOpen(true);
              }}
            >
              Qo'shish
            </Button>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Qo'shish</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Qidirish"
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? "Qidirilmoqda..." : "Qidirish"}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedResult(result);
                        setFormData((prev) => ({
                          ...prev,
                          employee_id: result.id,
                        }));
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                    >
                      {result?.img ? (
                        <img
                          src={result.img}
                          alt={result.name}
                          className="w-12 h-12 object-cover rounded-full ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-all duration-200">
                          <span className="text-gray-500 text-sm font-medium group-hover:text-blue-600">
                            {result.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-200 truncate">
                          {result.name}
                        </div>
                        <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 flex flex-wrap gap-1 mt-1 items-center">
                          {result.department?.name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors duration-200">
                              {result.department.name}
                            </span>
                          )}
                          {result?.group?.name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors duration-200">
                              {result.group.name}
                            </span>
                          )}
                          {result?.position && (
                            <span className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                              {result.position}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meter">Metr</Label>
                      <Input
                        id="meter"
                        type="number"
                        value={formData.meter}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            meter: e.target.value,
                          }))
                        }
                        placeholder="Metrni kiriting"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price_per_meter_usd">
                        Metrga narxi (USD)
                      </Label>
                      <Input
                        id="price_per_meter_usd"
                        type="number"
                        step="0.01"
                        value={formData.price_per_meter_usd}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            price_per_meter_usd: e.target.value,
                          }))
                        }
                        placeholder="Metrga narxini kiriting"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apply_penalty"
                      checked={formData.apply_penalty}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          apply_penalty: checked,
                        }))
                      }
                    />
                    <Label htmlFor="apply_penalty">Jarima qo'llash</Label>
                  </div>

                  <div>
                    <Label htmlFor="comment">Izoh</Label>
                    <Textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      placeholder="Izohingizni yozing..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="image">Rasm</Label>
                    <Input
                      id="image"
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData((prev) => ({
                            ...prev,
                            image: file,
                          }));
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />

                    {imagePreview && (
                      <div className="mt-3 relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData((prev) => ({
                              ...prev,
                              image: null,
                            }));
                            if (imageInputRef.current) {
                              imageInputRef.current.value = "";
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Yuborilmoqda..." : "Saqlash"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedResult(null);
                        setFormData({
                          employee_id: "",
                          meter: "",
                          price_per_meter_usd: "",
                          comment: "",
                          image: null,
                        });
                        setImagePreview(null);
                        if (imageInputRef.current) {
                          imageInputRef.current.value = "";
                        }
                      }}
                    >
                      Bekor qilish
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Explanations;
