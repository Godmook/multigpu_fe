"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Zap, User, Clock } from "lucide-react"

// GPU 타입 정의
type GPUType = "A100" | "A30" | "H100" | "H200" | "전체"

// GPU 사용 세그먼트 인터페이스
interface GPUSegment {
  user: string
  team: string
  usage: 25 | 50 | 75 | 100
}

// GPU 인터페이스
interface GPU {
  id: string
  usage: number
  status: "active" | "idle" | "error"
  segments: GPUSegment[]
  totalUsage: 25 | 50 | 75 | 100
}

// Node 인터페이스
interface Node {
  id: string
  name: string
  gpuType: GPUType
  gpus: GPU[]
  status: "online" | "offline" | "maintenance"
  avgUsage: number
  cpuUsage: number
  memoryUsage: number
}

// Job 인터페이스
interface Job {
  id: string
  name: string
  user: string
  team: string
  priority: "high" | "normal" | "low"
  gpuType: GPUType
}

// 검색 결과 인터페이스
interface SearchResult {
  node: Node
  matchingGPUs: number[] // 매칭되는 GPU 인덱스들
  isFullNodeMatch: boolean // 노드 전체가 매칭되는지
  matchingSegments: { [gpuIndex: number]: number[] } // GPU별 매칭되는 세그먼트 인덱스들
}

// GPU 타입별 노드 개수 설정
const GPU_NODE_COUNTS: Record<GPUType, number> = {
  H200: 4,
  A30: 8,
  H100: 28,
  A100: 24,
  전체 : 71
}

// 그리드 크기 계산
const getGridSize = (nodeCount: number) => {
  const sqrt = Math.ceil(Math.sqrt(nodeCount))
  return sqrt
}

// 샘플 사용자/팀 데이터
const users = ["김철수", "이영희", "박민수", "정수진", "최영호", "한미영", "임동현", "송지은", "조현우", "윤서연"]
const teams = ["AI연구팀", "데이터팀", "비전팀", "NLP팀", "로보틱스팀", "추천팀", "검색팀", "음성팀"]

// 샘플 Job 데이터 생성
const generateJobs = (): Job[] => {
  const jobs: Job[] = []
  const gpuTypes: GPUType[] = ["전체","A100", "A30", "H100", "H200"]
  const jobNames = [
    "ResNet Training",
    "BERT Fine-tuning",
    "Image Classification",
    "Object Detection",
    "Language Model",
    "Style Transfer",
    "Reinforcement Learning",
    "Neural Architecture Search",
  ]

  gpuTypes.forEach((gpuType) => {
    const pendingCount = Math.floor(Math.random() * 12) + 3
    for (let i = 0; i < pendingCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const team = teams[Math.floor(Math.random() * teams.length)]

      jobs.push({
        id: `${gpuType}-pending-${i + 1}`,
        name: jobNames[Math.floor(Math.random() * jobNames.length)],
        user,
        team,
        priority: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "normal" : "low",
        gpuType,
      })
    }
  })

  return jobs.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// GPU 세그먼트 생성 함수
const generateGPUSegments = (totalUsage: 25 | 50 | 75 | 100): GPUSegment[] => {
  const segments: GPUSegment[] = []
  let remainingUsage = totalUsage

  while (remainingUsage > 0) {
    const user = users[Math.floor(Math.random() * users.length)]
    const team = teams[Math.floor(Math.random() * teams.length)]

    let segmentUsage: 25 | 50 | 75 | 100
    if (remainingUsage >= 75 && Math.random() > 0.5) {
      segmentUsage = 75
    } else if (remainingUsage >= 50 && Math.random() > 0.5) {
      segmentUsage = 50
    } else if (remainingUsage >= 25) {
      segmentUsage = 25
    } else {
      break
    }

    segments.push({ user, team, usage: segmentUsage })
    remainingUsage -= segmentUsage
  }

  return segments
}

// 샘플 데이터 생성
const generateSampleNodes = (): Node[] => {
  const gpuTypes: GPUType[] = ["A100", "A30", "H100", "H200"]
  const nodes: Node[] = []

  gpuTypes.forEach((gpuType) => {
    const nodeCount = GPU_NODE_COUNTS[gpuType]

    for (let i = 1; i <= nodeCount; i++) {
      const gpuCount = Math.random() > 0.3 ? 8 : 4
      const gpus: GPU[] = []

      for (let j = 1; j <= gpuCount; j++) {
        let usage: number
        let status: "active" | "idle" | "error" = "active"
        let totalUsage: 25 | 50 | 75 | 100 = 25
        let segments: GPUSegment[] = []

        const statusRand = Math.random()
        if (statusRand < 0.05) {
          status = "error"
          usage = 0
          totalUsage = 25
        } else if (statusRand < 0.1) {
          status = "idle"
          usage = 0
          totalUsage = 25
        } else {
          const usageOptions: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100]
          totalUsage = usageOptions[Math.floor(Math.random() * usageOptions.length)]
          usage = Math.floor((totalUsage / 100) * 8)
          segments = generateGPUSegments(totalUsage)
        }

        gpus.push({
          id: `${gpuType}-${i}-${j}`,
          usage,
          status,
          segments,
          totalUsage,
        })
      }

      const activeGpus = gpus.filter((gpu) => gpu.status === "active" && gpu.usage>0);
      const avgUsage =
        activeGpus.length > 0 ? activeGpus.reduce((sum, gpu) => sum + gpu.usage, 0) / activeGpus.length / 8 : 0

      const baseCpuUsage = avgUsage * 60 + Math.random() * 30
      const baseMemoryUsage = avgUsage * 50 + Math.random() * 40

      nodes.push({
        id: `${gpuType}-node-${i}`,
        name: `${gpuType}-${i.toString().padStart(2, "0")}`,
        gpuType,
        gpus,
        status: Math.random() > 0.05 ? "online" : Math.random() > 0.5 ? "offline" : "maintenance",
        avgUsage,
        cpuUsage: Math.min(100, Math.max(0, Math.round(baseCpuUsage))),
        memoryUsage: Math.min(100, Math.max(0, Math.round(baseMemoryUsage))),
      })
    }
  })

  return nodes
}

