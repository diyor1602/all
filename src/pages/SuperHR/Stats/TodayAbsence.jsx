import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Palmtree } from "lucide-react";

const TodayAbsence = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDialog = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(), "yyyy-MM-dd"),
      comment: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      await api.post("/superhr/employeeHolidays", {
        employee_id: selectedEmployee.id,
        ...formData,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Ta'til muvaffaqiyatli qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });

      setIsDialogOpen(false);
      // Refresh the data
      const response = await api.get("/superhr/todayAbsent");
      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error.response?.data?.message || "Xatolik yuz berdi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/superhr/todayAbsent");
        setData(response.data);
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
    fetchData();
  }, []);

  return (
    <>
      <div className="text-2xl font-bold mb-2">
        Bugun kelmaganlar. Jami: {data?.length} ta
      </div>
      <div className="w-full overflow-auto">
        <table className="whitespace-nowrap border border-gray-500 w-full border-collapse text-xs bg-white">
          <thead>
            <tr>
              <th className="border border-gray-500 p-2">№</th>
              <th className="border border-gray-500 p-2">F.I.SH</th>
              <th className="border border-gray-500 p-2">Bo'lim</th>
              <th className="border border-gray-500 p-2">Lavozim</th>
            </tr>
          </thead>
          <tbody>
            {data?.sort(
              // first show was_on_holiday, then sort by name
              (a, b) => {
                if (a.was_on_holiday && !b.was_on_holiday) return -1;
                if (!a.was_on_holiday && b.was_on_holiday) return 1;
                return a.name.localeCompare(b.name);
              }
            ) &&
              data?.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-500 p-2 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-gray-500 p-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/superhr/employees/view/${item.id}`}
                        className="flex-1"
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <div>{item.name}</div>
                          {item.was_on_holiday && (
                            <div className="rounded-full bg-green-500 text-white px-2 py-1">
                              Ta'tilda
                            </div>
                          )}
                        </div>
                      </Link>
                      {!item.was_on_holiday && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(item)}
                          className="ml-2"
                        >
                          <Palmtree /> Sababli
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-500 p-2">
                    <div className="flex flex-col">
                      <div>{item.department || "-"}</div>
                      <div>{item.group || "-"}</div>
                    </div>
                  </td>
                  <td className="border border-gray-500 p-2">
                    {item.position}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Holiday Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta'til berish</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Xodim</Label>
                <Input value={selectedEmployee.name} disabled />
              </div>
              <div>
                <Label>Boshlanish sanasi</Label>
                <Input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label>Tugash sanasi</Label>
                <Input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={formData.start_date}
                  required
                />
              </div>
              <div>
                <Label>Izoh (ixtiyoriy)</Label>
                <Input
                  type="text"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Izoh qoldirish"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Yuklanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TodayAbsence;
