import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "lucide-react";

const OwnDamages = () => {
  const { toast } = useToast();

  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(false);

  const getDamages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/groupMaster/qualityControls");
      setDamages(res.data);
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
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
        <div className="w-full h-[95vh] flex flex-col items-center justify-center">
          <Loader className="animate-spin" size={28} />
          Yuklanmoqda
        </div>
      ) : (
        <>
          {damages
            ?.sort(
              (a, b) => b.quality_controls?.length - a.quality_controls?.length,
            )
            ?.map((d, index) => {
              return (
                <div key={index}>
                  <div className="flex items-center gap-2">
                    {d.img ? (
                      <img
                        src={d.img}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full object-cover shrink-0 bg-gray-200 flex items-center justify-center">
                        {d.name?.charAt(0)}
                      </div>
                    )}
                    <div>{d.name}</div>
                  </div>
                  <div>{d.quality_controls?.length} ta</div>
                  <div>
                    {d.quality_controls?.map((q, index) => {
                      return (
                        <div key={index}>
                          <img
                            src={q.image}
                            className="w-full h-20 object-cover"
                          />
                          <div>{q?.order?.name}</div>
                          <div>
                            {
                              q?.order?.order_model?.sub_models[0]?.submodel
                                ?.name
                            }
                          </div>
                          {q?.stage_tarification && (
                            <div>{q?.stage_tarification?.name}</div>
                          )}
                          <div>{q?.description}</div>
                          <div>
                            {new Date(q?.created_at)?.toLocaleDateString(
                              "ru-RU",
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </>
      )}
    </div>
  );
};

export default OwnDamages;
