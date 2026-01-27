import React from "react";

const NewSeason = () => {
  const progress = 10;
  const radius = 120;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-[93vh] flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Qishgi mavsum 2026
        </h1>

        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
            >
              <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="url(#gradient)"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + " " + circumference}
                style={{
                  strokeDashoffset,
                  transition: "stroke-dashoffset 0.5s ease",
                }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl font-bold text-gray-800">
                  {progress}%
                </span>
                <p className="text-sm text-gray-500 mt-1">Progress</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
            <span className="text-gray-600 font-medium">Topdingiz</span>
            <span className="text-xl font-bold text-blue-600">
              2 000 000 so'm
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
            <span className="text-gray-600 font-medium">Mavsum so'ngida</span>
            <span className="text-xl font-bold text-green-600">
              20 000 000 so'm
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
            <span className="text-gray-600 font-medium">Qoldiq</span>
            <span className="text-xl font-bold text-purple-600">
              18 000 000 so'm
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
            <span className="text-gray-600 font-medium">Daqiqasiga</span>
            <span className="text-xl font-bold text-purple-600">
              2 so'm dan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSeason;
