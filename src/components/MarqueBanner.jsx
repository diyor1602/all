import { useEffect, useState } from "react";

const MarqueeBanner = ({ texts = [], interval = 2000 }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval); // change every 2s (like a clock)
    return () => clearInterval(timer);
  }, [texts, interval]);

  return (
    <div className="bg-red-500 fixed top-0 left-0 right-0 h-6 flex items-center justify-center overflow-hidden text-white uppercase font-medium z-10 text-xs">
      <div
        key={index} // re-trigger animation each time
        className="animate-flip"
      >
        {texts[index]}
      </div>

      <style>
        {`
          @keyframes flip {
            0% {
              transform: rotateX(-90deg);
              opacity: 0;
            }
            50% {
              transform: rotateX(20deg);
              opacity: 1;
            }
            100% {
              transform: rotateX(0);
              opacity: 1;
            }
          }
          .animate-flip {
            display: inline-block;
            animation: flip 0.6s ease;
            transform-origin: top center;
          }
        `}
      </style>
    </div>
  );
};

export default MarqueeBanner;
