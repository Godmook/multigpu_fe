// GPUDashboard.tsx – fixed expand/collapse for pending jobs and removed extra space

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Zap, User, Clock, Maximize2, Minimize2, PlusCircle } from "lucide-react"

import type {
  GPUType,
  GPUSegment,
  GPU,
  Node,
  Job,
  SearchResult,
  UserGPUUsage,
} from "@/lib/types"

import { GPU_NODE_COUNTS, users, teams } from "@/lib/constants";

import { getGridSize, getOptimalGridSize } from "@/lib/utils";

import { performComplexSearch, findGpusByUserOrTeam } from "@/lib/search";
import { DetailedGPUBar } from "@/components/detailed-gpu-bar";

import { UserSearchResultsPanel } from "@/components/user-search-results-panel";

// 사용률 막대그래프 컴포넌트
const UsageBar = ({ percentage, color }: { percentage: number; color: string }) => (
  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
    <div
      className={`h-3 rounded-full transition-all duration-300 ${color}`}
      style={{ width: `${percentage}%` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
    </div>
  </div>
)

import { NodeCard } from "@/components/node-card";
import { JobItem } from "@/components/job-item";
import { NodeGPUDetails } from "@/components/node-gpu-details";
import { JobSubmissionForm } from "@/components/job-submission-form";

const BASE_URL = "https://backend.dev.violet.uplus.co.kr";

// 안전한 fetch 유틸
async function safeFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Response is not JSON');
  }
  return res.json();
}

// 노드/실행중 GPU 정보
async function fetchNodes() {
  return safeFetch<{ nodes: Node[] }>('/api/proxy?url=/nodes/').then(d => d.nodes);
}

// 대기중 작업 (pending workloads)
async function fetchPendingWorkloads() {
  return safeFetch<{ pending_workloads: Record<string, any[]> }>('/api/proxy?url=/jobs/pending-workloads/')
    .then(d => Object.values(d.pending_workloads || {}).flat());
}

// 현재 시간 표시 컴포넌트 (Hydration mismatch 방지)
function TimeDisplay() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time ?? '--:--:--'}</span>;
}

