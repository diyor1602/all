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
import { Loader2, X } from "lucide-react";
import formatNumber from "@/utils/formatNumber";

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
    width: "",
    height: "",
    price_per_meter_usd: "",
    comment: "",
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());

  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cuttingMaster/employee-explanations");
      setExplanations(response.data?.data);
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
    if (!formData.width || !formData.height || !formData.price_per_meter_usd) {
      toast({
        title: "Xatolik",
        description: "Eni, bo'yi va narx maydonlari to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const formDataToSend = new FormData();
      formDataToSend.append("employee_id", formData.employee_id);
      const calculatedMeter =
        parseFloat(formData.width) * parseFloat(formData.height);
      formDataToSend.append("meter", calculatedMeter.toString());
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
        duration: 2000,
      });

      // Reset form and close dialog
      setSelectedResult(null);
      setFormData({
        employee_id: "",
        width: "",
        height: "",
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
        <div className="w-full h-[90vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
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
          <div className="mt-4">
            {explanations?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {explanations
                  ?.sort(
                    (a, b) => b.explanations?.length - a.explanations?.length,
                  )
                  ?.map((emp, index) => {
                    return (
                      <div
                        key={index}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            const newExpanded = new Set(expandedEmployees);
                            if (newExpanded.has(emp.id)) {
                              newExpanded.delete(emp.id);
                            } else {
                              newExpanded.add(emp.id);
                            }
                            setExpandedEmployees(newExpanded);
                          }}
                        >
                          {emp?.img && (
                            <img
                              src={emp.img}
                              className="w-10 h-10 object-cover rounded-full"
                              alt={emp.name}
                            />
                          )}
                          <div className="flex-1">
                            <div>{emp.name}</div>
                            <div>
                              {emp.department?.name} {emp.group?.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div>{emp?.explanations?.length}</div>
                            <div
                              className={`transform transition-transform duration-200 ${expandedEmployees.has(emp.id) ? "rotate-180" : ""}`}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {expandedEmployees.has(emp.id) &&
                          emp.explanations?.length > 0 && (
                            <div className="border-t bg-gray-50 p-4">
                              <div className="space-y-3">
                                {emp.explanations.map((explanation) => (
                                  <div
                                    key={explanation.id}
                                    className="bg-white rounded-lg p-3 border"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs text-gray-500">
                                        {new Date(
                                          explanation.created_at,
                                        ).toLocaleDateString("ru-RU")}{" "}
                                        {new Date(
                                          explanation.created_at,
                                        ).toLocaleTimeString("ru-RU", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Yaratdi: {explanation.creator?.name}
                                      </div>
                                    </div>

                                    {explanation.image && (
                                      <div className="mb-2">
                                        <img
                                          src={explanation.image}
                                          alt="Explanation image"
                                          className="w-full max-w-sm h-32 object-cover rounded border"
                                        />
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                      <div>
                                        <span className="font-medium">
                                          Metri:
                                        </span>{" "}
                                        {formatNumber(explanation.meter)} m
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Metrga narxi:
                                        </span>{" "}
                                        $
                                        {formatNumber(
                                          explanation.price_per_meter_usd,
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Jami jarima:
                                        </span>{" "}
                                        $
                                        {formatNumber(
                                          explanation.total_penalty_amount,
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Jarima:
                                        </span>
                                        <span
                                          className={`ml-1 ${explanation.apply_penalty ? "text-red-600" : "text-green-600"}`}
                                        >
                                          {explanation.apply_penalty
                                            ? "Ha"
                                            : "Yo'q"}
                                        </span>
                                      </div>
                                    </div>

                                    {explanation.comment && (
                                      <div>
                                        <span className="font-medium text-xs">
                                          Izoh:
                                        </span>
                                        <p className="text-xs text-gray-600 mt-1">
                                          {explanation.comment}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {expandedEmployees.has(emp.id) &&
                          (!emp.explanations ||
                            emp.explanations.length === 0) && (
                            <div className="border-t bg-gray-50 p-4 text-center text-gray-500 text-sm">
                              Izohlar mavjud emas
                            </div>
                          )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div>Mavjud emas</div>
            )}
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Qo'shish</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto max-h-[80vh] p-1">
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
                        <Label htmlFor="width">Eni (m)</Label>
                        <Input
                          id="width"
                          type="number"
                          step="0.01"
                          value={formData.width}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              width: e.target.value,
                            }))
                          }
                          placeholder="Enini kiriting"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Bo'yi (m)</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.01"
                          value={formData.height}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              height: e.target.value,
                            }))
                          }
                          placeholder="Bo'yini kiriting"
                        />
                      </div>
                    </div>

                    {formData.width && formData.height && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded space-y-1">
                        <div>
                          Jami metr:{" "}
                          {formatNumber(
                            parseFloat(formData.width) *
                              parseFloat(formData.height),
                          )}{" "}
                          m
                        </div>
                        {formData.price_per_meter_usd && (
                          <div className="font-semibold text-blue-600">
                            Jami narx:{" "}
                            {formatNumber(
                              parseFloat(formData.width) *
                                parseFloat(formData.height) *
                                parseFloat(formData.price_per_meter_usd),
                            )}{" "}
                            $
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="price_per_meter_usd">
                          Metrga narxi ($)
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
                        rows={1}
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
                            width: "",
                            height: "",
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
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Explanations;
