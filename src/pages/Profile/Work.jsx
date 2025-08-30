import { useState } from "react";

const Work = ({ userData }) => {
  const logs = userData.employee_tarification_logs;
  const [activeTab, setActiveTab] = useState("model"); // "model" or "day"

  const tabs = [
    { id: "model", title: "Model", subtitle: "bo'yicha" },
    { id: "day", title: "Kuni", subtitle: "bo'yicha" },
  ];

  return (
    <div className="mt-4 p-4 rounded-xl bg-green-50">
      <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl text-center shadow-md cursor-pointer transition-all duration-300 
                ${
                  isActive
                    ? "bg-green-700 text-white scale-105 shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              <p
                className={`font-bold text-lg ${
                  isActive ? "text-white" : "text-gray-800"
                }`}
              >
                {tab.title}
              </p>
              <p
                className={`text-sm ${
                  isActive ? "text-green-100" : "text-gray-500"
                }`}
              >
                {tab.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Work;
