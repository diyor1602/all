import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronRight } from "lucide-react";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const deptRes = await api.get("/departments");
      const tikuv = deptRes.data
        .flatMap((m) => m.departments)
        .find((d) => d.name.toLowerCase().includes("tikuv"));
      setGroups(tikuv?.groups ?? []);
    } catch {
      toast({ title: "Xatolik", description: "Guruhlarni olib bo'lmadi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <p className="mt-1 text-sm text-gray-500">Tikuv guruhlarini boshqarish</p>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-16 text-gray-400 shadow-sm">
          <Users className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Guruhlar topilmadi</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((group) => (
          <Link
            key={group.id}
            to={`/superhr/panel/groups/${group.id}`}
            className="group flex items-center justify-between rounded-xl border bg-white px-4 py-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-800 group-hover:text-blue-600">
                {group.name}
              </p>
              {group.responsible_user?.employee?.name && (
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {group.responsible_user.employee.name}
                </p>
              )}
            </div>
            <ChevronRight className="ml-3 h-5 w-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-400" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Groups;
