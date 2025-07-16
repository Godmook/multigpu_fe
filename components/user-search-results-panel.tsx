import type { UserGPUUsage, Node, GPUType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { DetailedGPUBar } from "./detailed-gpu-bar";

// --- UserSearchResultsPanel 복구 ---
export const UserSearchResultsPanel = ({
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
                      gpu.segments.findIndex((seg) => seg.user === usage.user && seg.team === usage.team)
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