import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";

const Groups = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleExpand = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get("/manufacturer/groups");
        setGroups(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Guruhlarni olishda xatolik yuz berdi",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
        <Loader2 className="animate-spin mb-3" size={40} />
        <p>Ma’lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
        Guruhlar
      </h1>

      {groups
        ?.sort((a, b) => a.name.localeCompare(b.name))
        .map((group, index) => {
          const deadline = group.monthlyDeadline;
          const isExpanded = expandedGroups[group.name];
          const outputs =
            group.dailySewingOutputs?.sort((a, b) =>
              b.date.localeCompare(a.date)
            ) || [];

          const lastFive = outputs.slice(0, 5);
          const rest = outputs.slice(5);
          const total = outputs.reduce((a, b) => a + b.quantity, 0);
          const avgQuantity = outputs.length > 0 ? total / outputs.length : 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white shadow-lg rounded-2xl p-5 border border-gray-100"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {group.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Mas’ul: {group.responsibleUser?.name || "Noma’lum"}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3 sm:mt-0">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users size={16} />
                    O‘rtacha{" "}
                    <span className="font-semibold">
                      {formatNumber(group.avgWorkersLast30Days, 0)}
                    </span>{" "}
                    ishchi
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <BarChart3 size={16} />
                    O‘rtacha{" "}
                    <span className="font-semibold">
                      {formatNumber(avgQuantity, 0)}
                    </span>{" "}
                    dona / kun
                  </div>
                </div>
              </div>

              {/* Deadline Section */}
              {deadline && (
                <div
                  className={`rounded-xl p-4 mb-4 border transition-all ${
                    deadline.deadline_exceeded
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {deadline.deadline_exceeded ? (
                      <AlertTriangle className="text-red-500" size={18} />
                    ) : (
                      <CheckCircle className="text-green-500" size={18} />
                    )}
                    <span
                      className={`font-semibold ${
                        deadline.deadline_exceeded
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {deadline.deadline_exceeded
                        ? "Muddatga ulgurmaydi!"
                        : "Jarayon yaxshi ketmoqda"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 items-center text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <span>
                        Muddat:{" "}
                        <strong>
                          {deadline.target_date.split("-").reverse().join(".")}
                        </strong>
                      </span>
                    </div>
                    <div>
                      <strong>{deadline.working_days_until_deadline}</strong>{" "}
                      ish kuni qoldi
                    </div>

                    {deadline?.deadline_exceeded && (
                      <>
                        <div>
                          Kuniga{" "}
                          <strong>
                            {formatNumber(
                              deadline.required_daily_quantity_to_finish,
                              0
                            )}
                          </strong>{" "}
                          tadan chiqarish kerak
                        </div>
                        <div>
                          Qo'chimcha:{" "}
                          <strong>
                            {formatNumber(
                              deadline.required_workers_for_deadline -
                                group.avgWorkersLast30Days,
                              0
                            )}
                          </strong>{" "}
                          ta ishchi kerak
                        </div>
                      </>
                    )}
                    <div className="col-span-2 sm:col-span-1">
                      <strong>{group.monthlyDaysToFinish}</strong> kunda tugata
                      oladi
                    </div>
                  </div>
                </div>
              )}

              {/* Outputs Table */}
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="p-2 text-left">Sana</th>
                      <th className="p-2 text-right">Miqdor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastFive.map((output, idx) => (
                      <tr
                        key={idx}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-2">
                          {output.date.split("-").reverse().join(".")}
                        </td>
                        <td className="p-2 text-right">
                          {formatNumber(output.quantity)}
                        </td>
                      </tr>
                    ))}

                    {isExpanded &&
                      rest.map((output, idx) => (
                        <tr
                          key={idx}
                          className="border-t hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-2">
                            {output.date.split("-").reverse().join(".")}
                          </td>
                          <td className="p-2 text-right">
                            {formatNumber(output.quantity)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t font-medium">
                      <td className="p-2">Jami</td>
                      <td className="p-2 text-right">{formatNumber(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {rest.length > 0 && (
                <div className="flex justify-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(group.name)}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={16} className="mr-1" /> Kamroq
                        ko‘rsatish
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} className="mr-1" /> Ko‘proq
                        ko‘rsatish
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
    </div>
  );
};

export default Groups;
