import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const levels = {
  bronze: "Bronza",
  silver: "Kumush",
  gold: "Oltin",
};

const Levels = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/employee-level-histories");
        setData(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Ma'lumotlar olishda xatolik yuz berdi",
        });
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  return (
    <div className="w-full overflow-auto">
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Xodim</th>
            <th>Daraja</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((employee, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{employee.employee.name}</td>
              <td>{levels[employee.level]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Levels;
