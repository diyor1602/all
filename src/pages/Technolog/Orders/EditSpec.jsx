import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EditSpec = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSpec = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/technologist/specification/category/${id}`
      );
      setSpec(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Spesifikatsiyani olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpec();
  }, [id, toast]);

  return <div>EditSpec</div>;
};

export default EditSpec;
