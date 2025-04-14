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
import { Check } from "lucide-react";

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
  const [openRegionCombobox, setOpenRegionCombobox] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [isNewRegion, setIsNewRegion] = useState(false);
  const dropdownRef = useRef(null);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

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
    vin_number: "", // optional
    tech_passport_number: "", // optional
    engine_number: "", // optional
    year: "", // optional
    color: "", // optional
    registration_date: "", // optional
    insurance_expiry: "", // optional
    inspection_expiry: "", // optional
    driver_passport_number: "", // optional
    driver_license_number: "", // optional
    driver_experience_years: 0, // optional
    salary: 0, // required
    fuel_bonus: 0, // optional
  });

  const getRegions = async () => {
    try {
      const response = await api.get("/transport/regions");
      setRegions(response.data);
      setFilteredRegions(response.data);
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
        vin_number: transportData.vin_number || "",
        tech_passport_number: transportData.tech_passport_number || "",
        engine_number: transportData.engine_number || "",
        year: transportData.year || "",
        color: transportData.color || "",
        registration_date: formatDate(transportData.registration_date) || "",
        insurance_expiry: formatDate(transportData.insurance_expiry) || "",
        inspection_expiry: formatDate(transportData.inspection_expiry) || "",
        driver_passport_number: transportData.driver_passport_number || "",
        driver_license_number: transportData.driver_license_number || "",
        driver_experience_years: transportData.driver_experience_years || 0,
        salary: transportData.salary || 0,
        fuel_bonus: transportData.fuel_bonus || 0,
      });

      // Set the region search value to display the current region
      if (transportData.region_id?.name) {
        setRegionSearch(transportData.region_id.name);
      }

      setInitialDataLoaded(true);
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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenRegionCombobox(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Filter regions when search changes
  useEffect(() => {
    if (regionSearch.trim() !== "") {
      const lowercasedSearch = regionSearch.toLowerCase();
      const filtered = regions.filter((region) =>
        region.name.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredRegions(filtered);
    } else {
      setFilteredRegions(regions);
    }
  }, [regionSearch, regions]);

  // Format phone number for display
  const formatPhoneNumber = (value) => {
    if (!value) return "+998";

    // Remove all non-digit characters
    let phoneNumber = value.replace(/\D/g, "");

    // If the number doesn't start with 998, add it
    if (!phoneNumber.startsWith("998")) {
      // Only add 998 if it's a completely new number or if we're not in the process of typing it
      if (phoneNumber.length <= 3) {
        // We're still typing the prefix or it's empty
        phoneNumber = "998" + phoneNumber;
      } else {
        // It's not a 998 prefix but some other number
        phoneNumber = "998" + phoneNumber;
      }
    }

    // Trim the phone number to maximum 12 digits (including 998)
    if (phoneNumber.length > 12) {
      phoneNumber = phoneNumber.substring(0, 12);
    }

    // Format the phone number: +998 XX XXX XX XX
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

  // Handle phone input with formatting
  const handlePhoneChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: formattedNumber,
    }));
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle region selection
  const handleRegionSelect = (id, name) => {
    setFormData({
      ...formData,
      region_id: id,
      region_name: name,
    });
    setRegionSearch(name);
    setIsNewRegion(false);
    setOpenRegionCombobox(false);
  };

  // Handle new region input
  const handleNewRegionInput = (value) => {
    setRegionSearch(value);
    setFormData({
      ...formData,
      region_name: value,
      region_id: null,
    });

    // Check if the input doesn't match any existing region
    const matchingRegion = regions.find(
      (region) => region.name.toLowerCase() === value.toLowerCase()
    );

    setIsNewRegion(!matchingRegion && value.trim() !== "");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare the data for submission
      const submissionData = { ...formData };

      // If it's not a new region, remove region_name from the submission
      if (!isNewRegion) {
        delete submissionData.region_name;
      }

      // Clean phone numbers - ensure they don't have spaces when sent to the API
      if (submissionData.phone) {
        // Remove all non-digit characters
        submissionData.phone = submissionData.phone.replace(/\D/g, "");
      }

      if (submissionData.phone_2) {
        // Remove all non-digit characters
        submissionData.phone_2 = submissionData.phone_2.replace(/\D/g, "");
      }

      // Send the data to the API - use PATCH for update
      await api.patch(`/transport/transports/${id}`, submissionData);

      toast({
        title: "Muvaffaqiyatli",
        description: "Transport ma'lumotlari yangilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      // Navigate back to the list
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
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
                    Masofasi ({formatValue(formData.distance)}){"km"}
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
                  <div className="relative" ref={dropdownRef}>
                    <Input
                      id="region"
                      placeholder="Hududni tanlang yoki kiriting..."
                      value={regionSearch}
                      onChange={(e) => handleNewRegionInput(e.target.value)}
                      className={`w-full ${
                        openRegionCombobox ? "rounded-b-none border-b-0" : ""
                      }`}
                      onFocus={() => setOpenRegionCombobox(true)}
                    />

                    {openRegionCombobox && (
                      <div className="absolute z-10 w-full rounded-b-md border bg-white shadow-md">
                        <div className="max-h-60 overflow-y-auto p-1">
                          {regionSearch.trim() !== "" &&
                            !regions.some(
                              (region) =>
                                region.name.toLowerCase() ===
                                regionSearch.toLowerCase()
                            ) && (
                              <div
                                className="flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    region_id: null,
                                    region_name: regionSearch,
                                  });
                                  setIsNewRegion(true);
                                  setOpenRegionCombobox(false);
                                }}
                              >
                                <span>Yangi hudud sifatida qo'shish: </span>
                                <span className="ml-1 font-medium">
                                  {regionSearch}
                                </span>
                              </div>
                            )}

                          {filteredRegions.length === 0 &&
                          regionSearch.trim() === "" ? (
                            <div className="py-6 text-center text-sm text-gray-500">
                              Hududlar topilmadi
                            </div>
                          ) : (
                            filteredRegions.map((region) => (
                              <div
                                key={region.id}
                                className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-100 ${
                                  formData.region_id === region.id
                                    ? "bg-slate-100"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleRegionSelect(region.id, region.name)
                                }
                              >
                                {region.name}
                                {formData.region_id === region.id && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selected region display */}
                    {(formData.region_id || isNewRegion) && (
                      <div className="mt-1.5 flex items-center text-sm text-gray-500">
                        <span>Tanlangan hudud: </span>
                        <span className="ml-1 font-medium text-gray-700">
                          {formData.region_id
                            ? regions.find(
                                (region) => region.id === formData.region_id
                              )?.name || formData.region_name
                            : isNewRegion
                            ? `${formData.region_name} (yangi)`
                            : ""}
                        </span>
                      </div>
                    )}
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
                  <Label htmlFor="phone">
                    Telefon raqami <span className="text-red-500">*</span>
                  </Label>
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

                <div className="space-y-2">
                  <Label htmlFor="driver_experience_years">
                    Ish tajribasi (yil)
                  </Label>
                  <Input
                    id="driver_experience_years"
                    name="driver_experience_years"
                    type="number"
                    value={formData.driver_experience_years}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver_passport_number">
                    Passport raqami
                  </Label>
                  <Input
                    id="driver_passport_number"
                    name="driver_passport_number"
                    value={formData.driver_passport_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver_license_number">
                    Haydovchilik guvohnomasi
                  </Label>
                  <Input
                    id="driver_license_number"
                    name="driver_license_number"
                    value={formData.driver_license_number}
                    onChange={handleChange}
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

            {/* Vehicle Technical Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-l-4 border-primary pl-3">
                Transport texnik ma'lumotlari
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vin_number">VIN raqami</Label>
                  <Input
                    id="vin_number"
                    name="vin_number"
                    value={formData.vin_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tech_passport_number">
                    Texnik passport raqami
                  </Label>
                  <Input
                    id="tech_passport_number"
                    name="tech_passport_number"
                    value={formData.tech_passport_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engine_number">Dvigatel raqami</Label>
                  <Input
                    id="engine_number"
                    name="engine_number"
                    value={formData.engine_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Ishlab chiqarilgan yil</Label>
                  <Input
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Rangi</Label>
                  <Input
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_date">
                    Ro'yxatga olingan sana
                  </Label>
                  <Input
                    id="registration_date"
                    name="registration_date"
                    type="date"
                    value={formData.registration_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_expiry">Sug'urta muddati</Label>
                  <Input
                    id="insurance_expiry"
                    name="insurance_expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspection_expiry">
                    Texnik ko'rik muddati
                  </Label>
                  <Input
                    id="inspection_expiry"
                    name="inspection_expiry"
                    type="date"
                    value={formData.inspection_expiry}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
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
