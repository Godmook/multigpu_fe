import type { Job } from "@/lib/types";
import { User, Clock } from "lucide-react";

// Job 아이템 컴포넌트
export const JobItem = ({ job, index }: { job: Job; index: number }) => {
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