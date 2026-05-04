import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const AllRequisitions = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getRequisitions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/warehouseManager/requisition");
      setData(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRequisitions();
  }, []);

  return (
    <div>
      <Button asChild>
        <Link to="/warehouseManager/requisitions/add">
          <Plus />
          Qo'shish
        </Link>
      </Button>
    </div>
  );
};

export default AllRequisitions;
