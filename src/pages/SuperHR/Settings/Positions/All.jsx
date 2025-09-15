import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const colorPalette = [
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-violet-100 text-violet-800 border-violet-200",
];

const All = () => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDep, setSelectedDep] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get("/superhr/positions");
      setRoles(response.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Lavozimlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/superhr/departments");
      const deps = response.data;
      setDepartments(deps);

      if (deps?.length > 0) {
        const firstDep = deps[0];
        setSelectedDep(firstDep);

        if (firstDep.departments?.length > 0) {
          setSelectedSub(firstDep.departments[0]); // ✅ auto select first sub-department
        } else {
          setSelectedSub(null); // fallback to main dep only
        }
      }
    } catch {
      toast({
        title: "Xatolik",
        description: "Bo'limlarni olishda xatolik",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar */}
      <aside className="w-full md:w-72 border-r bg-gradient-to-b from-gray-50 to-gray-100 p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Bo'limlar
          </h2>
        </div>
        <div className="space-y-3">
          {departments?.map((dep, idx) => (
            <div key={idx}>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                  selectedDep?.id === dep.id
                    ? "bg-primary text-white shadow-md"
                    : "hover:bg-primary/10 text-gray-700"
                }`}
                onClick={() => {
                  setSelectedDep(dep);
                  setSelectedSub(dep.departments?.[0] || null);
                }}
              >
                {dep.name}
              </button>
              {selectedDep?.id === dep.id && dep.departments?.length > 0 && (
                <div className="ml-4 mt-2 space-y-1">
                  {dep.departments.map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      className={`block w-full text-left px-3 py-1 rounded-md text-sm transition ${
                        selectedSub?.id === sub.id
                          ? "bg-primary/80 text-white shadow"
                          : "hover:bg-primary/10 text-gray-600"
                      }`}
                      onClick={() => setSelectedSub(sub)}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 bg-white">
        {/* Search */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Users className="w-6 h-6 text-primary" />
            Lavozimlar
          </h1>
          <Button asChild size="sm" className="shadow-sm">
            <Link to="/superhr/settings/positions/add">
              <Plus className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roles.filter((role) => role.department_id === selectedSub?.id)
            .length > 0 ? (
            roles
              .filter((role) => role.department_id === selectedSub?.id)
              .map((role, idx) => {
                const colorClass = colorPalette[idx % colorPalette.length];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`rounded-xl shadow-md hover:shadow-xl transition border ${colorClass}`}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold truncate">
                          {role.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          asChild
                          className="w-full rounded-lg shadow-sm"
                          variant="secondary"
                        >
                          <Link to={`/superhr/settings/positions/${role.id}`}>
                            Batafsil
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
          ) : (
            <p className="text-gray-500">Hech qanday lavozim topilmadi</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default All;
