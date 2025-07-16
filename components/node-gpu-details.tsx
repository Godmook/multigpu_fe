import type { Node } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailedGPUBar } from "./detailed-gpu-bar";

// 선택된 노드의 GPU 상세 정보 컴포넌트
export const NodeGPUDetails = ({
  node,
  containerHeight,
  onBackToMain,
}: {
  node: Node
  containerHeight: number
  onBackToMain?: () => void
}) => {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {node.name} GPU 사용 현황
          </span>
        </CardTitle>
        {onBackToMain && (
          <Button
            variant="outline"
            size="sm"
            className="ml-2 text-xs"
            onClick={onBackToMain}
          >
            메인으로 돌아가기
          </Button>
        )}
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