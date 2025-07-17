"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, MemoryStick, HardDrive, X, Sparkles } from "lucide-react"

// Types
type GpuType = "H100" | "H200"
type GpuCount = 1 | 2 | 4 | 8
type GpuAllocation = 25 | 50 | 100
type DistributedProcessing = 2 | 4 | 8 | "N/A"

// Constants
const MAX_CPU_GB = 192
const MAX_RAM_GB = 1532
const MAX_GPU_QUOTA = 800

const allocationOptions: Record<GpuCount, GpuAllocation[]> = {
  1: [25, 50, 100],
  2: [50, 100],
  4: [100],
  8: [100],
}

const distributedOptions: Record<GpuCount, DistributedProcessing[]> = {
  1: ["N/A"],
  2: ["N/A", 2],
  4: ["N/A", 2, 4],
  8: ["N/A", 2, 4, 8],
}

interface ProgressBarProps {
  label: string
  value: number
  max: number
  unit: string
  color: string
  icon: React.ReactNode
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max, unit, color, icon }) => {
  const percentage = (value / max) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color.replace("bg-", "bg-").replace("-500", "-100")}`}>{icon}</div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900">
            {unit === "%" ? `${percentage.toFixed(1)}%` : `${value.toFixed(0)} ${unit}`}
          </div>
          {unit !== "%" && (
            <div className="text-xs text-gray-500">
              {percentage.toFixed(1)}% of {max}
            </div>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color} relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </motion.div>
      </div>
    </div>
  )
}

interface JobSubmissionFormProps {
  onClose?: () => void
}

export function JobSubmissionForm({ onClose }: JobSubmissionFormProps) {
  const [gpuType, setGpuType] = useState<GpuType>("H100")
  const [gpuCount, setGpuCount] = useState<GpuCount>(1)
  const [gpuAllocation, setGpuAllocation] = useState<GpuAllocation>(25)
  const [distributedProcessing, setDistributedProcessing] = useState<DistributedProcessing>("N/A")

  const availableAllocations = useMemo(() => allocationOptions[gpuCount], [gpuCount])
  const availableDistributedOptions = useMemo(() => distributedOptions[gpuCount], [gpuCount])

  const handleGpuCountChange = useCallback(
    (newCount: GpuCount) => {
      setGpuCount(newCount)
      const newAllocations = allocationOptions[newCount]

      if (!newAllocations.includes(gpuAllocation)) {
        setGpuAllocation(newAllocations[0])
      }

      const newDistOptions = distributedOptions[newCount]
      if (!newDistOptions.includes(distributedProcessing)) {
        setDistributedProcessing("N/A")
      }
    },
    [gpuAllocation, distributedProcessing],
  )

  const { allocatedCpu, allocatedRam, allocatedGpuQuota } = useMemo(() => {
    const ratio = gpuAllocation / 100
    const totalGpuQuotaUsed = gpuCount * ratio * 100

    return {
      allocatedCpu: MAX_CPU_GB * totalGpuQuotaUsed/MAX_GPU_QUOTA,
      allocatedRam: MAX_RAM_GB * totalGpuQuotaUsed/MAX_GPU_QUOTA,
      allocatedGpuQuota: totalGpuQuotaUsed,
    }
  }, [gpuCount, gpuAllocation])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-1 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="relative pb-4 bg-gradient-to-r from-blue-50 to-purple-50">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/80 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">GPU 유형 설정</CardTitle>
              <p className="text-sm text-gray-600 mt-1">원하는 GPU 구성을 선택하여 고성능 작업을 시작하세요</p>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* GPU Type Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">GPU 유형 선택</h3>
              <div className="grid grid-cols-2 gap-3">
                {(["H100", "H200"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setGpuType(type)}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium
                      ${
                        gpuType === type
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {type === "H200" && <Sparkles className="w-4 h-4" />}
                      {type}
                    </div>
                    {gpuType === type && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            {/* GPU Count Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">GPU 개수 설정</h3>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 8].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleGpuCountChange(count as GpuCount)}
                    className={`
                      relative p-2.5 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                      ${
                        gpuCount === count
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    {count}
                    {gpuCount === count && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* GPU Allocation Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">GPU 할당량 설정</h3>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${gpuCount}-${availableAllocations.join("-")}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`grid gap-2 ${
                    availableAllocations.length === 1
                      ? "grid-cols-1"
                      : availableAllocations.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-3"
                  }`}
                >
                  {availableAllocations.map((alloc) => (
                    <button
                      key={alloc}
                      onClick={() => setGpuAllocation(alloc)}
                      className={`
                        relative p-2.5 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                        ${
                          gpuAllocation === alloc
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      {alloc}%
                      {gpuAllocation === alloc && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Distributed Processing */}
            <AnimatePresence>
              {gpuCount > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <h3 className="text-sm font-semibold text-gray-700">분산 처리 설정</h3>
                  <motion.div
                    key={`dist-${gpuCount}-${availableDistributedOptions.join("-")}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`grid gap-2 ${
                      availableDistributedOptions.length === 1
                        ? "grid-cols-1"
                        : availableDistributedOptions.length === 2
                          ? "grid-cols-2"
                          : availableDistributedOptions.length === 3
                            ? "grid-cols-3"
                            : "grid-cols-4"
                    }`}
                  >
                    {availableDistributedOptions.map((dist) => (
                      <button
                        key={dist}
                        onClick={() => setDistributedProcessing(dist)}
                        className={`
                          relative p-2.5 rounded-lg border-2 transition-all duration-200 text-xs font-medium
                          ${
                            distributedProcessing === dist
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }
                        `}
                      >
                        {dist === "N/A" ? "None" : `${dist}-way`}
                        {distributedProcessing === dist && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resource Usage */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">예상 자원 할당량</h3>
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                <ProgressBar
                  label="CPU"
                  value={allocatedCpu}
                  max={MAX_CPU_GB}
                  unit="GB"
                  color="bg-blue-500"
                  icon={<Cpu className="w-4 h-4 text-blue-600" />}
                />
                <ProgressBar
                  label="RAM"
                  value={allocatedRam}
                  max={MAX_RAM_GB}
                  unit="GB"
                  color="bg-purple-500"
                  icon={<MemoryStick className="w-4 h-4 text-purple-600" />}
                />
                <ProgressBar
                  label="GPU"
                  value={(allocatedGpuQuota / MAX_GPU_QUOTA) * 100}
                  max={100}
                  unit="%"
                  color="bg-green-500"
                  icon={<HardDrive className="w-4 h-4 text-green-600" />}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              작업 제출하기
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
