// GPU 타입 정의
export type GPUType = "A100" | "A30" | "H100" | "H200" | "전체";

// GPU 사용 세그먼트 인터페이스
export interface GPUSegment {
  user: string;
  team: string;
  usage: 25 | 50 | 75 | 100;
}

// GPU 인터페이스
export interface GPU {
  id: string;
  usage: number;
  status: "active" | "idle" | "error";
  segments: GPUSegment[];
  totalUsage: 25 | 50 | 75 | 100;
}

// Node 인터페이스
export interface Node {
  id: string;
  name: string;
  gpuType: GPUType;
  gpus: GPU[];
  status: "online" | "offline" | "maintenance";
  avgUsage: number;
  cpuUsage: number;
  memoryUsage: number;
}

// Job 인터페이스
export interface Job {
  id: string;
  name: string;
  user: string;
  team: string;
  priority: "high" | "normal" | "low";
  gpuType: GPUType;
  gpuRequest: number; // 요청한 GPU 개수 (0.25, 0.5, 1, 2, 4, 8 등)
  cpuRequest: number; // 요청한 CPU 개수
  memoryRequest: number; // 요청한 Memory GB
  submittedAt: Date; // 작업 제출 시간
  status: "running" | "pending"; // 작업 상태
}

// 검색 결과 인터페이스
export interface SearchResult {
  node: Node;
  matchingGPUs: number[]; // 매칭되는 GPU 인덱스들
  isFullNodeMatch: boolean; // 노드 전체가 매칭되는지
  matchingSegments: { [gpuIndex: number]: number[] }; // GPU별 매칭되는 세그먼트 인덱스들
}

// --- 신규 타입 정의 (사용자 검색 전용) ---
export interface UserGPUUsage {
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
