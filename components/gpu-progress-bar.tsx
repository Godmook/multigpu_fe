import type { GPU } from "@/lib/types";

// GPU 막대그래프 컴포넌트 (포커스 모드에서 선택된 사용자의 사용량만 파란색으로 표시)
export const GPUProgressBar = ({
  gpu,
  isHighlighted,
  highlightedUsage,
}: {
  gpu: GPU
  isHighlighted?: boolean
  highlightedUsage?: number
}) => {
  const totalBlocks = 8
  const totalUsedBlocks = gpu.usage
  const highlightedBlocks = isHighlighted && highlightedUsage ? Math.floor((highlightedUsage / 100) * totalBlocks) : 0

  return (
    <div className="flex h-full w-full gap-0 relative transition-all duration-300">
      {Array(totalBlocks)
        .fill(0)
        .map((_, i) => {
          const isHighlightedBlock = i < highlightedBlocks
          const isUsedBlock = i < totalUsedBlocks

          let bg = "bg-gray-200" // 미사용
          if (isUsedBlock) {
            bg = "bg-gray-500" // 다른 사용자 사용
          }
          if (isHighlightedBlock) {
            bg = "bg-blue-500" // 선택된 사용자 사용
          }

          return (
            <div
              key={i}
              className={`
                flex-1 rounded-none transition-all duration-300
                border-[0.3px] border-gray-300
                ${bg}
                ${isHighlightedBlock ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}
              `}
            />
          )
        })}
    </div>
  )
}