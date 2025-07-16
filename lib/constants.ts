import type { GPUType } from './types';

// GPU 타입별 노드 개수 설정
export const GPU_NODE_COUNTS: Record<GPUType, number> = {
  H200: 4,
  A30: 8,
  H100: 28,
  A100: 24,
  전체 : 71
};

// 샘플 사용자/팀 데이터
export const users = ["김철수", "이영희", "박민수", "정수진", "최영호", "한미영", "임동현", "송지은", "조현우", "윤서연"];
export const teams = ["AI연구팀", "데이터팀", "비전팀", "NLP팀", "로보틱스팀", "추천팀", "검색팀", "음성팀"];
