import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  ChartColumnIncreasing,
  ChartNoAxesCombined,
  Medal,
  NotepadText,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import YesterdayAbsence from "./SuperHR/Stats/YesterdayAbsence";
import { Input } from "@/components/ui/input";

const DailyResults = () => {
  // App data states - these will only be used after authentication
  const [outputs, setOutputs] = useState([]);
  const [exampleOutputs, setExampleOutputs] = useState([]);
  const [groupEarnings, setGroupEarnings] = useState([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [aupCount, setAupCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Try to get date from localStorage first, otherwise use current date
    const savedDate = localStorage.getItem("selectedDate");
    if (savedDate) {
      return savedDate;
    }
    const date = new Date();
    date.setHours(date.getHours() + 5);
    return date.toISOString()?.split("T")[0];
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  // Always define refs at the top level
  const dataIntervalRef = useRef(null);
  const dateTimerRef = useRef(null);

  // Initialize app data and timers after authentication
  const initializeApp = () => {
    // Initialize date timer
    dateTimerRef.current = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Initial data load
    fetchData();
  };

  // Set up data refresh interval
  useEffect(() => {
    // Clear existing interval
    if (dataIntervalRef.current) {
      clearInterval(dataIntervalRef.current);
    }

    // Set new interval
    dataIntervalRef.current = setInterval(fetchData, 60000);

    // Cleanup
    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
    };
  }, [selectedDate]);

  useEffect(() => {
    initializeApp();
  }, []);

  // Clean up all timers and resources on unmount
  useEffect(() => {
    return () => {
      if (dateTimerRef.current) clearInterval(dateTimerRef.current);
      if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
    };
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      const response = await api.get("/sewingOutputs", {
        params: {
          start_date: selectedDate,
        },
      });
      const data = await response.data;

      // Process the data
      processOutputData(data.sewing_outputs);
      processExampleOutputData(data.example_outputs);
      setEmployeeCount(data.simple);
      setAupCount(data.aup);
      setGroupEarnings(data.group_earnings);
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Data olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Save selectedDate to localStorage whenever it changes
  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem("selectedDate", selectedDate);
    }
  }, [selectedDate]);

  const handleNavigate = (id) => {
    if (localStorage.getItem("role") === "supervisor") {
      navigate("/supervisor/orders/" + id);
    }
  };

  const processOutputData = (outputsData) => {
    // Sort by progress percentage (descending)
    const sortedOutputs = [...outputsData]
      .map((output) => {
        const progressPercentage =
          output.today_plan > 0
            ? Math.round((output.today_quantity / output.today_plan) * 100)
            : 0;

        return {
          ...output,
          progressPercentage,
        };
      })
      .sort((a, b) => b.progressPercentage - a.progressPercentage);

    setOutputs(sortedOutputs);
  };

  const processExampleOutputData = (outputsData) => {
    // Sort by progress percentage (descending)
    const sortedOutputs = [...outputsData]
      .map((output) => {
        const progressPercentage =
          output.today_plan > 0
            ? Math.round((output.today_quantity / output.today_plan) * 100)
            : 0;

        return {
          ...output,
          progressPercentage,
        };
      })
      .sort((a, b) => b.progressPercentage - a.progressPercentage);

    setExampleOutputs(sortedOutputs);
  };

  const formattedTime = currentDateTime.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Get medal for rank
  const getMedalForRank = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400" size={16} />;
      case 2:
        return <Medal className="text-gray-400" size={16} />;
      case 3:
        return <Medal className="text-yellow-700" size={16} />;
      default:
        return (
          <span className="font-medium text-gray-500 text-xs">{rank}</span>
        );
    }
  };

  // Get progress bar color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    return "bg-yellow-500";
  };

  const getTextColor = (percentage) => {
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    return "text-yellow-600";
  };

  const getProgressStyle = (percentage) => {
    if (percentage >= 100) {
      return {
        bg: "from-emerald-500 to-green-600",
        text: "text-emerald-600",
      };
    }
    if (percentage >= 70) {
      return {
        bg: "from-blue-500 to-cyan-600",
        text: "text-blue-600",
      };
    }
    return {
      bg: "from-amber-500 to-orange-600",
      text: "text-amber-600",
    };
  };

  // Main app content
  return (
    <>
      {localStorage.getItem("role") === "superhr" && (
        <div className="mb-4">
          <YesterdayAbsence />
        </div>
      )}

      <div className="mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <Input
                type="date"
                className="bg-white"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setSelectedDate(newDate);
                }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-800 font-mono">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-col">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Kiritilgan reja
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {outputs.reduce(
                    (total, output) => total + output.today_plan,
                    0,
                  )}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <NotepadText className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Real natija
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {outputs.reduce(
                    (total, output) => total + output.today_quantity,
                    0,
                  )}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl shadow-lg ${
                  outputs.reduce(
                    (total, output) => total + output.today_quantity,
                    0,
                  ) >=
                  outputs.reduce(
                    (total, output) => total + output.today_plan,
                    0,
                  )
                    ? "bg-gradient-to-r from-emerald-500 to-green-600"
                    : "bg-gradient-to-r from-red-500 to-red-700"
                }`}
              >
                <ChartColumnIncreasing className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Jami natija
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {outputs.reduce(
                    (total, output) => total + output.total_quantity,
                    0,
                  )}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-pink-500 to-pink-700 rounded-xl shadow-lg">
                <ChartNoAxesCombined className="text-white" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Jami ishchilar
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  <span className="text-green-500">{employeeCount}</span> /{" "}
                  {employeeCount + aupCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="text-white" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">AUP</p>
                <p className="text-2xl font-bold text-slate-800">{aupCount}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-xl shadow-lg">
                <Users className="text-white" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Bajarilgan o'rtacha plan
                </p>
                {(() => {
                  // Calculate average progress across all outputs
                  const avgProgress =
                    outputs.length > 0
                      ? Math.round(
                          outputs.reduce((sum, output) => {
                            const progress =
                              output.today_plan > 0
                                ? (output.today_quantity / output.today_plan) *
                                  100
                                : 0;
                            return sum + progress;
                          }, 0) / outputs.length,
                        )
                      : 0;
                  const style = getProgressStyle(avgProgress);
                  return (
                    <p className={`text-2xl font-bold ${style.text}`}>
                      {avgProgress}%
                    </p>
                  );
                })()}
              </div>
              <div
                className={`p-3 rounded-xl shadow-lg bg-gradient-to-r ${(() => {
                  // Use the same average progress for the background style
                  const avgProgress =
                    outputs.length > 0
                      ? Math.round(
                          outputs.reduce((sum, output) => {
                            const progress =
                              output.today_plan > 0
                                ? (output.today_quantity / output.today_plan) *
                                  100
                                : 0;
                            return sum + progress;
                          }, 0) / outputs.length,
                        )
                      : 0;
                  return getProgressStyle(avgProgress).bg;
                })()}`}
              >
                <ChartColumnIncreasing className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-md p-0 sm:p-4 md:p-6 mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="sticky top-0 z-10 bg-indigo-50">
                <tr className="border-b border-indigo-100">
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-center text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    #
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Model
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Guruh
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-center text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Ishchilar
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-center text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Reja
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-center text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Natija
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-center text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Jami natija
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-center text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {outputs.map((output, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={`${output.model.name}-${output.group.name}`}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        output.hasChanged ? "animate-highlight" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigate(output.order_id);
                      }}
                    >
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        {getMedalForRank(rank)}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        {output.model.name}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger>
                              <p>{output?.group?.name}</p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{output?.responsibleUser}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center">
                        <span className="font-bold text-indigo-600">
                          {output.employee_count}
                        </span>
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold text-gray-700">
                        {output.today_plan}
                      </td>
                      <td
                        className={`py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold ${
                          output.today_quantity >= output.today_plan
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {output.today_quantity}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold text-indigo-600">
                        {output.total_quantity}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${getProgressColor(
                                output.progressPercentage,
                              )} h-2 rounded-full`}
                              style={{
                                width: `${Math.min(
                                  output.progressPercentage,
                                  100,
                                )}%`,
                                animation: "fillProgress 1s ease-out",
                              }}
                            ></div>
                          </div>
                          <span
                            className={`ml-1 sm:ml-2 text-xs sm:text-sm font-bold ${getTextColor(
                              output.progressPercentage,
                            )}`}
                          >
                            {output.progressPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {exampleOutputs.map((output, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={`${output.model.name}-${output.group.name}`}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        output.hasChanged ? "animate-highlight" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigate(output.order_id);
                      }}
                    >
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        {getMedalForRank(rank)}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        {output.model.name}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger>
                              <p>{output?.group?.name}</p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{output?.responsibleUser}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center">
                        <span className="font-bold text-indigo-600">
                          {output.employee_count}
                        </span>
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold text-gray-700">
                        {output.today_plan}
                      </td>
                      <td
                        className={`py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold ${
                          output.today_quantity >= output.today_plan
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {output.today_quantity}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold text-indigo-600">
                        {output.total_quantity}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${getProgressColor(
                                output.progressPercentage,
                              )} h-2 rounded-full`}
                              style={{
                                width: `${Math.min(
                                  output.progressPercentage,
                                  100,
                                )}%`,
                                animation: "fillProgress 1s ease-out",
                              }}
                            ></div>
                          </div>
                          <span
                            className={`ml-1 sm:ml-2 text-xs sm:text-sm font-bold ${getTextColor(
                              output.progressPercentage,
                            )}`}
                          >
                            {output.progressPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg shadow-md">
        <div className="min-w-full overflow-hidden">
          <table className="w-full">
            <thead className="bg-indigo-50 dark:bg-indigo-900/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider border-b border-indigo-100">
                  Guruh
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider border-b border-indigo-100">
                  Davomat
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider border-b border-indigo-100">
                  Qilgan ishi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider border-b border-indigo-100">
                  O'rtacha summa
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider border-b border-indigo-100">
                  Jami topilgan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {groupEarnings
                ?.sort(
                  (a, b) =>
                    parseFloat(b.per_employee_earning) -
                    parseFloat(a.per_employee_earning),
                )
                ?.map((groupEarning, index) => (
                  <tr
                    key={index}
                    className="hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-800">
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <p>{groupEarning.group_name}</p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{groupEarning.responsibleUser}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-indigo-600">
                      {groupEarning.attendance_count || "0"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-indigo-600">
                      {parseFloat(groupEarning.quantity || 0)?.toLocaleString(
                        "ru-RU",
                        {
                          maximumFractionDigits: 0,
                        },
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-indigo-600">
                      {parseFloat(
                        groupEarning.per_employee_earning || 0,
                      )?.toLocaleString("ru-RU", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-green-600 dark:text-green-400">
                      {parseFloat(
                        groupEarning.today_earning || 0,
                      )?.toLocaleString("ru-RU", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DailyResults;
