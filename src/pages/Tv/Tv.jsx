import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Trophy, Medal, LogOut } from "lucide-react";
import api from "@/utils/api";
import { useNavigate } from "react-router-dom";

const Tv = () => {
  // App data states - these will only be used after authentication
  const [isPlaying, setIsPlaying] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const [motivations, setMotivations] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Always define refs at the top level
  const radioRef = useRef(null);
  const dataIntervalRef = useRef(null);
  const dateTimerRef = useRef(null);
  const quoteTimerRef = useRef(null);

  const navigate = useNavigate();

  // Initialize app data and timers after authentication
  const initializeApp = () => {
    // Initialize date timer
    dateTimerRef.current = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Initialize audio
    if (typeof Audio !== "undefined" && !radioRef.current) {
      radioRef.current = new Audio();
    }

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
      if (quoteTimerRef.current) clearInterval(quoteTimerRef.current);

      if (radioRef.current) {
        radioRef.current.pause();
        radioRef.current.src = "";
      }
    };
  }, []);

  // Toggle radio play/pause
  const toggleRadio = () => {
    if (!radioRef.current) return;

    if (isPlaying) {
      radioRef.current.pause();
    } else {
      // Only set source when playing to prevent preloading
      radioRef.current.src = "https://live.qalbimnavosi.uz/qalbimnavosi";
      radioRef.current
        .play()
        .catch((e) => console.error("Playback failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  // Rotate quotes - only starts after quotes are loaded
  useEffect(() => {
    if (motivations.length === 0) return;

    quoteTimerRef.current = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % motivations.length);
    }, 6500);

    return () => {
      if (quoteTimerRef.current) clearInterval(quoteTimerRef.current);
    };
  }, [motivations]);

  // Fetch data
  const fetchData = async () => {
    try {
      const response = await api.get("/tv/sewingOutputs");
      const data = await response.data;

      // Check if this is the first load or if data has changed
      const isFirstLoad = previousData === null;

      // Store current data for future comparison
      setPreviousData(JSON.parse(JSON.stringify(data)));

      // Process the data
      processOutputData(data.sewing_outputs);

      if (isFirstLoad) {
        setMotivations(data.motivations || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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
        return <Trophy className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-yellow-700" size={24} />;
      default:
        return <span className="font-medium text-gray-500">{rank}</span>;
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
    <div className="bg-gray-50 min-h-screen">
      {/* Invisible element to keep screen awake */}
      <div
        className="absolute right-2 bottom-2 z-10 cursor-pointer bg-primary p-2 rounded-full hover:bg-primary/80"
        onClick={() => {
          localStorage.clear();
          navigate("/");
        }}
      >
        <LogOut className="text-white" size={16} />
      </div>
      <div
        className="fixed top-0 left-0 w-1 h-1 bg-transparent z-[-1]"
        style={{ animation: "keepAwake 10s infinite" }}
      />

      {/* Header with fading quotes */}
      <header className="bg-indigo-600 text-white py-4 sticky top-0 z-10 shadow-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 flex items-center justify-center relative">
            {motivations.map((quote, index) => (
              <div
                key={index}
                className={`absolute w-full text-center text-5xl font-medium transition-opacity duration-1500 ease-in-out ${
                  index === currentQuoteIndex ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  display: index === currentQuoteIndex ? "block" : "none",
                }}
              >
                {quote.title}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="w-full flex items-center gap-4 justify-between">
            <div className="flex items-center gap-2">
              <p className="text-gray-600 text-3xl font-medium">
                {formattedDate}
              </p>
              <p className="text-black text-3xl font-semibold">
                {formattedTime}
              </p>
            </div>
            <button
              className="bg-yellow-500 p-3 rounded-full shadow-md hover:bg-yellow-600 transition"
              onClick={toggleRadio}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead className="sticky top-0 z-1 bg-indigo-50">
                <tr className="border-b border-indigo-100">
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
                    #
                  </th>
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
                    Model
                  </th>
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
                    Submodel
                  </th>
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
                    Gurux
                  </th>
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
                    Bugungi reja
                  </th>
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
                    Bugungi natija
                  </th>
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
                    Jami natija
                  </th>
                  <th className="py-3 px-4 text-left text-xl font-medium text-indigo-800">
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
                      <td className="py-3 px-4 text-xl">
                        {getMedalForRank(rank)}
                      </td>
                      <td className="py-3 px-4 text-xl">{output.model.name}</td>
                      <td className="py-3 px-4 text-xl">
                        {output.submodel.name}
                      </td>
                      <td className="py-3 px-4 text-xl font-medium">
                        {output.group.name}
                      </td>
                      <td className="py-3 px-4 text-xl text-center font-bold text-gray-700">
                        {output.today_plan}
                      </td>
                      <td
                        className={`py-3 px-4 text-xl text-center font-bold ${
                          output.today_quantity >= output.today_plan
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {output.today_quantity}
                      </td>
                      <td className="py-3 px-4 text-xl text-center font-bold text-indigo-600">
                        {output.total_quantity}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`${getProgressColor(
                                output.progressPercentage
                              )} h-3 rounded-full`}
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
                            className={`ml-2 text-xl font-bold ${getTextColor(
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tv;
