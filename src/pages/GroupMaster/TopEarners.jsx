import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const calculateMinutes = (works) => {
  const minutes = parseFloat(
    works?.reduce((acc, work) => acc + parseFloat(work.second), 0) / 60
  )?.toFixed(2);
  const color = minutes >= 2 ? "text-red-500" : "text-green-500";
  return [minutes, color];
};

const TopEarners = () => {
  const { toast } = useToast();

  const [selectedDay, setSelectedDay] = useState(
    new Date()?.toISOString().split("T")[0]
  );
  const [users, setUsers] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedUser, setSelectedUser] = useState({});
  const [imgDialog, setImgDialog] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);

  const handleDirection = (direction) => {
    const currentDate = new Date(selectedDay);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDay(currentDate.toISOString().split("T")[0]);
  };

  const fetchData = async () => {
    try {
      const response = await api.get("/groupMaster/topEarners", {
        params: {
          date: selectedDay,
        },
      });
      const data = await response.data?.top_earners;

      // Calculate max quantity among all employees
      const maxQty = Math.max(
        ...data.map(
          (user) =>
            user.works?.reduce(
              (max, work) => Math.max(max, work.quantity),
              0
            ) || 0
        )
      );
      setMaxQuantity(maxQty);

      setUsers(data);
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Data olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDay]);

  return (
    <>
      <div>
        <div className="flex items-center gap-2 justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirection(-1)}
          >
            <ArrowLeft />
          </Button>
          <Input
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-fit bg-white"
            max={new Date().toISOString().split("T")[0]}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirection(1)}
          >
            <ArrowRight />
          </Button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border border-collapse my-5 bg-white">
            <thead>
              <tr>
                <th className="border border-gray-300 p-1 w-12">№</th>
                <th className="border border-gray-300 p-1">F.I.SH</th>
                <th className="border border-gray-300 p-1">Summa</th>
                <th className="border border-gray-300 p-1">Soni</th>
                <th className="border border-gray-300 p-1">Daqiqa</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <React.Fragment key={index}>
                  <tr
                    key={index}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setExpandedRows((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }));
                    }}
                  >
                    <td className="border border-gray-300 p-1 text-center w-12">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 p-1 max-w-[200px] md:max-w-[auto]">
                      <div className="flex items-center gap-2">
                        {user?.image && (
                          <img
                            src={user?.image}
                            alt={user.employee_name}
                            className="w-10 h-10 rounded-full object-cover object-center cursor-pointer shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser({
                                image: user?.image,
                                name: user?.employee_name,
                              });
                              setImgDialog(true);
                            }}
                          />
                        )}
                        <span className="truncate">
                          {user.employee_name?.split(" ")[0]}
                        </span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      {parseFloat(user.total_earned)?.toLocaleString("en-EN", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      so'm
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      {(() => {
                        const quantity = user.works?.reduce((max, work) => {
                          return Math.max(max, work.quantity);
                        }, 0);
                        const percentage =
                          maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0;
                        let bgColor = "";

                        if (percentage >= 80) {
                          bgColor = "bg-green-100 text-green-800";
                        } else if (percentage >= 40) {
                          bgColor = "bg-yellow-100 text-yellow-800";
                        } else {
                          bgColor = "bg-red-100 text-red-800";
                        }

                        return (
                          <span
                            className={`rounded-full px-2 py-1 text-sm font-medium ${bgColor}`}
                          >
                            {quantity}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <span className={calculateMinutes(user.works)[1]}>
                        {calculateMinutes(user.works)[0]}
                      </span>
                    </td>
                  </tr>
                  {expandedRows[index] && (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-1 text-left">
                                  Ish nomi
                                </th>
                                <th className="border border-gray-300 p-1 text-center">
                                  Soni
                                </th>
                                <th className="border border-gray-300 p-1 text-center">
                                  Sekund
                                </th>
                                <th className="border border-gray-300 p-1 text-right">
                                  Summa
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {user.works
                                ?.sort((a, b) => b.quantity - a.quantity)
                                ?.map((work, workIndex) => (
                                  <tr key={workIndex}>
                                    <td className="border border-gray-300 p-1">
                                      {work.code} - {work.operation}
                                    </td>
                                    <td className="border border-gray-300 p-1 text-center">
                                      {work.quantity}
                                    </td>
                                    <td className="border border-gray-300 p-1 text-center">
                                      {parseFloat(work.second)?.toLocaleString(
                                        "en-EN",
                                        {
                                          maximumFractionDigits: 0,
                                          minimumFractionDigits: 0,
                                        }
                                      )}
                                    </td>
                                    {/* find the maxium tarif quantity */}
                                    <td className="border border-gray-300 p-1 text-right">
                                      {parseFloat(work.earned)?.toLocaleString(
                                        "en-EN",
                                        {
                                          maximumFractionDigits: 0,
                                          minimumFractionDigits: 0,
                                        }
                                      )}{" "}
                                      so'm
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={imgDialog} onOpenChange={setImgDialog}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <img src={selectedUser?.image} alt="" className="w-full h-auto" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopEarners;
