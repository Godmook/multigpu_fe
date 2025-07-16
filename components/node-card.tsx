import type { Node } from "@/lib/types";
import { GPUProgressBar } from "@/components/gpu-progress-bar";

// Node 카드 컴포넌트 (전체 매칭 시에만 노드 전체 깜빡임)
export const NodeCard = ({
  node,
  size,
  isSelected,
  onSelect,
  animatePulse = false,
  highlightedGpuUsages = {},
  isSelectedByGpuClick = false,
}: {
  node: Node;
  size: number;
  isSelected: boolean;
  onSelect: (node: Node) => void;
  animatePulse?: boolean;
  highlightedGpuUsages?: { [key: number]: number };
  isSelectedByGpuClick?: boolean;
}) => {
  const avgUsagePercent = node.avgUsage * 100
  const onlineGPUs = node.gpus.filter((gpu) => gpu.status === "active").length
  const errorGPUs = node.gpus.filter((gpu) => gpu.status === "error").length
  const idleGPUs = node.gpus.filter((gpu) => gpu.status === "idle").length

  const totalGap = (node.gpus.length - 1) * 2
  const availableHeight = size - 4 - totalGap - 16
  const barHeight = Math.floor(availableHeight / node.gpus.length)

  // 전체 노드 매칭 시에만 노드 전체 깜빡임
  const getCardStyle = () => {
    let baseStyle = `
      border-2 border-black transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer
      bg-white
      ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 shadow-blue-500/30 shadow-lg" : ""}
      group relative overflow-hidden
    `
    if (animatePulse) {
      baseStyle += ` 
        animate-[pulse_2s_ease-in-out_infinite]
        bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100
        shadow-xl shadow-yellow-500/50
      `
    }
    if (isSelectedByGpuClick) {
      baseStyle += ` border-4 border-blue-400 shadow-2xl shadow-blue-300/40 animate-[pulse_1.5s_ease-in-out_infinite] z-20`;
    }
    return baseStyle
  }

  return (
    <div
      className={getCardStyle()}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={() => onSelect(node)}
      title={`${node.name} | GPU: ${avgUsagePercent.toFixed(1)}% | CPU: ${node.cpuUsage}% | Memory: ${node.memoryUsage}%`}
    >
      {/* 호버 시 표시되는 상세 정보 */}
      <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap shadow-xl">
        <div className="font-semibold text-yellow-300">{node.name}</div>
        <div>GPU: {avgUsagePercent.toFixed(1)}% avg</div>
        <div>CPU: {node.cpuUsage}%</div>
        <div>Memory: {node.memoryUsage}%</div>
        <div>
          {onlineGPUs}/{node.gpus.length} GPUs active
        </div>
        {errorGPUs > 0 && <div className="text-red-300">{errorGPUs} GPU errors</div>}
        {idleGPUs > 0 && <div className="text-yellow-300">{idleGPUs} GPU idle</div>}
        <div>Status: {node.status}</div>
      </div>

      {/* 노드 이름 */}
      <div
        className={`
        absolute top-1 left-1 text-[10px] font-semibold transition-all duration-300
        ${isSelected ? "text-blue-800 font-bold" : "text-gray-800"}
      `}
      >
        {node.name}
        {animatePulse && <span className="ml-1 text-blue-600">🔍</span>}
      </div>

      {/* 평균 사용량 */}

      {/* GPU 막대그래프들 */}
      <div className="h-full w-full flex flex-col gap-0.5 p-1 pt-4 pb-2 relative z-10">
        {node.gpus.map((gpu, index) => (
          <div key={gpu.id} style={{ height: `${barHeight}px` }} className="w-full">
            <GPUProgressBar
              gpu={gpu}
              isHighlighted={highlightedGpuUsages.hasOwnProperty(index)}
              highlightedUsage={highlightedGpuUsages[index]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}