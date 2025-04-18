"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

const EditEmployees = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [selectedMainDepartmentId, setSelectedMainDepartmentId] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Use a ref instead of state to track initial setup
  const isInitialSetupRef = useRef(true);
  // Track if department was manually changed by user
  const departmentChangedByUserRef = useRef(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "+998",
    department_id: "",
    group_id: "",
    hiring_date: "",
    passport_number: "",
    passport_code: "",
    comment: "",
    birthday: "",
    position_id: "",
    role_id: "",
    payment_type: "piece_work",
    type: "simple",
    status: "working",
  });

  // New state for the image file
  const [imageFile, setImageFile] = useState(null);

  // Helper function to normalize IDs to strings
  const normalizeId = (id) => {
    return id !== null && id !== undefined ? String(id) : "";
  };

  // Fetch employee data
  const fetchEmployeeData = async () => {
    try {
      const res = await api.get(`/superhr/employees/${id}`);
      const employee = res.data.data; // Data is nested under data property

      // Set image preview if exists
      if (employee.img) {
        setImagePreview(employee.img);
      }

      // Format dates - parse date strings to remove time part
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        // Handle different date formats, could be "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS+TZ"
        return dateString.split(" ")[0].split("T")[0];
      };

      // Get department ID and main department ID
      const departmentId = normalizeId(employee.department?.id);
      const mainDeptId = normalizeId(employee.department?.main_department_id);
      const groupId = normalizeId(employee.group?.id);

      // First, set up the main department
      setSelectedMainDepartmentId(mainDeptId);

      // Find the main department and set up sub-departments
      const mainDept = departments.find(
        (dept) => normalizeId(dept.id) === mainDeptId
      );
      if (mainDept && mainDept.departments) {
        setSubDepartments(mainDept.departments);

        // Find the department and set up groups
        const dept = mainDept.departments.find(
          (d) => normalizeId(d.id) === departmentId
        );
        if (dept && dept.groups) {
          setGroups(dept.groups);
        }
      }

      // Now set the rest of the form data
      const positionId = normalizeId(employee.position_id);

      let roleId = "";
      if (employee.user && employee.user.role) {
        roleId = normalizeId(employee.user.role.id);
      }

      // Directly set form data with all values
      setFormData({
        name: employee.name || "",
        address: employee.address || "",
        phone: employee.phone || "+998", // Phone is already formatted
        department_id: departmentId,
        group_id: groupId,
        hiring_date: formatDateForInput(employee.hiring_date),
        passport_number: employee.passport_number || "",
        passport_code: employee.passport_code || "",
        comment: employee.comment || "",
        birthday: formatDateForInput(employee.birthday),
        position_id: positionId,
        role_id: roleId,
        payment_type: employee.payment_type || "piece_work",
        type: employee.type || "simple",
        status: employee.status || "working",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xodim ma'lumotlarini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/superhr/departments");
      setDepartments(res.data);
      return res.data;
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bo'limlar ro'yxatini olishda xatolik",
        variant: "destructive",
      });
      return [];
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
      setRoles((prev) => [
        ...prev,
        { id: "none", name: "No Role", description: "O'chirish" },
      ]);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Dasturlar ro'yxatini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      setFetchingData(true);
      isInitialSetupRef.current = true;
      departmentChangedByUserRef.current = false;

      try {
        // First load all reference data
        const depts = await fetchDepartments();
        await Promise.all([fetchPositions(), fetchRoles()]);

        // Set departments first so they're available for the employee data
        setDepartments(depts);

        // Then load employee data after reference data is ready
        await fetchEmployeeData();
      } finally {
        setFetchingData(false);
        // Keep isInitialSetupRef.current as true until effects have run
        // We'll set it to false after a delay
        setTimeout(() => {
          isInitialSetupRef.current = false;
        }, 1000);
      }
    };

    fetchInitialData();
  }, [id]);

  // Handle main department changes
  useEffect(() => {
    if (!selectedMainDepartmentId) {
      setSubDepartments([]);
      return;
    }

    const mainDept = departments.find(
      (dept) => normalizeId(dept.id) === selectedMainDepartmentId
    );

    if (mainDept && mainDept.departments) {
      setSubDepartments(mainDept.departments);
    } else {
      setSubDepartments([]);
    }

    // Only reset department_id and group_id if it's not initial data loading
    // and the change was made by the user
    if (
      !fetchingData &&
      !isInitialSetupRef.current &&
      departmentChangedByUserRef.current
    ) {
      setFormData((prev) => ({ ...prev, department_id: "", group_id: "" }));
    }
  }, [selectedMainDepartmentId, departments, fetchingData]);

  // Update groups when department changes
  useEffect(() => {
    if (!formData.department_id) return;

    // Find selected department object from the sub-departments array
    const department = subDepartments.find(
      (dept) => normalizeId(dept.id) === formData.department_id
    );

    if (department && department.groups) {
      setGroups(department.groups);
    } else {
      setGroups([]);
    }

    // Only reset group_id if it's not initial data loading and not initial setup
    // and the department was changed by the user
    if (
      !fetchingData &&
      !isInitialSetupRef.current &&
      departmentChangedByUserRef.current
    ) {
      // Check if the current group_id is available in the new department
      const groupExists = department?.groups?.some(
        (g) => normalizeId(g.id) === formData.group_id
      );

      if (!groupExists) {
        setFormData((prev) => ({ ...prev, group_id: "" }));
      }
    }
  }, [formData.department_id, subDepartments, fetchingData]);

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

  const handleResetPassword = async () => {
    setIsResetting(true);
    try {
      await api.post(`/superhr/resetPassword/${id}`);
      toast({
        title: "Muvaffaqiyatli",
        description: "Parol muvaffaqiyatli tiklandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Parol tiklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
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
    if (name === "department_id") {
      departmentChangedByUserRef.current = true;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainDepartmentChange = (value) => {
    departmentChangedByUserRef.current = true;
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
        "birthday",
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
        if (key == "phone") {
          formDataToSend.append(key, formData[key].replace(/\s/g, ""));
        } else if (key == "role_id") {
          formDataToSend.append(
            key,
            formData[key] === "none" ? null : formData[key]
          );
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add image file if exists
      if (imageFile) {
        formDataToSend.append("img", imageFile);
      }

      formDataToSend.append("_method", "PATCH");
      await api.post(`/superhr/employees/${id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim ma'lumotlari muvaffaqiyatli yangilandi",
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
          "Xodim ma'lumotlarini yangilashda xatolik yuz berdi",
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

  if (fetchingData) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Ma'lumotlar yuklanmoqda...
          </h2>
          <p>Iltimos, kutib turing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6 max-w-4xl mx-auto">
        <Button variant="outline" className="mr-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>
        <h1 className="text-2xl font-bold">Xodim ma'lumotlarini tahrirlash</h1>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Xodim ma'lumotlarini tahrirlash</CardTitle>
          <CardDescription>Xodim ma'lumotlarini yangilang</CardDescription>
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
                      src={imagePreview || "/placeholder.svg"}
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
                    maxLength={17}
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
                        <SelectItem key={dept.id} value={normalizeId(dept.id)}>
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
                        <SelectItem key={dept.id} value={normalizeId(dept.id)}>
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
                        <SelectItem
                          key={group.id}
                          value={normalizeId(group.id)}
                        >
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
                          value={normalizeId(position.id)}
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
                        <SelectItem key={role.id} value={normalizeId(role.id)}>
                          {role.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Holati</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                    value={formData.status}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Holatni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">Ishlamoqda</SelectItem>
                      <SelectItem value="kicked">
                        Ishdan bo'shatilgan
                      </SelectItem>
                      <SelectItem value="reserv">Zaxirada</SelectItem>
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
              onClick={() => setIsDialogOpen(true)}
              disabled={isResetting}
              variant="destructive"
            >
              {isResetting ? "Tiklanmoqda..." : "Parolni tiklash"}
            </Button>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parolni tiklash</DialogTitle>
            <DialogDescription>
              Xodimning parolini tiklashga ishonchingiz komilmi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Button
                onClick={handleResetPassword}
                disabled={isResetting}
                variant="destructive"
              >
                {isResetting ? "Tiklanmoqda..." : "Parolni tiklash"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Bekor qilish
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditEmployees;
