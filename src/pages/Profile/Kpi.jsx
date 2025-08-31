import React from "react";
import {
  Target,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Wallet,
  Clock,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";

const mockPlan = 7000;
const mockPrice = 1500;
const mockDone = 5000;

const formatNumber = (number) => {
  return Number.parseFloat(number || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col bg-white backdrop-blur-md rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-xl ${color} bg-opacity-20 text-gray-700`}>
        <Icon size={20} />
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <div className="text-lg font-semibold text-gray-800">{value}</div>
  </div>
);

const Kpi = ({ userData }) => {
  const progress = ((mockDone / mockPlan) * 100).toFixed(2);

  const chartData = [{ name: "Progress", value: progress, fill: "#4ade80" }]; // soft green

  return (
    <div className="rounded-3xl text-gray-900 font-[SF Pro Display]">
      {/* Responsive layout: mobile = column-reverse, desktop = row */}
      <div className="flex flex-col-reverse md:flex-row gap-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
          <StatItem
            icon={Target}
            label="Belgilangan reja"
            value={`${formatNumber(mockPlan)} ta`}
            color="bg-blue-400"
          />
          <StatItem
            icon={DollarSign}
            label="Bir dona uchun narx"
            value={`${formatNumber(mockPrice)} so'm`}
            color="bg-green-400"
          />
          <StatItem
            icon={Wallet}
            label="Topa olasiz"
            value={`${formatNumber(mockPlan * mockPrice)} so'm`}
            color="bg-emerald-400"
          />
          <StatItem
            icon={CheckCircle2}
            label="Bajardingiz"
            value={`${formatNumber(mockDone)} ta`}
            color="bg-indigo-400"
          />
          <StatItem
            icon={TrendingUp}
            label="Ishlab topdingiz"
            value={`${formatNumber(mockDone * mockPrice)} so'm`}
            color="bg-yellow-400"
          />
          <StatItem
            icon={Clock}
            label="Qoldiq"
            value={`${formatNumber(mockPlan - mockDone)} ta`}
            color="bg-pink-400"
          />
        </div>

        {/* Radial chart */}
        <div className="flex flex-col items-center justify-center bg-white backdrop-blur-md rounded-3xl p-8 shadow-md border border-gray-100 w-full md:w-1/3">
          <h3 className="text-base mb-5 flex items-center gap-2 text-gray-500">
            {formatNumber(mockPrice * mockDone)} so'm
          </h3>
          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: "#f3f4f6" }}
                  dataKey="value"
                  cornerRadius={30}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-4xl font-bold mt-2 text-gray-900">
            {progress}%
          </div>
          <span className="text-sm text-gray-500 mt-1">Umumiy natija</span>
        </div>
      </div>
    </div>
  );
};

export default Kpi;
