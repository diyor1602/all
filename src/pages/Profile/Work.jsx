import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const formatNumber = (num) => {
  return parseFloat(num).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const Work = ({ userData }) => {
  const logs = userData.employee_tarification_logs;
  const [activeTab, setActiveTab] = useState("model");
  const [expanded, setExpanded] = useState(null);

  const tabs = [
    { id: "model", title: "Model", subtitle: "bo'yicha" },
    { id: "day", title: "Kun", subtitle: "bo'yicha" },
  ];

  return (
    <div className="mt-4">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setExpanded(null); // reset expanded when tab changes
              }}
              className={`p-3 rounded-xl text-center shadow-sm cursor-pointer transition-all duration-300 
                ${
                  isActive
                    ? "bg-green-600 text-white scale-[1.03] shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              <p className="font-bold text-base">{tab.title}</p>
              <p
                className={`text-xs ${
                  isActive ? "text-green-100" : "text-gray-500"
                }`}
              >
                {tab.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "model" &&
        (logs?.length > 0 ? (
          <div className="space-y-5">
            {(() => {
              const groupedByModel = {};

              logs?.forEach((log) => {
                const modelId = log.model?.id || "unknown";
                const modelName = log.model?.name || "Noma'lum model";
                if (!groupedByModel[modelId]) {
                  groupedByModel[modelId] = {
                    modelName,
                    logs: [],
                  };
                }
                groupedByModel[modelId].logs.push(log);
              });

              return (
                <div className="space-y-5">
                  {Object.entries(groupedByModel)
                    .sort((a, b) =>
                      a[1].modelName.localeCompare(b[1].modelName)
                    )
                    .map(([modelId, group], index) => {
                      const isOpen = expanded === modelId;

                      const workMap = {};
                      group.logs.forEach((log) => {
                        const workCode = log.tarification?.code || "NOMA'LUM";
                        const workName =
                          log.tarification?.name || "Noma'lum ish";
                        if (!workMap[workCode]) {
                          workMap[workCode] = {
                            name: workName,
                            totalQty: 0,
                            totalSum: 0,
                          };
                        }
                        workMap[workCode].totalQty += log.quantity;
                        workMap[workCode].totalSum += parseFloat(
                          log.amount_earned || 0
                        );
                      });

                      const totalSumForModel = group.logs.reduce(
                        (sum, log) => sum + parseFloat(log.amount_earned || 0),
                        0
                      );

                      const colors = [
                        "from-blue-100 to-blue-200",
                        "from-green-100 to-green-200",
                        "from-yellow-100 to-yellow-200",
                        "from-purple-100 to-purple-200",
                        "from-pink-100 to-pink-200",
                        "from-indigo-100 to-indigo-200",
                      ];
                      const colorClass = colors[index % colors.length];

                      return (
                        <div
                          key={modelId}
                          className="rounded-xl overflow-hidden shadow-sm"
                        >
                          {/* Model Header */}
                          <div
                            onClick={() => setExpanded(isOpen ? null : modelId)}
                            className={`cursor-pointer p-4 bg-gradient-to-r ${colorClass} flex justify-between items-center`}
                          >
                            <div className="font-semibold text-gray-800">
                              {group.modelName}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-800 text-sm">
                                {formatNumber(totalSumForModel)} so'm
                              </span>
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Works */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="px-4 pb-4 pt-3 space-y-3"
                              >
                                {Object.entries(workMap)
                                  .sort((a, b) => a[0].localeCompare(b[0]))
                                  .map(([code, data], idx) => {
                                    const cardColors = [
                                      "from-pink-100 to-pink-50",
                                      "from-blue-100 to-blue-50",
                                      "from-green-100 to-green-50",
                                      "from-yellow-100 to-yellow-50",
                                      "from-indigo-100 to-indigo-50",
                                      "from-purple-100 to-purple-50",
                                    ];
                                    const bgClass =
                                      cardColors[idx % cardColors.length];

                                    return (
                                      <div
                                        key={code}
                                        className={`p-4 rounded-xl shadow-md bg-gradient-to-br ${bgClass} 
                        flex flex-col gap-3 transition-transform hover:scale-[1.02]`}
                                      >
                                        {/* Code + Work Name */}
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="font-bold text-gray-800 text-sm">
                                              {code}
                                            </div>
                                            <div className="text-gray-600 text-xs">
                                              {data.name}
                                            </div>
                                          </div>
                                          <CheckCircle2 className="w-5 h-5 text-green-600 opacity-70" />
                                        </div>

                                        {/* Quantity + Sum */}
                                        <div className="flex justify-between items-center">
                                          <div className="text-gray-700 text-sm">
                                            <span className="font-semibold text-base">
                                              {data.totalQty}
                                            </span>{" "}
                                            ta
                                          </div>
                                          <div className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                                            {formatNumber(data.totalSum)} so'm
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              );
            })()}
          </div>
        ) : (
          <EmptyState />
        ))}

      {activeTab === "day" &&
        (logs?.length > 0 ? (
          <div className="space-y-5">
            {(() => {
              const groupedByDay = {};

              logs?.forEach((log) => {
                const day = log.date || "unknown";
                if (!groupedByDay[day]) {
                  groupedByDay[day] = [];
                }
                groupedByDay[day].push(log);
              });

              return (
                <div className="space-y-5">
                  {Object.entries(groupedByDay)
                    .sort((a, b) => new Date(b[0]) - new Date(a[0])) // latest first
                    .map(([day, dayLogs], index) => {
                      const isOpen = expanded === day;

                      const totalSumForDay = dayLogs.reduce(
                        (sum, log) => sum + parseFloat(log.amount_earned || 0),
                        0
                      );

                      const colors = [
                        "from-orange-100 to-orange-200",
                        "from-teal-100 to-teal-200",
                        "from-red-100 to-red-200",
                        "from-cyan-100 to-cyan-200",
                        "from-lime-100 to-lime-200",
                      ];
                      const colorClass = colors[index % colors.length];

                      return (
                        <div
                          key={day}
                          className="rounded-xl overflow-hidden shadow-sm"
                        >
                          {/* Day Header */}
                          <div
                            onClick={() => setExpanded(isOpen ? null : day)}
                            className={`cursor-pointer p-4 bg-gradient-to-r ${colorClass} flex justify-between items-center`}
                          >
                            <div className="text-gray-800 font-semibold">
                              {day?.split("-").reverse().join(".")}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-800 text-sm">
                                {formatNumber(totalSumForDay)} so'm
                              </span>
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Works */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="px-4 pb-4 pt-3 space-y-3"
                              >
                                {dayLogs
                                  ?.sort((a, b) =>
                                    a.tarification?.code?.localeCompare(
                                      b.tarification?.code,
                                      undefined,
                                      { numeric: true, sensitivity: "base" }
                                    )
                                  )
                                  ?.map((log, idx) => {
                                    const cardColors = [
                                      "from-sky-100 to-sky-50",
                                      "from-rose-100 to-rose-50",
                                      "from-emerald-100 to-emerald-50",
                                      "from-violet-100 to-violet-50",
                                    ];
                                    const bgClass =
                                      cardColors[idx % cardColors.length];

                                    return (
                                      <div
                                        key={log.id}
                                        className={`p-4 rounded-xl shadow-md bg-gradient-to-br ${bgClass} flex flex-col gap-3 transition-transform hover:scale-[1.02]`}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="font-bold text-gray-800 text-sm">
                                              {log.tarification?.code ||
                                                "NOMA'LUM"}
                                            </div>
                                            <div className="text-gray-600 text-xs">
                                              {log.tarification?.name ||
                                                "Noma'lum ish"}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              Model: {log.model?.name} |{" "}
                                              {log.submodel?.name}
                                            </div>
                                          </div>
                                          <CheckCircle2 className="w-5 h-5 text-green-600 opacity-70" />
                                        </div>

                                        <div className="flex justify-between items-center">
                                          <div className="text-gray-700 text-sm">
                                            <span className="font-semibold text-base">
                                              {log.quantity}
                                            </span>{" "}
                                            ta
                                          </div>
                                          <div className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                                            {formatNumber(log.amount_earned)}{" "}
                                            so'm
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              );
            })()}
          </div>
        ) : (
          <EmptyState />
        ))}
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-8">
    <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-500 text-sm">
      Tanlangan sana oralig'ida ma'lumot topilmadi
    </p>
  </div>
);

export default Work;
