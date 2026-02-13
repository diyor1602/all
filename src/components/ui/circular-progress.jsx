import * as React from "react";
import { cn } from "@/lib/utils";

const CircularProgress = React.forwardRef(
  (
    {
      className,
      value,
      size = 60,
      strokeWidth = 4,
      showPercentage = true,
      ...props
    },
    ref,
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center",
          className,
        )}
        {...props}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-100 dark:text-gray-800"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-blue-500 transition-all duration-300 ease-out"
            strokeLinecap="round"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {Math.round(value)}%
            </span>
          </div>
        )}
      </div>
    );
  },
);

CircularProgress.displayName = "CircularProgress";

export { CircularProgress };
