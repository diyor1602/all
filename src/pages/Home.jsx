"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, Medal } from "lucide-react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const Home = () => {
  // App data states - these will only be used after authentication
  const [outputs, setOutputs] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const { toast } = useToast();

  // Always define refs at the top level
  const dataIntervalRef = useRef(null);
  const dateTimerRef = useRef(null);

  // Initialize app data and timers after authentication
  const initializeApp = () => {
    // Initialize date timer
    dateTimerRef.current = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Initial data load and set interval for updates
    fetchData();
    dataIntervalRef.current = setInterval(fetchData, 60000);
  };

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
      const response = await api.get("/sewingOutputs");
      const data = await response.data;

      // Process the data
      processOutputData(data.sewing_outputs);
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Data olishda xatolik",
        variant: "destructive",
      });
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

  // Format date and time
  const formattedDate = currentDateTime.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

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

  // Get text color based on percentage
  const getTextColor = (percentage) => {
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    return "text-yellow-600";
  };

  // Main app content
  return (
    <div className="bg-gray-50">
      <div className="mx-auto py-3 md:py-6 px-0 md:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 sm:justify-between w-full">
            <div className="flex items-center gap-2">
              <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium">
                {formattedDate}
              </p>
            </div>
            <p className="text-black text-base sm:text-lg md:text-xl font-semibold">
              {formattedTime}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-md p-0 sm:p-4 md:p-6 mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="sticky top-0 z-10 bg-indigo-50">
                <tr className="border-b border-indigo-100">
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    #
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Model
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Submodel
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Gurux
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Bugungi reja
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Bugungi natija
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Jami natija
                  </th>
                  <th className="py-2 px-1 sm:px-2 md:px-4 text-left text-xs sm:text-sm md:text-base font-medium text-indigo-800">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {outputs.map((output, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={`${output.model.name}-${output.submodel.name}-${output.group.name}`}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        output.hasChanged ? "animate-highlight" : ""
                      }`}
                    >
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center">
                        {getMedalForRank(rank)}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        {output.model.name}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base">
                        {output.submodel.name}
                      </td>
                      <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base font-medium">
                        {output.group.name}
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
                                output.progressPercentage
                              )} h-2 rounded-full`}
                              style={{
                                width: `${Math.min(
                                  output.progressPercentage,
                                  100
                                )}%`,
                                animation: "fillProgress 1s ease-out",
                              }}
                            ></div>
                          </div>
                          <span
                            className={`ml-1 sm:ml-2 text-xs sm:text-sm font-bold ${getTextColor(
                              output.progressPercentage
                            )}`}
                          >
                            {output.progressPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td
                    colSpan={4}
                    className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base font-medium text-center"
                  >
                    Jami
                  </td>
                  <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold text-gray-700">
                    {outputs.reduce(
                      (total, output) => total + output.today_plan,
                      0
                    )}
                  </td>
                  <td
                    className={`py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold ${
                      outputs.reduce(
                        (total, output) => total + output.today_quantity,
                        0
                      ) >=
                      outputs.reduce(
                        (total, output) => total + output.today_plan,
                        0
                      )
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {outputs.reduce(
                      (total, output) => total + output.today_quantity,
                      0
                    )}
                  </td>
                  <td className="py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base text-center font-bold text-indigo-600">
                    {outputs.reduce(
                      (total, output) => total + output.total_quantity,
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
