import { Link, useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DepartmenDetails = () => {
  const { toast } = useToast();
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [percentageOpen, setPercentageOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newPercentage, setNewPercentage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ceo/departments/${id}`);
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    // calculate available percentage
    const availablePercentage =
      100 -
      data?.employees?.reduce(
        (acc, employee) =>
          acc +
          (selectedEmployee?.id === employee?.id
            ? 0
            : parseFloat(employee?.percentage)),
        0
      );

    if (newPercentage > availablePercentage) {
      toast({
        title: "Diqqat",
        description: `Jami foiz 100 dan o'tib ketmoqda!
         ${availablePercentage?.toFixed(2)}% kirita olasiz!`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/ceo/employeePercentage/${selectedEmployee?.id}`, {
        percentage: newPercentage,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Ulush o'zgartirildi",
        variant: "default",
      });
      fetchData();
      setPercentageOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ulush o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>{data?.name}</h2>
      <div className="w-full overflow-auto mt-4">
        <table
          className={
            loading
              ? "whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs w-full opacity-50"
              : "whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs w-full"
          }
        >
          <thead>
            <tr className="text-center">
              <th className="py-1 px-2 border border-gray-300">№</th>
              <th className="py-1 px-2 border border-gray-300">Rasmi</th>
              <th className="py-1 px-2 border border-gray-300">Xodim</th>
              <th className="py-1 px-2 border border-gray-300">Lavozimi</th>
              <th className="py-1 px-2 border border-gray-300">Ulushi %</th>
            </tr>
          </thead>
          <tbody>
            {data?.employees
              ?.sort((a, b) => b?.percentage - a?.percentage)
              ?.map((employee, index) => (
                <tr key={index}>
                  <td className="py-1 px-2 border border-gray-300 text-center">
                    {index + 1}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {employee?.img ? (
                      <img
                        src={employee?.img}
                        alt={employee?.name}
                        className="w-10 h-10 rounded-full object-cover m-auto"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setImgOpen(true);
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 m-auto flex items-center justify-center">
                        {employee?.name?.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    <Link
                      to={`/ceo/salary/${employee?.id}`}
                      className="cursor-pointer"
                    >
                      {employee?.name}
                    </Link>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {employee?.position}
                  </td>
                  <td className="py-1 px-2 border border-gray-300 text-center">
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setNewPercentage(employee?.percentage);
                        setSelectedEmployee(employee);
                        setPercentageOpen(true);
                      }}
                    >
                      {employee?.percentage}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                className="py-1 px-2 border border-gray-300 text-right"
                colSpan={4}
              >
                Jami
              </td>
              <td
                className={`py-1 px-2 border border-gray-300 text-center ${
                  data?.employees?.reduce(
                    (acc, employee) => acc + parseFloat(employee?.percentage),
                    0
                  ) > 100
                    ? "text-red-500"
                    : ""
                }`}
              >
                {data?.employees?.reduce(
                  (acc, employee) => acc + parseFloat(employee?.percentage),
                  0
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.name}</DialogTitle>
            <DialogDescription>{selectedEmployee?.position}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-auto">
            <img src={selectedEmployee?.img} alt={selectedEmployee?.name} />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={percentageOpen} onOpenChange={setPercentageOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.name}</DialogTitle>
            <DialogDescription>{selectedEmployee?.position}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] flex flex-col gap-2">
            <Input
              value={newPercentage}
              onChange={(e) => setNewPercentage(e.target.value)}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setPercentageOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Yuklanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmenDetails;
