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
  gpuRequest: number // 요청한 GPU 개수 (0.25, 0.5, 1, 2, 4, 8 등)
  cpuRequest: number // 요청한 CPU 개수
  memoryRequest: number // 요청한 Memory GB
  submittedAt: Date // 작업 제출 시간
}

// 검색 결과 인터페이스
interface SearchResult {
  node: Node
  matchingGPUs: number[] // 매칭되는 GPU 인덱스들
  isFullNodeMatch: boolean // 노드 전체가 매칭되는지
  matchingSegments: { [gpuIndex: number]: number[] } // GPU별 매칭되는 세그먼트 인덱스들
}

// --- 신규 타입 정의 (사용자 검색 전용) ---
interface UserGPUUsage {
  nodeId: string;
  nodeName: string;
  gpuId: string;
  gpuIndex: number;
  user: string;
  team: string;
  totalUsage: number; // GPU 전체 사용량 %
  segmentUsage: number; // 이 사용자가 해당 GPU에서 차지하는 %
  gpuType: GPUType;
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

function getOptimalGridSize(n: number) {
  return Math.ceil(Math.sqrt(n));
}

// 샘플 사용자/팀 데이터
const users = ["김철수", "이영희", "박민수", "정수진", "최영호", "한미영", "임동현", "송지은", "조현우", "윤서연"]
const teams = ["AI연구팀", "데이터팀", "비전팀", "NLP팀", "로보틱스팀", "추천팀", "검색팀", "음성팀"]

// 샘플 Job 데이터 생성
const generateJobs = (): Job[] => {
  const jobs: Job[] = []
  const gpuTypes: GPUType[] = ["A100", "A30", "H100", "H200"]
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

  // GPU 요청량 옵션들
  const gpuRequestOptions = [0.25, 0.5, 1, 2, 4, 8]
  const cpuRequestOptions = [1, 2, 4, 8, 16, 32]
  const memoryRequestOptions = [4, 8, 16, 32, 64, 128]

  gpuTypes.forEach((gpuType) => {
    const pendingCount = Math.floor(Math.random() * 12) + 3
    for (let i = 0; i < pendingCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const team = teams[Math.floor(Math.random() * teams.length)]

      // 랜덤하게 리소스 요청량 결정
      const gpuRequest = gpuRequestOptions[Math.floor(Math.random() * gpuRequestOptions.length)]
      const cpuRequest = cpuRequestOptions[Math.floor(Math.random() * cpuRequestOptions.length)]
      const memoryRequest = memoryRequestOptions[Math.floor(Math.random() * memoryRequestOptions.length)]

      // 최근 24시간 내 랜덤 시간 생성
      const now = new Date()
      const submittedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)

      jobs.push({
        id: `${gpuType}-pending-${i + 1}`,
        name: jobNames[Math.floor(Math.random() * jobNames.length)],
        user,
        team,
        priority: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "normal" : "low",
        gpuType,
        gpuRequest,
        cpuRequest,
        memoryRequest,
        submittedAt,
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

// --- 사용자/팀 GPU 사용 현황 검색 함수 복구 ---
const findGpusByUserOrTeam = (nodes: Node[], searchTerm: string): UserGPUUsage[] => {
  if (!searchTerm.trim()) return [];
  
  // 검색어를 공백, 슬래시, 콤마 등으로 분리
  const searchTerms = searchTerm.toLowerCase().split(/[\s\/,]+/).filter(term => term.trim());
  const results: UserGPUUsage[] = [];
  
  nodes.forEach((node) => {
    node.gpus.forEach((gpu, gpuIndex) => {
      if (gpu.status === 'active') {
        gpu.segments.forEach((segment) => {
          // 모든 검색어가 사용자명, 팀명, 또는 GPU 타입에 포함되는지 확인
          const userLower = segment.user.toLowerCase();
          const teamLower = segment.team.toLowerCase();
          const gpuTypeLower = node.gpuType.toLowerCase();
          
          const allTermsMatch = searchTerms.every(term => 
            userLower.includes(term) || 
            teamLower.includes(term) || 
            gpuTypeLower.includes(term)
          );
          
          if (allTermsMatch) {
            results.push({
              nodeId: node.id,
              nodeName: node.name,
              gpuId: gpu.id,
              gpuIndex: gpuIndex,
              user: segment.user,
              team: segment.team,
              totalUsage: gpu.totalUsage,
              segmentUsage: segment.usage,
              gpuType: node.gpuType,
            });
          }
        });
      }
    });
  });
  const uniqueResults = Array.from(new Map(results.map(item => [item.gpuId + item.user + item.team, item])).values());
  return uniqueResults.sort((a,b) => a.nodeName.localeCompare(b.nodeName));
};

// --- UserSearchResultsPanel 복구 ---
const UserSearchResultsPanel = ({
  results,
  selected,
  onSelect,
  containerHeight,
  allNodes,
  searchFilterGPUType,
  onFilterChange,
  onClearSelections,
}: {
  results: UserGPUUsage[];
  selected: UserGPUUsage[];
  onSelect: (usage: UserGPUUsage, isCtrlPressed: boolean) => void;
  containerHeight: number;
  allNodes: Node[];
  searchFilterGPUType: GPUType;
  onFilterChange: (type: GPUType) => void;
  onClearSelections: () => void;
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  
  // 전체 검색 결과에서 GPU 타입별 합산 (필터링 전)
  const totalSummary = results.reduce((acc, cur) => {
    acc[cur.gpuType] = (acc[cur.gpuType] || 0) + cur.segmentUsage / 100;
    return acc;
  }, {} as Record<GPUType, number>);
  
  // 내부 검색 필터링
  const filteredResults = internalSearchTerm.trim()
    ? results.filter(result => 
        result.nodeName.toLowerCase().includes(internalSearchTerm.toLowerCase()) ||
        result.user.toLowerCase().includes(internalSearchTerm.toLowerCase()) ||
        result.team.toLowerCase().includes(internalSearchTerm.toLowerCase()) ||
        result.gpuType.toLowerCase().includes(internalSearchTerm.toLowerCase())
      )
    : results;
  
  const userOrTeam = results[0]?.user || results[0]?.team || "";
  // Node 객체 찾기
  const getNodeById = (nodeId: string) => allNodes.find(n => n.id === nodeId);
  
  const gpuTypes: GPUType[] = ["전체", "A100", "A30", "H100", "H200"];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>검색 결과: {filteredResults.length}개 GPU 사용 중</span>
          {selected.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelections}
              className="text-xs"
            >
              선택 초기화 ({selected.length})
            </Button>
          )}
        </CardTitle>
        
        {/* 내부 검색창 */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="검색 결과 내에서 추가 검색 (노드명/사용자명/팀명/GPU타입)"
            value={internalSearchTerm}
            onChange={(e) => setInternalSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        {/* GPU 타입별 필터링 버튼 */}
        <div className="flex gap-2 mt-2">
          {gpuTypes.map((gpuType) => {
            const typeResults = filteredResults.filter(r => gpuType === "전체" || r.gpuType === gpuType);
            return (
              <Button
                key={gpuType}
                variant={searchFilterGPUType === gpuType ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange(gpuType)}
                className="text-xs"
              >
                {gpuType} ({typeResults.length})
              </Button>
            );
          })}
        </div>
        
        {/* 상단 요약 박스 - 전체 검색 결과 기준 */}
        {Object.keys(totalSummary).length > 0 && (
          <div className="mt-2 mb-1 p-3 bg-blue-50 rounded border border-blue-200 text-sm text-blue-900 font-semibold flex flex-wrap gap-4">
            <span className="mr-2">검색결과의 전체 사용량:</span>
            {Object.entries(totalSummary).filter(([type, val]) => val > 0 && type !== '전체').map(([type, val]) => (
              <span key={type} className="mr-2">
                {type}: {val.toFixed(2)}장
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent style={{ height: `${containerHeight - 76}px` }} className="overflow-y-auto">
        <div className="space-y-4">
          {filteredResults.map((usage) => {
            const node = getNodeById(usage.nodeId);
            const gpu = node ? node.gpus[usage.gpuIndex] : undefined;
            const isSelected = selected.some(s => s.gpuId === usage.gpuId && s.user === usage.user && s.team === usage.team);
            return (
              <div
                key={usage.gpuId + usage.user + usage.team}
                onClick={e => onSelect(usage, e.ctrlKey || e.metaKey)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col gap-2 ${isSelected ? "bg-blue-100 border-blue-400 shadow" : "bg-white hover:bg-blue-50"}`}
                style={{ position: 'relative' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-gray-800">
                    {usage.nodeName} - GPU {usage.gpuIndex + 1} <span className="ml-2 text-xs text-blue-700 font-semibold">{usage.gpuType}</span>
                  </div>
                </div>
                {/* 실제 상세 바 */}
                {gpu && (
                  <div className="mb-2">
                    <DetailedGPUBar gpu={gpu} matchingSegmentIndexes={[
                      gpu.segments.findIndex((seg: GPUSegment) => seg.user === usage.user && seg.team === usage.team)
                    ]} />
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1.5">{usage.user} ({usage.team})</span>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    {usage.segmentUsage}% 사용 ({(usage.segmentUsage/100).toFixed(2)}장)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Node 상태에 따른 테두리 색상
// const getNodeBorderColor = (status: string) => {
//   switch (status) {
//     case "online":
//       return "border-green-500"
//     case "offline":
//       return "border-red-500"
//     case "maintenance":
//       return "border-yellow-500"
//     default:
//       return "border-gray-500"
//   }
// }

// 사용률 막대그래프 컴포넌트
const UsageBar = ({ percentage, color }: { percentage: number; color: string }) => (
  <div className="w-full bg-gray-200 rounded-full h-3">
    <div className={`h-3 rounded-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }} />
  </div>
)

// GPU 막대그래프 컴포넌트 (포커스 모드에서 선택된 사용자의 사용량만 파란색으로 표시)
const GPUProgressBar = ({
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



// 상세 GPU 사용률 바 (매칭된 세그먼트만 천천히 깜빡임)
const DetailedGPUBar = ({
  gpu,
  matchingSegmentIndexes,
  pulseColor = "blue"
}: {
  gpu: GPU
  matchingSegmentIndexes?: number[]
  pulseColor?: "blue" | "yellow"
}) => {
  if (gpu.status !== "active" || gpu.segments.length === 0) {
    return (
      <div
        className={`
          w-full h-8 bg-gray-200 rounded flex items-center justify-center transition-all duration-300
          ${matchingSegmentIndexes && matchingSegmentIndexes.length > 0 ? `animate-[pulse_2s_ease-in-out_infinite] ${pulseColor === "blue" ? "shadow-[0_0_0_2px_#3b82f6]" : "shadow-[0_0_0_2px_#facc15]"}` : ""}
        `}
      >
        <span
          className={`text-xs relative z-10 ${
            matchingSegmentIndexes && matchingSegmentIndexes.length > 0 ? (pulseColor === "blue" ? "text-blue-800 font-bold" : "text-yellow-800 font-bold") : "text-gray-500"
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
                ${isMatching ? `animate-[pulse_2s_ease-in-out_infinite] ${pulseColor === "blue" ? "shadow-[0_0_0_2px_#3b82f6]" : "shadow-[0_0_0_2px_#facc15]"}` : ""}
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
                {isMatching && <div className={pulseColor === "blue" ? "text-blue-300 font-bold" : "text-yellow-300 font-bold"}>🔍 검색 매칭</div>}
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
  animatePulse = false,
  highlightedGpuUsages = {},
}: {
  node: Node;
  size: number;
  isSelected: boolean;
  onSelect: (node: Node) => void;
  animatePulse?: boolean;
  highlightedGpuUsages?: { [key: number]: number };
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

// Job 아이템 컴포넌트
const JobItem = ({ job, index }: { job: Job; index: number }) => {
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}시간 ${diffMinutes}분 전`
    } else {
      return `${diffMinutes}분 전`
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      {/* 순서 번호 */}
      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{job.name}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor()}`}>{job.priority}</span>
        </div>
        
        {/* 사용자 및 팀 정보 */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{job.user}</span>
          </div>
          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{job.team}</span>
        </div>
        
        {/* 리소스 요청 정보 */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-1">
          <div className="flex items-center gap-1">
            <span className="font-medium">GPU:</span>
            <span className="bg-blue-100 px-1.5 py-0.5 rounded">{job.gpuRequest}개</span>
            <span className="bg-orange-100 px-1.5 py-0.5 rounded text-orange-700">{job.gpuType}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">CPU:</span>
            <span className="bg-green-100 px-1.5 py-0.5 rounded">{job.cpuRequest}개</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Memory:</span>
            <span className="bg-purple-100 px-1.5 py-0.5 rounded">{job.memoryRequest}GB</span>
          </div>
        </div>
        
        {/* 제출 시간 */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(job.submittedAt)}</span>
        </div>
      </div>
    </div>
  )
}

// 선택된 노드의 GPU 상세 정보 컴포넌트
const NodeGPUDetails = ({
  node,
  containerHeight,
}: {
  node: Node
  containerHeight: number
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {node.name} GPU 사용 현황
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent style={{ height: `${containerHeight - 80}px` }} className="overflow-y-auto">
        <div className="space-y-4">
          {node.gpus.map((gpu, index) => {
            return (
              <div key={gpu.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`
                    text-sm font-mono font-semibold flex items-center gap-2
                    text-gray-700
                  `}
                  >
                    GPU-{index + 1}
                  </div>
                  <div
                    className={`
                  text-sm font-semibold
                  text-gray-900
                `}
                  >
                    {gpu.totalUsage}%
                  </div>
                </div>
                <DetailedGPUBar gpu={gpu} matchingSegmentIndexes={[]} pulseColor="blue" />
                {gpu.segments.length > 0 && (
                  <div
                    className={`
                  text-xs pl-2 transition-all duration-300
                  text-gray-500
                `}
                  >
                    {gpu.segments.map((segment, segIndex) => {
                      return (
                        <div key={segIndex} className="flex items-center gap-2">
                          <div
                            className={`
                            w-2 h-2 rounded-full
                            bg-blue-500
                          `}
                            style={{
                              animationDelay: undefined,
                            }}
                          ></div>
                          <span
                            className=""
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
  const [focusMode, setFocusMode] = useState(false);
  const [selectedGpuUsages, setSelectedGpuUsages] = useState<UserGPUUsage[]>([]); // 초기값 빈 배열
  const [searchFilterGPUType, setSearchFilterGPUType] = useState<GPUType>("전체"); // 검색 결과 필터링용

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      setSelectedGpuUsages([]); // 검색 결과가 바뀌면 항상 빈 배열로 초기화(자동 선택 X)
      setSearchFilterGPUType("전체"); // 검색 시 필터 초기화
    } else {
       setSelectedGpuUsages([]);
    }
    setSelectedNode(null);
  }, [searchTerm, allNodes]);

  const gpuTypes: GPUType[] = ["전체","A100", "A30", "H100", "H200"]

  // 기본 필터링 (GPU 타입별)
  const typeFilteredNodes = 
    selectedGPUType === "전체"
      ? allNodes
      : allNodes.filter((node) => node.gpuType === selectedGPUType)

  // 복합 검색 수행 (검색 시에는 전체 노드에서 검색)
  const searchResults = performComplexSearch(allNodes, searchTerm)

  // 최종 표시할 노드들 (검색 결과가 있으면 검색 결과만, 없으면 전체)
  const displayNodes = searchTerm.trim()
    ? searchResults.map((result) => result.node)
    : typeFilteredNodes.sort((a, b) => b.avgUsage - a.avgUsage)

  // 선택된 GPU 타입의 대기중인 Job 필터링
  const pendingJobs =
    selectedGPUType === "전체"
      ? allJobs
      : allJobs.filter((job) => job.gpuType === selectedGPUType)

  // 선택된 GPU가 속한 Node id 집합
  const selectedNodeIds = new Set(selectedGpuUsages.map(u => u.nodeId));

  // 포커스 모드: 선택된 Node만, 전체 모드: 전체 Node(선택된 Node는 앞쪽에)
  let leftNodes: Node[];
  if (focusMode) {
    leftNodes = allNodes.filter(n => selectedNodeIds.has(n.id));
  } else {
    // 검색 중이면 검색 결과 사용, 아니면 GPU 타입별 필터링된 노드 사용
    let baseNodes: Node[];
    if (searchTerm.trim()) {
      // 검색 중일 때
      if (searchFilterGPUType === "전체") {
        // 전체 선택 시 검색 결과의 모든 노드 표시
        baseNodes = searchResults.map((result) => result.node);
      } else {
        // 특정 GPU 타입 선택 시 해당 GPU 타입의 노드만 표시
        baseNodes = searchResults
          .filter(result => result.node.gpuType === searchFilterGPUType)
          .map((result) => result.node);
      }
    } else {
      // 검색하지 않을 때는 기존 로직
      baseNodes = typeFilteredNodes.sort((a, b) => b.avgUsage - a.avgUsage);
    }
    
    const selectedNodes = baseNodes.filter(n => selectedNodeIds.has(n.id));
    const unselectedNodes = baseNodes.filter(n => !selectedNodeIds.has(n.id));
    leftNodes = [...selectedNodes, ...unselectedNodes];
  }

  // CPU/Memory 통계 계산 (기존 로직)
  const cpuMemoryStats = selectedNode
    ? {
        cpuUsage: selectedNode.cpuUsage,
        memoryUsage: selectedNode.memoryUsage,
        nodeName: selectedNode.name,
        isSelected: true,
      }
    : {
        cpuUsage: Math.round(leftNodes.reduce((sum, node) => sum + node.cpuUsage, 0) / (leftNodes.length || 1)),
        memoryUsage: Math.round(
          leftNodes.reduce((sum, node) => sum + node.memoryUsage, 0) / (leftNodes.length || 1),
        ),
        nodeName: focusMode ? '선택 노드 평균' : `${selectedGPUType} 클러스터 평균`,
        isSelected: false,
      };

  // 그리드 사이즈 동적 계산
  const gridSize = focusMode ? getOptimalGridSize(leftNodes.length) : getGridSize(leftNodes.length);
  const containerSize = 700;
  const nodeSize = leftNodes.length > 0 ? Math.floor((containerSize - (gridSize + 1) * 2) / gridSize) : 0;

  // GPU 카드 클릭 핸들러 (Ctrl+Click 지원)
  const handleGpuUsageSelect = (usage: UserGPUUsage, isCtrlPressed: boolean) => {
    setSelectedNode(null);
    setSelectedGpuUsages(prev => {
      const isAlreadySelected = prev.some(s => s.gpuId === usage.gpuId && s.user === usage.user && s.team === usage.team);
      if (isCtrlPressed) {
        // Ctrl+Click: 다중 선택/해제
        return isAlreadySelected ? prev.filter(s => !(s.gpuId === usage.gpuId && s.user === usage.user && s.team === usage.team)) : [...prev, usage];
      } else {
        // 단일 클릭: 단일 선택 (기존 선택 해제 후 새로 선택)
        return [usage];
      }
    });
  };

  // 선택 초기화 함수
  const clearAllSelections = () => {
    setSelectedGpuUsages([]);
    setSelectedNode(null);
    setFocusMode(false); // 포커스 모드 해제
  };

  // 포커스 모드: Node별로 선택된 GPU 인덱스 및 사용량 계산, 전체 모드: Node 전체 animatePulse
  function getNodeCardProps(node: Node) {
    if (focusMode) {
      // 포커스 모드: GPU별 하이라이트 및 사용량 전달
      const highlightedGpuUsages: { [key: number]: number } = {};
      selectedGpuUsages
        .filter(u => u.nodeId === node.id)
        .forEach(u => {
          // 동일 GPU에 여러 사용자가 선택된 경우 사용량을 합산
          highlightedGpuUsages[u.gpuIndex] = (highlightedGpuUsages[u.gpuIndex] || 0) + u.segmentUsage;
        });
      return { highlightedGpuUsages, animatePulse: false };
    } else {
      // 전체 모드: Node 전체 animatePulse
      const animatePulse = selectedNodeIds.has(node.id) && selectedGpuUsages.length > 0;
      return { highlightedGpuUsages: {}, animatePulse };
    }
  }

  // 검색 결과 필터링
  const filteredSearchResults = searchTerm.trim() 
    ? findGpusByUserOrTeam(allNodes, searchTerm).filter(result => 
        searchFilterGPUType === "전체" || result.gpuType === searchFilterGPUType
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">GPU Monitoring Dashboard</h1>
            <div className="flex items-center gap-4">
              {/* 검색창 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="노드/프로젝트/이름 (예: A30-01/음성/홍길동)"
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
                    // GPU 타입 변경 시 검색 초기화하지 않음
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
            {/* 모드 전환 버튼 */}
            {selectedGpuUsages.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant={!focusMode ? 'default' : 'outline'}
                  onClick={() => setFocusMode(false)}
                >전체 모드</Button>
                <Button
                  variant={focusMode ? 'default' : 'outline'}
                  disabled={selectedGpuUsages.length === 0}
                  onClick={() => setFocusMode(true)}
                >포커스 모드</Button>
              </div>
            )}
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
                {leftNodes.map((node) => {
                  const { highlightedGpuUsages, animatePulse } = getNodeCardProps(node);
                  return (
                    <NodeCard
                      key={node.id}
                      node={node}
                      size={nodeSize}
                      isSelected={selectedNode?.id === node.id}
                      onSelect={setSelectedNode}
                      animatePulse={animatePulse}
                      highlightedGpuUsages={highlightedGpuUsages}
                    />
                  )
                })}
                {Array.from({ length: gridSize * gridSize - leftNodes.length }, (_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{ width: `${nodeSize}px`, height: `${nodeSize}px` }}
                    className="bg-gray-100 border border-gray-200"
                  />
                ))}
              </div>
            </div>
          </div>
          {/* 오른쪽: 검색창이 있을 때만 UserSearchResultsPanel, 없으면 기존 대기열/노드 상세 */}
          <div className="flex-1 space-y-4">
            {searchTerm.trim() ? (
              <UserSearchResultsPanel
                results={filteredSearchResults}
                selected={selectedGpuUsages}
                onSelect={handleGpuUsageSelect}
                containerHeight={containerSize + 4}
                allNodes={allNodes}
                searchFilterGPUType={searchFilterGPUType}
                onFilterChange={setSearchFilterGPUType}
                onClearSelections={clearAllSelections}
              />
            ) : selectedNode ? (
              <NodeGPUDetails
                node={selectedNode}
                containerHeight={containerSize + 4}
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
                      pendingJobs.map((job, index) => <JobItem key={job.id} job={job} index={index} />)
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
                  🔍 복합검색: 조건1/조건2/조건3
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
