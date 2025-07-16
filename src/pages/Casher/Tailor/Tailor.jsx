import { useState, useEffect } from "react";
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

const Tailor = () => {
  const { toast } = useToast();

  const [selectedDay, setSelectedDay] = useState(
    new Date()?.toISOString().split("T")[0]
  );
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState({});
  const [imgDialog, setImgDialog] = useState(false);

  const handleDirection = (direction) => {
    const currentDate = new Date(selectedDay);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDay(currentDate.toISOString().split("T")[0]);
  };

  const fetchData = async () => {
    try {
      const response = await api.get("/casher/topEarners", {
        params: {
          date: selectedDay,
        },
      });
      const data = await response.data?.top_earners;
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
        <div className="flex items-center gap-2">
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
                <th className="border border-gray-300 p-2">№</th>
                <th className="border border-gray-300 p-2">F.I.SH</th>
                <th className="border border-gray-300 p-2">Summa</th>
                <th className="border border-gray-300 p-2">Daqiqa</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center gap-2">
                      {user?.image && (
                        <img
                          src={user?.image}
                          alt={user.employee_name}
                          className="w-10 h-10 rounded-full object-cover object-center cursor-pointer"
                          onClick={() => {
                            setSelectedUser({
                              image: user?.image,
                              name: user?.employee_name,
                            });
                            setImgDialog(true);
                          }}
                        />
                      )}
                      <span className="truncate">{user.employee_name}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {parseFloat(user.total_earned)?.toLocaleString("en-EN", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    so'm
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <span className={calculateMinutes(user.works)[1]}>
                      {calculateMinutes(user.works)[0]}
                    </span>
                  </td>
                </tr>
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

export default Tailor;
