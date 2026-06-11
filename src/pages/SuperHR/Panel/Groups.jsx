import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Groups = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const deptRes = await api.get("/departments");
      const tikuv = deptRes.data
        .flatMap((m) => m.departments)
        .find((d) => d.name.toLowerCase().includes("tikuv"));

      setData(tikuv);
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Guruhlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {loading && <p className="text-sm text-gray-500">Yuklanmoqda...</p>}

      {!loading && data.length === 0 && (
        <p className="text-sm text-gray-400">Ma'lumot topilmadi.</p>
      )}

      <div className="grid gap-4">
        {data?.groups
          ?.sort((a, b) => a.name.localeCompare(b.name))
          .map((group) => (
            <div key={group.id}>
              <div>{group.name}</div>
              <div>{group.responsible_user?.employee?.name}</div>
              <Link to={`/superhr/panel/groups/${group.id}`}>Batafsil</Link>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Groups;
