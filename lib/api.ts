import axios from 'axios';
import type { GPUType, GPUSegment, GPU, Node, Job } from './types';
import { GPU_NODE_COUNTS, users, teams } from './constants';

const apiClient = axios.create({
  baseURL: 'http://backend.dev.violet.uplus.co.kr:5000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// 실제 API 호출 함수 (예시)
export const fetchNodes = async (): Promise<Node[]> => {
  try {
    // const response = await apiClient.get('/api/nodes');
    // return response.data;
    // 임시로 샘플 데이터 반환
    return generateSampleNodes();
  } catch (error) { 
    console.error('Error fetching nodes:', error);
    // 실제 API 호출 실패 시 샘플 데이터 반환
    return generateSampleNodes();
  }
};

export const fetchJobs = async (nodes: Node[]): Promise<Job[]> => {
  try {
    // const response = await apiClient.get('/api/jobs');
    // return response.data;
    return generateJobs(nodes);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return generateJobs(nodes);
  }
};

// GPU 세그먼트 생성 함수
const generateGPUSegments = (totalUsage: 25 | 50 | 75 | 100): GPUSegment[] => {
  const segments: GPUSegment[] = [];
  let remainingUsage = totalUsage;

  while (remainingUsage > 0) {
    const user = users[Math.floor(Math.random() * users.length)];
    const team = teams[Math.floor(Math.random() * teams.length)];

    let segmentUsage: 25 | 50 | 75 | 100;
    if (remainingUsage >= 75 && Math.random() > 0.5) {
      segmentUsage = 75;
    } else if (remainingUsage >= 50 && Math.random() > 0.5) {
      segmentUsage = 50;
    } else if (remainingUsage >= 25) {
      segmentUsage = 25;
    } else {
      break;
    }

    segments.push({ user, team, usage: segmentUsage });
    remainingUsage -= segmentUsage;
  }

  return segments;
};

// 샘플 데이터 생성
export const generateSampleNodes = (): Node[] => {
  const gpuTypes: GPUType[] = ["A100", "A30", "H100", "H200"];
  const nodes: Node[] = [];

  gpuTypes.forEach((gpuType) => {
    const nodeCount = GPU_NODE_COUNTS[gpuType as GPUType];

    for (let i = 1; i <= nodeCount; i++) {
      const gpuCount = Math.random() > 0.3 ? 8 : 4;
      const gpus: GPU[] = [];

      for (let j = 1; j <= gpuCount; j++) {
        let usage: number;
        let status: "active" | "idle" | "error" = "active";
        let totalUsage: 25 | 50 | 75 | 100 = 25;
        let segments: GPUSegment[] = [];

        const statusRand = Math.random();
        if (statusRand < 0.05) {
          status = "error";
          usage = 0;
          totalUsage = 25;
        } else if (statusRand < 0.1) {
          status = "idle";
          usage = 0;
          totalUsage = 25;
        } else {
          const usageOptions: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100];
          totalUsage = usageOptions[Math.floor(Math.random() * usageOptions.length)];
          usage = Math.floor((totalUsage / 100) * 8);
          segments = generateGPUSegments(totalUsage);
        }

        gpus.push({
          id: `${gpuType}-${i}-${j}`,
          usage,
          status,
          segments,
          totalUsage,
        });
      }

      const activeGpus = gpus.filter((gpu) => gpu.status === "active" && gpu.usage>0);
      const avgUsage =
        activeGpus.length > 0 ? activeGpus.reduce((sum, gpu) => sum + gpu.usage, 0) / activeGpus.length / 8 : 0;

      const baseCpuUsage = avgUsage * 60 + Math.random() * 30;
      const baseMemoryUsage = avgUsage * 50 + Math.random() * 40;

      nodes.push({
        id: `${gpuType}-node-${i}`,
        name: `${gpuType}-${i.toString().padStart(2, "0")}`,
        gpuType,
        gpus,
        status: Math.random() > 0.05 ? "online" : Math.random() > 0.5 ? "offline" : "maintenance",
        avgUsage,
        cpuUsage: Math.min(100, Math.max(0, Math.round(baseCpuUsage))),
        memoryUsage: Math.min(100, Math.max(0, Math.round(baseMemoryUsage))),
      });
    }
  });

  return nodes;
};

// 샘플 Job 데이터 생성
export const generateJobs = (nodes: Node[]): Job[] => {
  const runningJobs: Job[] = [];
  const pendingJobs: Job[] = [];
  const gpuTypes: GPUType[] = ["A100", "A30", "H100", "H200"];
  const jobNames = [
    "ResNet Training",
    "BERT Fine-tuning",
    "Image Classification",
    "Object Detection",
    "Language Model",
    "Style Transfer",
    "Reinforcement Learning",
    "Neural Architecture Search",
  ];
  const gpuRequestOptions = [0.25, 0.5, 1, 2, 4, 8];
  const cpuRequestOptions = [1, 2, 4, 8, 16, 32];
  const memoryRequestOptions = [4, 8, 16, 32, 64, 128];

  // Generate RUNNING jobs from actual node usage
  nodes.forEach(node => {
    node.gpus.forEach(gpu => {
      gpu.segments.forEach(segment => {
        const now = new Date();
        const submittedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        runningJobs.push({
          id: `running-${node.id}-${gpu.id}-${segment.user}`,
          name: jobNames[Math.floor(Math.random() * jobNames.length)],
          user: segment.user,
          team: segment.team,
          priority: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "normal" : "low",
          gpuType: node.gpuType,
          gpuRequest: segment.usage / 100,
          cpuRequest: cpuRequestOptions[Math.floor(Math.random() * cpuRequestOptions.length)],
          memoryRequest: memoryRequestOptions[Math.floor(Math.random() * memoryRequestOptions.length)],
          submittedAt,
          status: "running",
        });
      });
    });
  });

  // Generate PENDING jobs randomly
  gpuTypes.forEach((gpuType) => {
    const pendingCount = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < pendingCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const team = teams[Math.floor(Math.random() * teams.length)];
      const now = new Date();
      const submittedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      pendingJobs.push({
        id: `${gpuType}-pending-${i + 1}`,
        name: jobNames[Math.floor(Math.random() * jobNames.length)],
        user,
        team,
        priority: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "normal" : "low",
        gpuType,
        gpuRequest: gpuRequestOptions[Math.floor(Math.random() * gpuRequestOptions.length)],
        cpuRequest: cpuRequestOptions[Math.floor(Math.random() * cpuRequestOptions.length)],
        memoryRequest: memoryRequestOptions[Math.floor(Math.random() * memoryRequestOptions.length)],
        submittedAt,
        status: "pending",
      });
    }
  });

  const allJobs = [...runningJobs, ...pendingJobs];

  return allJobs.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    if (a.status !== b.status) {
        return a.status === 'running' ? -1 : 1;
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};