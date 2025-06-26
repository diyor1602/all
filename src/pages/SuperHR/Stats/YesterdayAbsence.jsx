import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BadgeCheck, OctagonX } from "lucide-react";

const YesterdayAbsence = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionType, setActionType] = useState(""); // 'absence' or 'holiday'
  const [comment, setComment] = useState("");

  const fetchData = async () => {
    try {
      const response = await api.get("/superhr/yesterdayAbsent");
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (employeeId, type) => {
    setSelectedEmployee(employeeId);
    setActionType(type);
    setComment("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Iltimos, izoh yozing",
      });
      return;
    }

    try {
      if (actionType === "holiday") {
        await api.post("/superhr/employeeHolidays", {
          employee_id: selectedEmployee,
          start_date: data?.[0]?.absent_date,
          end_date: data?.[0]?.absent_date,
          comment: comment,
        });

        toast({
          title: "Muvaffaqiyatli",
          description: "Sababli deb qo'shildi",
          style: {
            backgroundColor: "green",
            color: "white",
          },
          duration: 1200,
        });
      } else {
        await api.post("/superhr/employeeAbsence", {
          employee_id: selectedEmployee,
          start_date: data?.[0]?.absent_date,
          end_date: data?.[0]?.absent_date,
          comment: comment,
        });

        toast({
          title: "Muvaffaqiyatli",
          description: "Sababsiz qo'shildi",
          style: {
            backgroundColor: "green",
            color: "white",
          },
          duration: 1200,
        });
      }

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
    }
  };

  return (
    <>
      <div className="text-2xl font-bold mb-2">
        Bugun kelgan, kecha (
        {data?.[0]?.absent_date?.split("-").reverse().join(".")}) kelmaganlar.
        Jami: {data?.length} ta
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "holiday"
                ? "Sababli qo'shish"
                : "Sababsiz qo'shish"}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" onClick={handleSubmit}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full overflow-auto">
        <table className="whitespace-nowrap border border-gray-500 w-full border-collapse text-xs bg-white">
          <thead>
            <tr>
              <th className="border border-gray-500 p-2">№</th>
              <th className="border border-gray-500 p-2">F.I.SH</th>
              <th className="border border-gray-500 p-2">Bo'lim</th>
              <th className="border border-gray-500 p-2">Izoh</th>
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
                    <div>
                      <div className="flex items-center gap-2 justify-between">
                        <div>{item.name}</div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(item.id, "holiday")}
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
                            onClick={() => handleOpenDialog(item.id, "absence")}
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
                  <td className="border border-gray-500 p-2">
                    <div className="flex flex-col">
                      <div>{item.department || "-"}</div>
                      <div>{item.group || "-"}</div>
                    </div>
                  </td>
                  <td className="border border-gray-500 p-2">
                    {item.comment || "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default YesterdayAbsence;
