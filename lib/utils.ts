import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 그리드 크기 계산
export const getGridSize = (nodeCount: number) => {
  const sqrt = Math.ceil(Math.sqrt(nodeCount))
  return sqrt
}

export function getOptimalGridSize(n: number) {
  return Math.ceil(Math.sqrt(n));
}
