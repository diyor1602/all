import api from "@/utils/api";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BadgeCheck, Image, OctagonX } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TodayAbsence = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionType, setActionType] = useState(""); // 'absence' or 'holiday'
  const [comment, setComment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const fetchData = async () => {
    try {
      const response = await api.get("/superhr/todayAbsent");
      setData(response.data);

      // Extract unique departments and groups from the data
      const uniqueDepartments = [
        ...new Set(
          response.data.map((item) => item.department).filter(Boolean)
        ),
      ];
      const uniqueGroups = [
        ...new Set(response.data.map((item) => item.group).filter(Boolean)),
      ];
      setDepartments(uniqueDepartments);
      setGroups(uniqueGroups);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ma'lumotlar olishda xatolik yuz berish mumkin",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (employee, type) => {
    setSelectedEmployee(employee);
    setActionType(type);
    setComment("");
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Iltimos, izoh yozing",
      });
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("employee_id", selectedEmployee?.id);
      formData.append("start_date", new Date().toISOString().split("T")[0]);
      formData.append("end_date", new Date().toISOString().split("T")[0]);
      formData.append("comment", comment);

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const endpoint =
        actionType === "holiday"
          ? "/superhr/employeeHolidays"
          : "/superhr/employeeAbsence";

      await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Muvaffaqiyatli",
        description:
          actionType === "holiday"
            ? "Sababli deb qo'shildi"
            : "Sababsiz qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.response?.data?.message || "Xatolik",
        description:
          actionType === "holiday"
            ? "Sababli qo'shishda xatolik yuz berdi"
            : "Sababsiz qo'shishda xatolik yuz berdi",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value === "all" ? "" : value);
    setSelectedGroup(""); // Reset group when department changes

    // Filter groups based on selected department
    if (value && value !== "all") {
      const departmentGroups = [
        ...new Set(
          data
            .filter((item) => item.department === value)
            .map((item) => item.group)
            .filter(Boolean)
        ),
      ];
      setGroups(departmentGroups);
    } else {
      // Reset to all groups when no department is selected
      const allGroups = [
        ...new Set(data.map((item) => item.group).filter(Boolean)),
      ];
      setGroups(allGroups);
    }
  };

  const filteredData = data.filter((item) => {
    const matchesDepartment =
      !selectedDepartment || item.department === selectedDepartment;
    const matchesGroup = !selectedGroup || item.group === selectedGroup;
    return matchesDepartment && matchesGroup;
  });

  return (
    <>
      <div className="text-2xl font-bold mb-2">
        Bugun kelmaganlar. Jami: {filteredData?.length} ta
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <Select
          value={selectedDepartment || "all"}
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Bo'limni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedGroup || "all"}
          onValueChange={(value) =>
            setSelectedGroup(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Guruhni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {groups
              .sort((a, b) => a.localeCompare(b))
              .map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt=""
                className="w-full h-auto max-h-[90vh]"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "holiday" ? (
                <span className="text-green-500">Sababli qo'shish</span>
              ) : (
                <span className="text-red-500">Sababsiz qo'shish</span>
              )}
              <span className="ml-2">({selectedEmployee?.name})</span>
            </DialogTitle>
            <DialogDescription>Iltimos, izoh yozing</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                Izoh
              </Label>
              <Input
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                placeholder="Izoh yozing..."
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="image" className="text-right pt-2">
                Rasm
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="cursor-pointer"
                />
                {preview && (
                  <div className="mt-2 relative">
                    <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full overflow-auto mt-4 shadow-md">
        <table className="w-full border-collapse text-xs bg-white">
          <thead>
            <tr>
              <th className="border p-2 ">№</th>
              <th className="border p-2">F.I.SH</th>
              <th className="border p-2">Bo'lim</th>
              <th className="border p-2">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {filteredData?.sort((a, b) => {
              if (!a.was_on_holiday && a.was_on_holiday !== b.was_on_holiday)
                return -1;
              if (a.was_on_holiday && !b.was_on_holiday) return 1;
              if (!a.was_on_absence && a.was_on_absence !== b.was_on_absence)
                return -1;
              if (a.was_on_absence && !b.was_on_absence) return 1;
              return a.name.localeCompare(b.name);
            }) &&
              filteredData?.map((item, index) => (
                <tr
                  key={index}
                  className={cn(index % 2 === 0 ? "bg-gray-100" : "")}
                >
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">
                    <div>
                      <div className="flex items-center gap-2 justify-between">
                        <Link to={`/superhr/employees/view/${item.id}`}>
                          {item.name}
                        </Link>
                        <div className="flex gap-2 items-center">
                          {item?.image && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedImage(item.image);
                                setIsImageDialogOpen(true);
                              }}
                            >
                              <Image />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(item, "holiday")}
                            disabled={
                              item.was_on_holiday || item.was_on_absence
                            }
                            className={cn(
                              "disabled:opacity-50 border-green-500",
                              item.was_on_holiday || item.was_on_absence
                                ? "hidden"
                                : ""
                            )}
                          >
                            Sababli <BadgeCheck className="text-green-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(item, "absence")}
                            disabled={
                              item.was_on_holiday || item.was_on_absence
                            }
                            className={cn(
                              "disabled:opacity-50 border-red-500",
                              item.was_on_holiday || item.was_on_absence
                                ? "hidden"
                                : ""
                            )}
                          >
                            Sababsiz <OctagonX className="text-red-500" />
                          </Button>
                          {item.was_on_holiday && (
                            <div className="rounded-full bg-green-500 text-white px-2 py-1">
                              {" "}
                              Sababli
                            </div>
                          )}
                          {item.was_on_absence && (
                            <div className="rounded-full bg-red-500 text-white px-2 py-1">
                              {" "}
                              Sababsiz
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="border  p-2">
                    <div className="flex flex-col">
                      <div>{item.department || "-"}</div>
                      <div>{item.group || "-"}</div>
                    </div>
                  </td>
                  <td className="border  p-2">{item.comment || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TodayAbsence;