// 복합 검색 함수 - 세그먼트 매칭 정보 포함
const performComplexSearch = (nodes: Node[], searchTerm: string): SearchResult[] => {
  if (!searchTerm.trim()) return []

  const searchParts = searchTerm
    .split("/")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0)
  if (searchParts.length === 0) return []

  const results: SearchResult[] = []

  nodes.forEach((node) => {
    const matchingGPUs: number[] = []
    const matchingSegments: { [gpuIndex: number]: number[] } = {}

    // 각 GPU에 대해 검색 조건 확인
    node.gpus.forEach((gpu, gpuIndex) => {
      const gpuMatchingSegments: number[] = []

      // 각 세그먼트에 대해 검색 조건 확인
      gpu.segments.forEach((segment, segmentIndex) => {
        let segmentMatches = true

        // 모든 검색 조건이 만족되는지 확인
        for (const searchPart of searchParts) {
          let partMatches = false

          // 노드 이름 매칭
          if (node.name.toLowerCase().includes(searchPart) || node.id.toLowerCase().includes(searchPart)) {
            partMatches = true
          }

          // 사용자명 매칭
          if (segment.user.toLowerCase().includes(searchPart)) {
            partMatches = true
          }

          // 팀명 매칭
          if (segment.team.toLowerCase().includes(searchPart)) {
            partMatches = true
          }

          if (!partMatches) {
            segmentMatches = false
            break
          }
        }

        if (segmentMatches) {
          gpuMatchingSegments.push(segmentIndex)
        }
      })

      // GPU에 매칭되는 세그먼트가 있으면 해당 GPU를 매칭 목록에 추가
      if (gpuMatchingSegments.length > 0) {
        matchingGPUs.push(gpuIndex)
        matchingSegments[gpuIndex] = gpuMatchingSegments
      }
    })

    // 검색 결과가 있는 경우에만 추가
    if (matchingGPUs.length > 0) {
      const isFullNodeMatch = matchingGPUs.length === node.gpus.length
      results.push({
        node,
        matchingGPUs,
        isFullNodeMatch,
        matchingSegments,
      })
    }
  })

  return results
}


// Node 상태에 따른 테두리 색상
const getNodeBorderColor = (status: string) => {
  switch (status) {
    case "online":
      return "border-green-500"
    case "offline":
      return "border-red-500"
    case "maintenance":
      return "border-yellow-500"
    default:
      return "border-gray-500"
  }
}

