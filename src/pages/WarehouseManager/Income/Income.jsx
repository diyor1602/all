import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { useNavigate, Routes, Route } from "react-router-dom";
import New from "./New";

const IncomePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/warehouseManager/incoming");
      setIncomes(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Inkazlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kirimlar</h1>
        <Button
          variant="default"
          onClick={() => navigate("/warehouseManager/income/new")}
        >
          <CirclePlus className="h-4 w-4" /> Yangi
        </Button>
      </div>
    </div>
  );
};

const Income = () => {
  return (
    <Routes>
      <Route path="*" element={<IncomePage />} />
      <Route path="new" element={<New />} />
    </Routes>
  );
};

export default Income;
