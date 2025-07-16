"use client";

import type { GPU, GPUSegment } from "@/lib/types";

// 상세 GPU 사용률 바 (매칭된 세그먼트만 천천히 깜빡임)
export const DetailedGPUBar = ({
  gpu,
  matchingSegmentIndexes,
  pulseColor = "blue",
}: {
  gpu: GPU;
  matchingSegmentIndexes?: number[];
  pulseColor?: "blue" | "yellow";
}) => {
  if (gpu.status !== "active" || gpu.segments.length === 0) {
    return (
      <div
        className={`
          w-full h-8 bg-gray-200 rounded flex items-center justify-center transition-all duration-300
          ${
            matchingSegmentIndexes && matchingSegmentIndexes.length > 0
              ? `animate-[pulse_2s_ease-in-out_infinite] ${
                  pulseColor === "blue"
                    ? "shadow-[0_0_0_2px_#3b82f6]"
                    : "shadow-[0_0_0_2px_#facc15]"
                }`
              : ""
          }
        `}
      >
        <span
          className={`text-xs relative z-10 ${
            matchingSegmentIndexes && matchingSegmentIndexes.length > 0
              ? pulseColor === "blue"
                ? "text-blue-800 font-bold"
                : "text-yellow-800 font-bold"
              : "text-gray-500"
          }`}
        >
          {gpu.status === "idle"
            ? "유휴"
            : gpu.status === "error"
            ? "오류"
            : "미사용"}
        </span>
      </div>
    );
  }

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
  ];

  return (
    <div className="w-full h-8 bg-gray-200 rounded overflow-hidden flex relative transition-all duration-300">
      <div className="relative flex w-full h-full">
        {gpu.segments.map((segment, index) => {
          const isMatching = matchingSegmentIndexes?.includes(index);
          return (
            <div
              key={index}
              className={`
                ${
                  colors[index % colors.length]
                } flex items-center justify-center text-white relative group
                ${
                  isMatching
                    ? `animate-[pulse_2s_ease-in-out_infinite] ${
                        pulseColor === "blue"
                          ? "shadow-[0_0_0_2px_#3b82f6]"
                          : "shadow-[0_0_0_2px_#facc15]"
                      }`
                    : ""
                }
              `}
              style={{
                width: `${segment.usage}%`,
                animationDelay: isMatching ? `${index * 0.2}s` : undefined,
              }}
            >
              <div
                className={`text-xs font-medium truncate px-1 ${
                  isMatching ? "font-bold" : ""
                }`}
              >
                {segment.usage >= 25 ? segment.user : ""}
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                <div>{segment.user}</div>
                <div>{segment.team}</div>
                <div>{segment.usage}% 사용</div>
                {isMatching && (
                  <div
                    className={
                      pulseColor === "blue"
                        ? "text-blue-300 font-bold"
                        : "text-yellow-300 font-bold"
                    }
                  >
                    🔍 검색 매칭
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {gpu.totalUsage < 100 && (
          <div
            className="bg-gray-200 flex items-center justify-center"
            style={{ width: `${100 - gpu.totalUsage}%` }}
          >
            <span className="text-xs text-gray-400">미사용</span>
          </div>
        )}
      </div>
    </div>
  );
};