// 사용률 막대그래프 컴포넌트
const UsageBar = ({ percentage, color }: { percentage: number; color: string }) => (
  <div className="w-full bg-gray-200 rounded-full h-3">
    <div className={`h-3 rounded-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }} />
  </div>
)

// GPU 막대그래프 컴포넌트 (매칭된 부분만 천천히 깜빡임)
const GPUProgressBar = ({ gpu, isHighlighted }: { gpu: GPU; isHighlighted?: boolean }) => (
  <div className="flex h-full w-full gap-0 relative transition-all duration-300">
    {Array(8)
      .fill(0)
      .map((_, i) => {
      const isUsed = i < gpu.usage;
      const bg = isUsed ? "bg-gray-500" : "bg-gray-200"; // 미사용은 연회색
        return (
          <div
            key={i}
            className={`
              flex-1 rounded-none transition-all duration-300
              border-[0.3px] border-gray-300
              ${bg}
              ${isUsed && isHighlighted ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}
            `}
          />
        )
      })}
  </div>
)



// 상세 GPU 사용률 바 (매칭된 세그먼트만 천천히 깜빡임)
const DetailedGPUBar = ({
  gpu,
  matchingSegmentIndexes,
}: {
  gpu: GPU
  matchingSegmentIndexes?: number[]
}) => {
  if (gpu.status !== "active" || gpu.segments.length === 0) {
    return (
      <div
        className={`
          w-full h-8 bg-gray-200 rounded flex items-center justify-center transition-all duration-300
          ${matchingSegmentIndexes && matchingSegmentIndexes.length > 0 ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}
        `}
      >
        <span
          className={`text-xs relative z-10 ${
            matchingSegmentIndexes && matchingSegmentIndexes.length > 0 ? "text-yellow-800 font-bold" : "text-gray-500"
          }`}
        >
          {gpu.status === "idle" ? "유휴" : gpu.status === "error" ? "오류" : "미사용"}
        </span>
      </div>
    )
  }

  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"]

  return (
    <div className="w-full h-8 bg-gray-200 rounded overflow-hidden flex relative transition-all duration-300">
      <div className="relative flex w-full h-full">
        {gpu.segments.map((segment, index) => {
          const isMatching = matchingSegmentIndexes?.includes(index)
          return (
            <div
              key={index}
              className={`
                ${colors[index % colors.length]} flex items-center justify-center text-white relative group
                ${isMatching ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}
              `}
              style={{
                width: `${segment.usage}%`,
                animationDelay: isMatching ? `${index * 0.2}s` : undefined,
              }}
            >
              <div className={`text-xs font-medium truncate px-1 ${isMatching ? "font-bold" : ""}`}>
                {segment.usage >= 50 ? `${segment.user}` : segment.usage >= 25 ? segment.user.slice(0, 2) : ""}
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                <div>{segment.user}</div>
                <div>{segment.team}</div>
                <div>{segment.usage}% 사용</div>
                {isMatching && <div className="text-yellow-300 font-bold">🔍 검색 매칭</div>}
              </div>
            </div>
          )
        })}
        {gpu.totalUsage < 100 && (
          <div className="bg-gray-200 flex items-center justify-center" style={{ width: `${100 - gpu.totalUsage}%` }}>
            <span className="text-xs text-gray-400">미사용</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Node 카드 컴포넌트 (전체 매칭 시에만 노드 전체 깜빡임)
const NodeCard = ({
  node,
  size,
  isSelected,
  onSelect,
  searchResult,
}: {
  node: Node
  size: number
  isSelected: boolean
  onSelect: (node: Node) => void
  searchResult?: SearchResult
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
      border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer
      bg-white ${getNodeBorderColor(node.status)}
      ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 shadow-blue-500/30 shadow-lg" : ""}
      group relative overflow-hidden
    `

    // 전체 노드 매칭 시에만 노드 전체 깜빡임
    if (searchResult?.isFullNodeMatch) {
      baseStyle += ` 
        animate-[pulse_2s_ease-in-out_infinite]
        bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100
        shadow-xl shadow-yellow-500/50
      `
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
        {searchResult && (
          <div className="mt-2 border-t border-gray-600 pt-2">
            <div className={`font-bold ${searchResult.isFullNodeMatch ? "text-yellow-300" : "text-orange-300"}`}>
              🔍 {searchResult.isFullNodeMatch ? "전체 매칭" : "부분 매칭"}
            </div>
            <div className="text-yellow-200">매칭 GPU: {searchResult.matchingGPUs.map((i) => i + 1).join(", ")}</div>
          </div>
        )}
      </div>

      {/* 노드 이름 */}
      <div
        className={`
        absolute top-1 left-1 text-[10px] font-semibold transition-all duration-300
        ${searchResult?.isFullNodeMatch ? "text-yellow-800 font-bold" : "text-gray-800"}
      `}
      >
        {node.name}
        {searchResult?.isFullNodeMatch && <span className="ml-1 text-yellow-600">🔍</span>}
      </div>

      {/* 평균 사용량 */}

      {/* GPU 막대그래프들 */}
      <div className="h-full w-full flex flex-col gap-0.5 p-1 pt-4 pb-2 relative z-10">
        {node.gpus.map((gpu, index) => (
          <div key={gpu.id} style={{ height: `${barHeight}px` }} className="w-full">
            <GPUProgressBar
              gpu={gpu}
              isHighlighted={!searchResult?.isFullNodeMatch && searchResult?.matchingGPUs.includes(index)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Job 아이템 컴포넌트
const JobItem = ({ job }: { job: Job }) => {
  const getPriorityColor = () => {
    switch (job.priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "normal":
        return "bg-blue-100 text-blue-700"
      case "low":
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      <Clock className="w-4 h-4 text-yellow-500" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{job.name}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor()}`}>{job.priority}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{job.user}</span>
          </div>
          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{job.team}</span>
        </div>
      </div>
    </div>
  )
}

// 선택된 노드의 GPU 상세 정보 컴포넌트
const NodeGPUDetails = ({
  node,
  containerHeight,
  searchResult,
}: {
  node: Node
  containerHeight: number
  searchResult?: SearchResult
}) => {
  return (
    <Card
      className={
        searchResult?.isFullNodeMatch
          ? "animate-[pulse_2s_ease-in-out_infinite] bg-gradient-to-br from-yellow-50 to-orange-50"
          : ""
      }
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {node.name} GPU 사용 현황
            {searchResult?.isFullNodeMatch && <span className="text-yellow-600">🔍 전체매칭</span>}
          </span>
          {searchResult && (
            <span
              className={`
              text-sm px-3 py-1 rounded-full font-semibold
              ${searchResult.isFullNodeMatch ? "text-yellow-700 bg-yellow-200" : "text-orange-700 bg-orange-200"}
            `}
            >
              검색 매칭: {searchResult.matchingGPUs.length}/{node.gpus.length} GPU
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent style={{ height: `${containerHeight - 80}px` }} className="overflow-y-auto">
        <div className="space-y-4">
          {node.gpus.map((gpu, index) => {
            const matchingSegmentIndexes = searchResult?.matchingSegments[index]
            const isGPUMatching = searchResult?.matchingGPUs.includes(index)

            return (
              <div key={gpu.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`
                    text-sm font-mono font-semibold flex items-center gap-2
                    ${isGPUMatching ? "text-yellow-700 bg-yellow-100 px-2 py-1 rounded-lg" : "text-gray-700"}
                  `}
                  >
                    GPU-{index + 1}
                    {isGPUMatching && (
                      <span className="text-xs bg-yellow-300 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                        🔍 매칭
                      </span>
                    )}
                  </div>
                  <div
                    className={`
                  text-sm font-semibold
                  ${isGPUMatching ? "text-yellow-700" : "text-gray-900"}
                `}
                  >
                    {gpu.totalUsage}%
                  </div>
                </div>
                <DetailedGPUBar gpu={gpu} matchingSegmentIndexes={matchingSegmentIndexes} />
                {gpu.segments.length > 0 && (
                  <div
                    className={`
                  text-xs pl-2 transition-all duration-300
                  ${
                    isGPUMatching
                      ? "text-yellow-700 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400"
                      : "text-gray-500"
                  }
                `}
                  >
                    {gpu.segments.map((segment, segIndex) => {
                      const isSegmentMatching = matchingSegmentIndexes?.includes(segIndex)
                      return (
                        <div key={segIndex} className="flex items-center gap-2">
                          <div
                            className={`
                            w-2 h-2 rounded-full
                            ${isSegmentMatching ? "bg-yellow-500 animate-[pulse_2s_ease-in-out_infinite]" : "bg-blue-500"}
                          `}
                            style={{
                              animationDelay: isSegmentMatching ? `${segIndex * 0.3}s` : undefined,
                            }}
                          ></div>
                          <span
                            className={isSegmentMatching ? "font-semibold animate-[pulse_2s_ease-in-out_infinite]" : ""}
                          >
                            {segment.user} ({segment.team}) - {segment.usage}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// 메인 대시보드 컴포넌트
export default function GPUDashboard() {
  const [allNodes] = useState<Node[]>(generateSampleNodes())
  const [allJobs] = useState<Job[]>(generateJobs())
  const [selectedGPUType, setSelectedGPUType] = useState<GPUType>("A100")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const gpuTypes: GPUType[] = ["전체","A100", "A30", "H100", "H200"]

  // 기본 필터링 (GPU 타입별)
  const typeFilteredNodes = 
    selectedGPUType === "전체"
      ? allNodes
      : allNodes.filter((node) => node.gpuType === selectedGPUType)

  // 복합 검색 수행
  const searchResults = performComplexSearch(typeFilteredNodes, searchTerm)

  // 최종 표시할 노드들 (검색 결과가 있으면 검색 결과만, 없으면 전체)
  const displayNodes = searchTerm.trim()
    ? searchResults.map((result) => result.node)
    : typeFilteredNodes.sort((a, b) => b.avgUsage - a.avgUsage)

  // 선택된 GPU 타입의 대기중인 Job 필터링
  const pendingJobs =
    selectedGPUType === "전체"
      ? allJobs
      : allJobs.filter((job) => job.gpuType === selectedGPUType)

  const gridSize = getGridSize(displayNodes.length)
  const containerSize = 700
  const nodeSize = Math.floor((containerSize - (gridSize + 1) * 2) / gridSize)

  // 선택된 노드의 검색 결과 찾기
  const selectedNodeSearchResult = selectedNode
    ? searchResults.find((result) => result.node.id === selectedNode.id)
    : undefined

  // CPU/Memory 통계 계산
  const cpuMemoryStats = selectedNode
    ? {
        cpuUsage: selectedNode.cpuUsage,
        memoryUsage: selectedNode.memoryUsage,
        nodeName: selectedNode.name,
        isSelected: true,
      }
    : {
        cpuUsage: Math.round(displayNodes.reduce((sum, node) => sum + node.cpuUsage, 0) / (displayNodes.length || 1)),
        memoryUsage: Math.round(
          displayNodes.reduce((sum, node) => sum + node.memoryUsage, 0) / (displayNodes.length || 1),
        ),
        nodeName: `${selectedGPUType} 클러스터 평균`,
        isSelected: false,
      }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">GPU 클러스터 대시보드</h1>
            <div className="flex items-center gap-4">
              {/* 검색창 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="복합검색: 노드명/팀명/사용자명 (예: A100-2/음성/박민)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4" />
                <span>실시간 업데이트: {currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* GPU 타입 선택 버튼들 */}
          <div className="flex gap-2 mb-4">
            {gpuTypes.map((gpuType) => {
              const typeNodes = allNodes.filter((n) => n.gpuType === gpuType)
              const typeOnlineNodes = typeNodes.filter((n) => n.status === "online").length
              const typePendingJobs = allJobs.filter((j) => j.gpuType === gpuType).length

              return (
                <Button
                  key={gpuType}
                  variant={selectedGPUType === gpuType ? "default" : "outline"}
                  onClick={() => {
                    setSelectedGPUType(gpuType)
                    setSelectedNode(null)
                    setSearchTerm("") // GPU 타입 변경 시 검색 초기화
                  }}
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <span className="font-semibold">{gpuType}</span>
                  <span className="text-xs opacity-75">
                    {typeOnlineNodes}/{typeNodes.length} nodes
                  </span>
                  <span className="text-xs opacity-75 text-blue-600">{typePendingJobs} 대기</span>
                </Button>
              )
            })}
          </div>

          {/* CPU/Memory 사용률 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{cpuMemoryStats.nodeName}</h3>
              {selectedNode && (
                <button onClick={() => setSelectedNode(null)} className="text-sm text-blue-600 hover:text-blue-800">
                  ← 전체 평균으로 돌아가기
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU Allocation</span>
                  <span className="text-lg font-bold text-blue-600">{cpuMemoryStats.cpuUsage}%</span>
                </div>
                <UsageBar percentage={cpuMemoryStats.cpuUsage} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Memory Allocation</span>
                  <span className="text-lg font-bold text-purple-600">{cpuMemoryStats.memoryUsage}%</span>
                </div>
                <UsageBar percentage={cpuMemoryStats.memoryUsage} color="bg-purple-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">GPU Allocation</span>
                  <span className="text-lg font-bold text-green-600">{cpuMemoryStats.memoryUsage}%</span>
                </div>
                <UsageBar percentage={cpuMemoryStats.memoryUsage} color="bg-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 메인 레이아웃 */}
        <div className="flex gap-6">
          {/* 왼쪽: 노드 그리드 */}
          <div className="flex-shrink-0">
            <div className="mb-2 text-sm text-gray-600 flex justify-between items-center">
              <span>
                {searchTerm.trim() ? `검색 결과 (${searchResults.length}개 매칭)` : "사용량 높은 순서로 정렬"}
              </span>
              {searchTerm.trim() && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">
                    전체 매칭: {searchResults.filter((r) => r.isFullNodeMatch).length}개
                  </span>
                  <span className="text-orange-600">
                    부분 매칭: {searchResults.filter((r) => !r.isFullNodeMatch).length}개
                  </span>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  width: `${containerSize}px`,
                  height: `${containerSize}px`,
                  gap: "2px",
                }}
              >
                {displayNodes.map((node) => {
                  const searchResult = searchResults.find((result) => result.node.id === node.id)
                  return (
                    <NodeCard
                      key={node.id}
                      node={node}
                      size={nodeSize}
                      isSelected={selectedNode?.id === node.id}
                      onSelect={setSelectedNode}
                      searchResult={searchResult}
                    />
                  )
                })}
                {Array.from({ length: gridSize * gridSize - displayNodes.length }, (_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{ width: `${nodeSize}px`, height: `${nodeSize}px` }}
                    className="bg-gray-100 border border-gray-200"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 선택된 노드 상세 정보 또는 대기중인 Job Queue */}
          <div className="flex-1 space-y-4">
            {selectedNode ? (
              <NodeGPUDetails
                node={selectedNode}
                containerHeight={containerSize + 4}
                searchResult={selectedNodeSearchResult}
              />
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{selectedGPUType} 대기중인 작업</span>
                    <div className="text-sm font-normal text-gray-500">총 {pendingJobs.length}개 작업 대기</div>
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ height: `${containerSize - 76}px` }} className="overflow-y-auto">
                  <div className="space-y-3">
                    {pendingJobs.length > 0 ? (
                      pendingJobs.map((job) => <JobItem key={job.id} job={job} />)
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        현재 {selectedGPUType}에 대기 중인 작업이 없습니다.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-lg font-medium text-gray-700 mb-3">범례</h4>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">GPU 사용량</h5>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  { color: "bg-gray-100", label: "미사용" },
                  { color: "bg-emerald-500", label: "낮음 (1-25%)" },
                  { color: "bg-green-500", label: "보통 (26-50%)" },
                  { color: "bg-yellow-500", label: "높음 (51-75%)" },
                  { color: "bg-red-500", label: "매우높음 (76-100%)" },
                  { color: "bg-gray-400", label: "문제발생" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3 h-2 ${item.color} rounded-sm border`}></div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">노드 상태</h5>
              <div className="space-y-1 text-xs">
                {[
                  { border: "border-green-500", label: "온라인" },
                  { border: "border-red-500", label: "오프라인" },
                  { border: "border-yellow-500", label: "유지보수" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3 h-3 bg-white border-2 ${item.border}`}></div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">검색 하이라이트</h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded animate-[pulse_2s_ease-in-out_infinite]"></div>
                  <span className="font-semibold text-yellow-700">전체 노드 매칭</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-gradient-to-r from-yellow-200 to-orange-200 rounded animate-[pulse_2s_ease-in-out_infinite]"></div>
                  <span className="text-yellow-600">매칭 사용자 세그먼트</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                  💡 복합검색: 조건1/조건2/조건3
                  <br />✨ 매칭된 사용자 부분만 천천히 깜빡임 (2초 주기)
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">GPU 분할 사용</h5>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-blue-500 rounded"></div>
                  <span>사용자 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-green-500 rounded"></div>
                  <span>사용자 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-purple-500 rounded"></div>
                  <span>사용자 3</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">* 호버하면 상세 정보 표시</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