// 메인 대시보드 컴포넌트
export default function GPUDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [allPendingWorkloads, setAllPendingWorkloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [nodes, pendingWorkloads] = await Promise.all([
        fetchNodes(),
        fetchPendingWorkloads(),
      ]);
      setAllNodes(nodes);
      setAllPendingWorkloads(pendingWorkloads);
      setLoading(false);
    }
    load();
  }, []);

  const [selectedGPUType, setSelectedGPUType] = useState<GPUType>("A100")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [focusMode, setFocusMode] = useState(false);
  const [selectedGpuUsages, setSelectedGpuUsages] = useState<UserGPUUsage[]>([]); // 초기값 빈 배열
  const [searchFilterGPUType, setSearchFilterGPUType] = useState<GPUType>("전체"); // 검색 결과 필터링용
  const [runningJobSearch, setRunningJobSearch] = useState("");
  const [pendingJobSearch, setPendingJobSearch] = useState("");
  const [selectedRunningJob, setSelectedRunningJob] = useState<Job|null>(null);
  const [expandMode, setExpandMode] = useState<"none"|"running"|"pending">("none");
  const [highlightedGpusByJob, setHighlightedGpusByJob] = useState<{[nodeId:string]: {[gpuIndex:number]: number}}|null>(null);
  const [nodeSortByJob, setNodeSortByJob] = useState<string[]|null>(null); // Node 우선 정렬용
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set()); // 파란 테두리용

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
  const runningJobs = allJobs.filter(job => job.status === "running" && (selectedGPUType === "전체" || job.gpuType === selectedGPUType));
  const pendingJobs = allPendingWorkloads.filter(job => (selectedGPUType === "전체" || job.gpuType === selectedGPUType));
  const filteredRunningJobs = runningJobs.filter(job => runningJobSearch.trim() === "" || job.name.toLowerCase().includes(runningJobSearch.toLowerCase()) || job.user.toLowerCase().includes(runningJobSearch.toLowerCase()) || job.team.toLowerCase().includes(runningJobSearch.toLowerCase()));
  const filteredPendingJobs = pendingJobs.filter(job => pendingJobSearch.trim() === "" || job.name.toLowerCase().includes(pendingJobSearch.toLowerCase()) || job.user.toLowerCase().includes(pendingJobSearch.toLowerCase()) || job.team.toLowerCase().includes(pendingJobSearch.toLowerCase()));

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

  // 전체모드에서 GPU 클릭 시 해당 Node들을 모두 맨 앞으로 정렬
  let leftNodesSorted = leftNodes;
  let selectedNodeIdsByGpuClick: Set<string> = new Set();
  if (!focusMode && selectedGpuUsages.length > 0) {
    selectedNodeIdsByGpuClick = new Set(selectedGpuUsages.map(u => u.nodeId));
    const selectedNodes = leftNodes.filter(n => selectedNodeIdsByGpuClick.has(n.id));
    const unselectedNodes = leftNodes.filter(n => !selectedNodeIdsByGpuClick.has(n.id));
    leftNodesSorted = [...selectedNodes, ...unselectedNodes];
  }
  // 진행중 작업 클릭 시 관련 Node를 맨 앞에 정렬
  if (!focusMode && nodeSortByJob && nodeSortByJob.length > 0) {
    const jobNodes = leftNodes.filter(n => nodeSortByJob.includes(n.id));
    const otherNodes = leftNodes.filter(n => !nodeSortByJob.includes(n.id));
    leftNodesSorted = [...jobNodes, ...otherNodes];
  }
  // 멀티서치와 진행중 작업이 동시에 있을 때, 멀티서치 우선 정렬
  if (!focusMode && selectedNodeIdsByGpuClick.size > 0 && nodeSortByJob && nodeSortByJob.length > 0) {
    const multiNodes = leftNodes.filter(n => selectedNodeIdsByGpuClick.has(n.id));
    const jobNodes = leftNodes.filter(n => nodeSortByJob.includes(n.id) && !selectedNodeIdsByGpuClick.has(n.id));
    const otherNodes = leftNodes.filter(n => !selectedNodeIdsByGpuClick.has(n.id) && !nodeSortByJob.includes(n.id));
    leftNodesSorted = [...multiNodes, ...jobNodes, ...otherNodes];
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

  // 전체모드에서 검색 결과 GPU 하이라이트 정보 생성
  let highlightGpuUsagesByNode: { [nodeId: string]: { [gpuIndex: number]: number } } = {};
  if (!focusMode && searchTerm.trim()) {
    // 검색 결과에서 노드별, GPU별로 segmentUsage 합산
    filteredSearchResults.forEach(u => {
      if (!highlightGpuUsagesByNode[u.nodeId]) highlightGpuUsagesByNode[u.nodeId] = {};
      highlightGpuUsagesByNode[u.nodeId][u.gpuIndex] = (highlightGpuUsagesByNode[u.nodeId][u.gpuIndex] || 0) + u.segmentUsage;
    });
  }

  // 진행중 작업 클릭 시 해당 GPU 하이라이트 (포커스 모드 X, 노드 전체 빛 X)
  function handleRunningJobSelect(job: Job) {
    setSelectedRunningJob(job);
    // 해당 작업이 사용 중인 GPU만 파란색 하이라이트
    const usages = findGpusByUserOrTeam(allNodes, job.user + " " + job.team);
    // 노드별, GPU별로 segmentUsage 합산
    const highlight: {[nodeId:string]: {[gpuIndex:number]: number}} = {};
    const nodeIds: string[] = [];
    usages.forEach(u => {
      if (!highlight[u.nodeId]) highlight[u.nodeId] = {};
      highlight[u.nodeId][u.gpuIndex] = (highlight[u.nodeId][u.gpuIndex] || 0) + u.segmentUsage;
      if (!nodeIds.includes(u.nodeId)) nodeIds.push(u.nodeId);
    });
    setHighlightedGpusByJob(highlight);
    setNodeSortByJob(nodeIds);
  }
  // 진행중/대기중 작업 선택 초기화 시 GPU 하이라이트도 초기화
  function clearJobGpuHighlights() {
    setSelectedRunningJob(null);
    setHighlightedGpusByJob(null);
    setNodeSortByJob(null);
  }

  // expand 모드에서 노란색 빛(animatePulse) 비활성화
  const isExpandActive = expandMode !== "none";

  // 하이라이트 노드 관리: 반드시 useEffect에서만 setState
  useEffect(() => {
    if (focusMode) {
      setHighlightedNodeIds(new Set());
      return;
    }
    // 멀티서치 우선
    if (selectedGpuUsages.length > 0) {
      setHighlightedNodeIds(new Set(selectedGpuUsages.map(u => u.nodeId)));
    } else if (nodeSortByJob && nodeSortByJob.length > 0) {
      setHighlightedNodeIds(new Set(nodeSortByJob));
    } else {
      setHighlightedNodeIds(new Set());
    }
  }, [focusMode, selectedGpuUsages, nodeSortByJob]);

  // 패널 높이 계산
  const runningPanelMaxHeight =
    expandMode === "running"
      ? containerSize
      : expandMode === "none"
      ? containerSize / 2
      : 0;

  const pendingPanelMaxHeight =
    expandMode === "pending"
      ? containerSize
      : expandMode === "none"
      ? containerSize / 2
      : 0;

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
              {/* 전체 보기 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => setSearchTerm("")}
              >
                전체 보기
              </Button>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" className="h-10 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    작업 제출
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-transparent border-none p-0">
                  <JobSubmissionForm />
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4" />
                <span>실시간 업데이트: <TimeDisplay /></span>
              </div>
            </div>
          </div>

          {/* GPU 타입 선택 버튼들 */}
          <div className="flex gap-2 mb-4">
            {gpuTypes.map((gpuType) => {
              const typeNodes = allNodes.filter((n) => n.gpuType === gpuType)
              const typeOnlineNodes = typeNodes.filter((n) => n.status === "online").length
              const typePendingJobs = allPendingWorkloads.filter((j) => j.gpuType === gpuType).length

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
                {leftNodesSorted.map((node) => {
                   // 전체모드+검색중이면 highlightGpuUsagesByNode 사용, 아니면 기존 방식
                   let highlightedGpuUsages = {};
                   let animatePulse = false;
                   if (!focusMode && searchTerm.trim()) {
                     highlightedGpuUsages = highlightGpuUsagesByNode[node.id] || {};
                   } else if (!focusMode && highlightedGpusByJob) {
                     // 진행중 작업 클릭 시 GPU별 하이라이트
                     highlightedGpuUsages = highlightedGpusByJob[node.id] || {};
                   } else {
                     const props = getNodeCardProps(node);
                     highlightedGpuUsages = props.highlightedGpuUsages;
                     animatePulse = props.animatePulse;
                   }
                   // expand 모드에서는 노란색 빛(animatePulse) 비활성화
                   if (isExpandActive) animatePulse = false;
                   // 전체모드에서 GPU 클릭 시 해당 Node 하이라이트 (여러개)
                   const isSelectedByGpuClick = !focusMode && highlightedNodeIds.has(node.id);
                   return (
                     <NodeCard
                       key={node.id}
                       node={node}
                       size={nodeSize}
                       isSelected={selectedNode?.id === node.id}
                       onSelect={setSelectedNode}
                       animatePulse={animatePulse}
                       highlightedGpuUsages={highlightedGpuUsages}
                       isSelectedByGpuClick={isSelectedByGpuClick}
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
          <div
            className="flex flex-col gap-0 flex-1"
            style={{
              height: `${containerSize}px`,
              minHeight: `${containerSize}px`,
              maxHeight: `${containerSize}px`,
            }}
          >
            {searchTerm.trim() ? (
              <UserSearchResultsPanel
                results={filteredSearchResults}
                selected={selectedGpuUsages}
                onSelect={handleGpuUsageSelect}
                containerHeight={containerSize}
                allNodes={allNodes}
                searchFilterGPUType={searchFilterGPUType}
                onFilterChange={setSearchFilterGPUType}
                onClearSelections={clearAllSelections}
              />
            ) : selectedNode ? (
              <NodeGPUDetails
                node={selectedNode}
                containerHeight={containerSize}
                onBackToMain={() => setSelectedNode(null)}
              />
            ) : (
              <>
                {/* 진행중 패널 */}
                <div
                  className="transition-all duration-500 ease-in-out overflow-hidden"
                  style={{
                    flexBasis: runningPanelMaxHeight,
                    maxHeight: runningPanelMaxHeight,
                  }}
                >
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{selectedGPUType} 진행중인 작업</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="진행중 작업 검색"
                            value={runningJobSearch}
                            onChange={e => setRunningJobSearch(e.target.value)}
                            className="w-40 text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { clearJobGpuHighlights(); setRunningJobSearch(""); }}
                            className="text-xs"
                          >
                            선택 초기화
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-xs"
                            onClick={() => setExpandMode(expandMode === "running" ? "none" : "running")}
                            aria-label={expandMode === "running" ? "축소" : "확대"}
                          >
                            {expandMode === "running" ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className="overflow-y-auto"
                      style={{
                        maxHeight:
                          expandMode === "running"
                            ? containerSize - 48
                            : expandMode === "none"
                            ? containerSize / 2 - 48
                            : 0,
                        minHeight: 0,
                        paddingBottom: 0,
                      }}
                    >
                      <div className="space-y-3">
                        {filteredRunningJobs.length > 0 ? (
                          filteredRunningJobs.map((job, index) => (
                            <div
                              key={job.id}
                              className={`cursor-pointer ${selectedRunningJob?.id === job.id ? "ring-2 ring-blue-400" : ""}`}
                              onClick={() => handleRunningJobSelect(job)}
                            >
                              <JobItem job={job} index={index} />
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            현재 {selectedGPUType}에 진행중인 작업이 없습니다.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* 패널 사이 여백 */}
                <div style={{ height: 12 }} />
                {/* 대기중 패널 */}
                <div
                  className="transition-all duration-500 ease-in-out overflow-hidden"
                  style={{
                    flexBasis: pendingPanelMaxHeight,
                    maxHeight: pendingPanelMaxHeight,
                    transform:
                      expandMode === "pending"
                        ? "translateY(0)"
                        : expandMode === "none"
                        ? "translateY(0)"
                        : "translateY(100%)",
                  }}
                >
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{selectedGPUType} 대기중인 작업</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="대기중 작업 검색"
                            value={pendingJobSearch}
                            onChange={e => setPendingJobSearch(e.target.value)}
                            className="w-40 text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingJobSearch("")}
                            className="text-xs"
                          >
                            선택 초기화
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-xs"
                            onClick={() => setExpandMode(expandMode === "pending" ? "none" : "pending")}
                            aria-label={expandMode === "pending" ? "축소" : "확대"}
                          >
                            {expandMode === "pending" ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className="overflow-y-auto"
                      style={{
                        maxHeight:
                          expandMode === "pending"
                            ? containerSize - 48
                            : expandMode === "none"
                            ? containerSize / 2 - 48
                            : 0,
                        minHeight: 0,
                        paddingBottom: 0,
                      }}
                    >
                      <div className="space-y-3">
                        {filteredPendingJobs.length > 0 ? (
                          filteredPendingJobs.map((job, index) => (
                            <JobItem key={job.id} job={job} index={index} />
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            현재 {selectedGPUType}에 대기 중인 작업이 없습니다.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
