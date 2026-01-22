import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Damages = () => {
  const { toast } = useToast();

  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState([]);

  const getDamages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/internalAccountant/qualityControls");
      setDamages(res.data?.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDamages();
  }, []);

  return (
    <div>
      {loading ? (
        <div className="w-full h-screen flex items-center justify-center">
          <Loader size={30} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {damages?.map((damage) => {
            return (
              <div key={damage.id}>
                <img src={damage.image} alt="" className="w-20 object-cover" />
                <div>{damage?.order?.name}</div>
                <div>
                  {damage?.order?.order_model?.sub_models[0]?.submodel?.name}
                </div>
                <div>Xato qilgan xodim: {damage?.employee?.name}</div>
                <div>Izoh: {damage?.description}</div>
                <div>
                  Tekshirgan xodim: {damage?.created_by?.employee?.name}
                </div>
                <div>
                  Ish: {damage?.tarification?.code} {damage?.tarification?.name}
                </div>
                <div>
                  {new Date(damage?.created_at)?.toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Damages;
