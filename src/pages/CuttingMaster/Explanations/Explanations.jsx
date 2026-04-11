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
import formatNumber from "@/utils/formatNumber";

const Explanations = () => {
  const { toast } = useToast();
  const [explanations, setExplanations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addDialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    meter: "",
    price_per_meter_usd: "",
    comment: "",
    image: null,
    apply_penalty: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cuttingMaster/employee-explanations");

      setExplanations(response.data.data.data);
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
        description: "Employee topilmadi",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.meter || !formData.price_per_meter_usd) {
      toast({
        title: "Xatolik",
        description: "Metr va narx majburiy",
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
        title: "Success",
        description: "Izoh qo'shildi",
      });

      setDialogOpen(false);
      setSelectedResult(null);
      setSearchResults([]);
      setSearchTerm("");
      setImagePreview(null);

      setFormData({
        employee_id: "",
        meter: "",
        price_per_meter_usd: "",
        comment: "",
        image: null,
        apply_penalty: false,
      });

      getData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Saqlab bo'lmadi",
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
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Jarimalar</h2>

        <Button
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          Qo'shish
        </Button>
      </div>

      {/* list */}
      {loading ? (
        <div>Loading...</div>
      ) : explanations.length === 0 ? (
        <div>Ma'lumot yo'q</div>
      ) : (
        <div className="grid gap-4">
          {explanations.map((item) => (
            <div
              key={item.id}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="font-medium text-lg">
                    {item.employee?.name}
                  </div>

                  <div className="text-sm text-gray-500">
                    Mas'ul: {item.creator?.name}
                  </div>

                  <div className="text-sm">
                    Metr: {formatNumber(item.meter)}
                  </div>

                  <div className="text-sm">
                    Narxi: {formatNumber(item.price_per_meter_usd)} $
                  </div>

                  <div className="text-sm font-semibold">
                    Jami jarima: {formatNumber(item.total_penalty_amount)}$
                  </div>

                  <div>
                    {item.apply_penalty ? (
                      <span className="text-red-600">Jarima qo'llangan</span>
                    ) : (
                      <span className="text-green-600">Jarima yo'q</span>
                    )}
                  </div>

                  {item.comment && (
                    <div className="text-sm">Izoh: {item.comment}</div>
                  )}

                  <div className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleString("uz-UZ", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </div>

                {/* image */}
                {item.image && (
                  <img
                    src={`https://api.vizzano-apparel.uz/storage/${item.image}`}
                    className="w-40 h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setSelectedImage(
                        `https://api.vizzano-apparel.uz/storage/${item.image}`,
                      );
                      setImageDialogOpen(true);
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qo'shish</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Input
              placeholder="Employee qidirish"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Button onClick={handleSearch} disabled={searching}>
              Qidirish
            </Button>
          </div>

          {searchResults.map((emp) => (
            <div
              key={emp.id}
              onClick={() => {
                setSelectedResult(emp);
                setFormData((prev) => ({
                  ...prev,
                  employee_id: emp.id,
                }));
              }}
              className="border p-2 rounded cursor-pointer"
            >
              {emp.name}
            </div>
          ))}

          {selectedResult && (
            <div className="space-y-4">
              <div>
                <Label>Metr</Label>
                <Input
                  type="number"
                  value={formData.meter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meter: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Price USD</Label>
                <Input
                  type="number"
                  value={formData.price_per_meter_usd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_per_meter_usd: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Checkbox
                  checked={formData.apply_penalty}
                  onCheckedChange={(v) =>
                    setFormData({
                      ...formData,
                      apply_penalty: v,
                    })
                  }
                />
                <Label>Jarima qo'llash</Label>
              </div>

              <Textarea
                placeholder="Comment"
                value={formData.comment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comment: e.target.value,
                  })
                }
              />

              <Input
                type="file"
                ref={imageInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];

                  setFormData({
                    ...formData,
                    image: file,
                  });

                  setImagePreview(URL.createObjectURL(file));
                }}
              />

              {imagePreview && (
                <img src={imagePreview} className="w-40 rounded" />
              )}

              <Button onClick={handleSubmit} disabled={submitting}>
                Saqlash
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Rasm</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size image"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Explanations;
