import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";

const AddEmployees = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMainDepartmentId, setSelectedMainDepartmentId] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "", // required
    address: "", // required
    phone: "+998", // required
    department_id: "", // required
    group_id: "", // not required
    hiring_date: "", // required
    passport_number: "", // not required
    passport_code: "", // not required
    comment: "", // not required
    birthday: "", // required now
    position_id: "", // required
    role_id: "", // not required
    payment_type: "piece_work", // send it withouth asking
    type: "simple", // send it without asking
    status: "working", // send it without asking
  });

  // New state for the image file
  const [imageFile, setImageFile] = useState(null);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/superhr/departments");
      setDepartments(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bo'limlar ro'yxatini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await api.get("/superhr/positions");
      setPositions(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ishlar ro'yxatini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/superhr/roles");
      setRoles(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Dasturlar ro'yxatini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchPositions();
    fetchRoles();
  }, []);

  // Update sub-departments when main department changes
  useEffect(() => {
    if (selectedMainDepartmentId) {
      const mainDept = departments.find(
        (dept) => dept.id.toString() === selectedMainDepartmentId
      );

      if (mainDept && mainDept.departments) {
        setSubDepartments(mainDept.departments);
      } else {
        setSubDepartments([]);
      }

      // Reset department_id and group_id if main department changed
      setFormData((prev) => ({ ...prev, department_id: "", group_id: "" }));
      setGroups([]);
    }
  }, [selectedMainDepartmentId, departments]);

  // Update groups when department changes
  useEffect(() => {
    if (formData.department_id) {
      // Find selected department object from the sub-departments array
      const department = subDepartments.find(
        (dept) => dept.id.toString() === formData.department_id
      );

      if (department && department.groups) {
        setGroups(department.groups);
      } else {
        setGroups([]);
      }

      // Reset group_id if department changed
      setFormData((prev) => ({ ...prev, group_id: "" }));
    }
  }, [formData.department_id, subDepartments]);

  const formatPhoneNumber = (value) => {
    if (!value) return "+998";
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, "");
    // Ensure the number starts with 998
    if (!phoneNumber.startsWith("998")) {
      return "+998";
    }
    // Format the phone number
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
      phone: formattedNumber,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainDepartmentChange = (value) => {
    setSelectedMainDepartmentId(value);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check required fields
      const requiredFields = [
        "name",
        "address",
        "phone",
        "department_id",
        "position_id",
        "hiring_date",
        "birthday", // Birthday is now required
      ];
      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        toast({
          title: "Diqqat",
          description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();

      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Add image file if exists
      if (imageFile) {
        formDataToSend.append("img", imageFile);
      }

      await api.post("/superhr/employees", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim muvaffaqiyatli qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      navigate("/superhr/employees"); // Redirect to employees list
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Xodimni qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to get main departments and check if a department has sub-departments
  const getMainDepartments = () => {
    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
    }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6 max-w-4xl mx-auto">
        <Button variant="outline" className="mr-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>
        <h1 className="text-2xl font-bold">Yangi xodim qo'shish</h1>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Yangi xodim qo'shish</CardTitle>
          <CardDescription>Yangi xodim ma'lumotlarini kiriting</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Employee Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Xodim rasmi</h3>
              <div className="flex items-center justify-center flex-col">
                <div
                  className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4 overflow-hidden relative cursor-pointer"
                  onClick={triggerFileInput}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Xodim rasmi"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-500">
                      <Upload className="mx-auto h-10 w-10 mb-2" />
                      <p className="text-sm">Rasm yuklash</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                >
                  Rasmni tanlang
                </Button>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Shaxsiy ma'lumotlar</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    F.I.O <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="To'liq ism"
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Manzili <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Yashash manzili"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passport_number">Passport raqami</Label>
                  <Input
                    id="passport_number"
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleInputChange}
                    placeholder="Passport raqami"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passport_code">JSHSHIR</Label>
                  <Input
                    id="passport_code"
                    name="passport_code"
                    maxLength={14}
                    value={formData.passport_code}
                    onChange={handleInputChange}
                    placeholder="JSHSHIR"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday">
                    Tug'ilgan sana <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={handleDateChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hiring_date">
                    Ishga qabul qilingan sana{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hiring_date"
                    name="hiring_date"
                    type="date"
                    value={formData.hiring_date}
                    onChange={handleDateChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ish ma'lumotlari</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="main_department">
                    Asosiy bo'lim <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={handleMainDepartmentChange}
                    value={selectedMainDepartmentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Asosiy bo'limni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {getMainDepartments().map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department_id">
                    Bo'lim <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("department_id", value)
                    }
                    value={formData.department_id}
                    disabled={
                      !selectedMainDepartmentId || subDepartments.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedMainDepartmentId
                            ? "Avval asosiy bo'limni tanlang"
                            : "Bo'limni tanlang"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group_id">Guruh</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("group_id", value)
                    }
                    value={formData.group_id}
                    disabled={!formData.department_id || groups.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.department_id
                            ? "Avval bo'limni tanlang"
                            : groups.length === 0
                            ? "Guruh mavjud emas"
                            : "Guruhni tanlang"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position_id">
                    Lavozim <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("position_id", value)
                    }
                    value={formData.position_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Lavozimni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem
                          key={position.id}
                          value={position.id.toString()}
                        >
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role_id">Dasturi</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("role_id", value)
                    }
                    value={formData.role_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dasturini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Izoh</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Qo'shimcha ma'lumotlar"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/superhr/employees")}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddEmployees;
