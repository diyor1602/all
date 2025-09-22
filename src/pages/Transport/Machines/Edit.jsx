import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

const formatValue = (value) => {
  if (!value) return "";
  return parseInt(value).toLocaleString("en-EN");
};

const Edit = () => {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: "", // Add the id field for update
    name: "", // required
    state_number: "", // required
    driver_full_name: "", // required
    phone: "", // required
    phone_2: "", // optional
    capacity: 0, // required
    region_id: null, // required
    region_name: "", // for new region
    distance: 0, // optional
    is_active: true,
    salary: 0, // required
    fuel_bonus: 0, // optional
  });

  const getRegions = async () => {
    try {
      const response = await api.get("/transport/regions");
      setRegions(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Regionlar ro'yxati olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getRegions();
  }, []);

  const getTransportData = async () => {
    try {
      const response = await api.get(`/transport/transports/${id}`);
      const transportData = response.data.data;

      // Format the dates for input fields
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      // Set the form data with the response data
      setFormData({
        id: transportData.id,
        name: transportData.name || "",
        state_number: transportData.state_number || "",
        driver_full_name: transportData.driver_full_name || "",
        phone: transportPhoneNumber(transportData.phone) || "",
        phone_2: transportPhoneNumber(transportData.phone_2) || "",
        capacity: transportData.capacity || 0,
        region_id: transportData.region_id?.id || null,
        region_name: transportData.region_id?.name || "",
        distance: transportData.distance || 0,
        is_active: transportData.is_active || false,
        salary: transportData.salary || 0,
        fuel_bonus: transportData.fuel_bonus || 0,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Transport ma'lumotlarini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (id) {
      getTransportData();
    }
  }, [id]);

  // Format phone number for display when coming from transport data
  const transportPhoneNumber = (value) => {
    if (!value) return "";

    // Make sure it's a string
    let phoneStr = value.toString();

    // Format the phone number: +998 XX XXX XX XX
    let formattedNumber = "+";
    for (let i = 0; i < phoneStr.length; i++) {
      if (i === 3) formattedNumber += " ";
      if (i === 5) formattedNumber += " ";
      if (i === 8) formattedNumber += " ";
      if (i === 10) formattedNumber += " ";
      formattedNumber += phoneStr[i];
    }

    return formattedNumber;
  };

  const formatPhoneNumber = (value) => {
    if (!value) return "+998";

    let phoneNumber = value.replace(/\D/g, "");

    if (!phoneNumber.startsWith("998")) {
      if (phoneNumber.length <= 3) {
        phoneNumber = "998" + phoneNumber;
      } else {
        phoneNumber = "998" + phoneNumber;
      }
    }

    if (phoneNumber.length > 12) {
      phoneNumber = phoneNumber.substring(0, 12);
    }

    let formattedNumber = "+";
    for (let i = 0; i < phoneNumber.length; i++) {
      if (i === 3) formattedNumber += " ";
      if (i === 5) formattedNumber += " ";
      if (i === 8) formattedNumber += " ";
      if (i === 10) formattedNumber += " ";
      formattedNumber += phoneNumber[i];
    }

    return formattedNumber;
  };

  const handlePhoneChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: formattedNumber,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let submissionData = { ...formData };

      // Format phones
      if (submissionData.phone)
        submissionData.phone = submissionData.phone.replace(/\D/g, "");
      if (submissionData.phone_2)
        submissionData.phone_2 = submissionData.phone_2.replace(/\D/g, "");

      // Only send region_id OR region_name
      if (submissionData.region_id) {
        delete submissionData.region_name;
      } else {
        delete submissionData.region_id;
      }

      await api.patch(`/transport/transports/${id}`, submissionData);

      toast({
        title: "Muvaffaqiyatli",
        description: "Transport ma'lumotlari yangilandi",
        style: { backgroundColor: "green", color: "white" },
      });

      navigate("/transport/machines");
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ma'lumotlarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Transport tahrirlash
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft />
          Orqaga
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transport tahrirlash</CardTitle>
          <CardDescription>
            Transport va haydovchi ma'lumotlarini yangilang
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-l-4 border-primary pl-3">
                Asosiy ma'lumotlar
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Transport nomi *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state_number">Davlat raqami *</Label>
                  <Input
                    id="state_number"
                    name="state_number"
                    value={formData.state_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Sig'imi *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance">
                    Masofasi ({formatValue(formData.distance)} km)
                  </Label>
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    value={formData.distance}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Hudud *</Label>
                  <div className="relative">
                    <Input
                      id="region"
                      name="region"
                      list="regions-list"
                      placeholder="Hududni tanlang yoki kiriting..."
                      value={formData.region_name}
                      onChange={(e) => {
                        const value = e.target.value;

                        // Match with existing region
                        const selectedRegion = regions.find(
                          (r) => r.name.toLowerCase() === value.toLowerCase()
                        );

                        if (selectedRegion) {
                          setFormData((prev) => ({
                            ...prev,
                            region_id: selectedRegion.id,
                            region_name: selectedRegion.name,
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            region_id: null,
                            region_name: value,
                          }));
                        }
                      }}
                      required
                    />
                    <datalist id="regions-list">
                      {regions.map((region) => (
                        <option key={region.id} value={region.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleSelectChange("is_active", checked)
                  }
                />
                <Label htmlFor="is_active">Faol</Label>
              </div>
            </div>

            {/* Driver Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-l-4 border-primary pl-3">
                Haydovchi ma'lumotlari
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driver_full_name">F.I.Sh. *</Label>
                  <Input
                    id="driver_full_name"
                    name="driver_full_name"
                    value={formData.driver_full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon raqami *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+998 XX XXX XX XX"
                    maxLength={17}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_2">Qo'shimcha telefon</Label>
                  <Input
                    id="phone_2"
                    name="phone_2"
                    value={formData.phone_2}
                    onChange={handlePhoneChange}
                    placeholder="+998 XX XXX XX XX"
                    maxLength={17}
                  />
                </div>
              </div>
            </div>

            {/* Financial Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-l-4 border-primary pl-3">
                Moliyaviy ma'lumotlar
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">
                    Kunlik maoshi * ({formatValue(formData.salary)} so'm)
                  </Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuel_bonus">
                    Yoqilg'i bonusi ({formatValue(formData.fuel_bonus)} so'm)
                  </Label>
                  <Input
                    id="fuel_bonus"
                    name="fuel_bonus"
                    type="number"
                    value={formData.fuel_bonus}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft />
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Check />
                  Saqlash
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
