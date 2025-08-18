import { Angry, Meh, Smile } from "lucide-react";

const getIcon = (percentage) => {
  let newPercentage = percentage > 100 ? 100 : percentage;
  if (newPercentage < 50) {
    return <Angry className="w-12 h-12 sm:w-15 sm:h-15" />;
  } else if (newPercentage < 75) {
    return <Meh className="w-12 h-12 sm:w-15 sm:h-15" />;
  } else {
    return <Smile className="w-12 h-12 sm:w-15 sm:h-15" />;
  }
};

const FillableTruck = ({ percentage = 0 }) => {
  return (
    <div className="flex gap-1 sm:gap-2 px-2 sm:px-0">
      {/* main body */}
      <div className="w-[280px] h-[140px] sm:w-[400px] sm:h-[200px] bg-gray-200 relative rounded-lg">
        <div
          className="h-[140px] sm:h-[200px] bg-blue-400 absolute top-0 left-0 rounded-l-lg"
          style={{ width: `${percentage > 100 ? 100 : percentage}%` }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 font-bold text-2xl sm:text-4xl">
          {percentage}%
        </div>
        <div className="w-[280px] h-[14px] sm:w-[400px] sm:h-[20px] bg-gray-200 absolute bottom-[calc(-11%)] left-0"></div>
        <div className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] bg-black rounded-full absolute bottom-[-53px] sm:bottom-[-76px] left-8 sm:left-12">
          <div className="w-[25px] h-[25px] sm:w-[35px] sm:h-[35px] bg-gray-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] bg-black rounded-full absolute bottom-[-53px] sm:bottom-[-76px] left-24 sm:left-32">
          <div className="w-[25px] h-[25px] sm:w-[35px] sm:h-[35px] bg-gray-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] bg-black rounded-full absolute bottom-[-53px] sm:bottom-[-76px] left-40 sm:left-52">
          <div className="w-[25px] h-[25px] sm:w-[35px] sm:h-[35px] bg-gray-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
      {/* head */}
      <div className="w-[126px] h-[140px] sm:w-[180px] sm:h-[200px] bg-transparent relative rounded-lg flex items-end">
        {percentage >= 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            {getIcon(percentage)}
          </div>
        )}

        <div className="w-[126px] h-[14px] sm:w-[180px] sm:h-[20px] bg-gray-200 absolute bottom-[calc(-11%)] left-0"></div>
        <div className="w-[126px] h-[112px] sm:w-[180px] sm:h-[160px] bg-gray-200 relative rounded-lg"></div>
        <div className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] bg-black rounded-full absolute bottom-[-52px] sm:bottom-[-75px] left-1/2 transform -translate-x-1/2">
          <div className="w-[25px] h-[25px] sm:w-[35px] sm:h-[35px] bg-gray-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default FillableTruck;
