import type { Node, SearchResult, UserGPUUsage } from './types';

// 복합 검색 함수 - 세그먼트 매칭 정보 포함
export const performComplexSearch = (nodes: Node[], searchTerm: string): SearchResult[] => {
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
export const findGpusByUserOrTeam = (nodes: Node[], searchTerm: string): UserGPUUsage[] => {
  if (!searchTerm.trim()) return [];
  
  // 검색어를 공백, 슬래시, 콤마 등으로 분리
  const searchTerms = searchTerm.toLowerCase().split(/[\s\/,]+/).filter(term => term.trim());
  const results: UserGPUUsage[] = [];
  
  nodes.forEach((node) => {
    node.gpus.forEach((gpu, gpuIndex) => {
      if (gpu.status === 'active') {
        gpu.segments.forEach((segment) => {
          // 모든 검색어가 사용자명, 팀명, GPU 타입, 노드명, 노드ID에 포함되는지 확인
          const userLower = segment.user.toLowerCase();
          const teamLower = segment.team.toLowerCase();
          const gpuTypeLower = node.gpuType.toLowerCase();
          const nodeNameLower = node.name.toLowerCase();
          const nodeIdLower = node.id.toLowerCase();
          
          const allTermsMatch = searchTerms.every(term => 
            userLower.includes(term) || 
            teamLower.includes(term) || 
            gpuTypeLower.includes(term) ||
            nodeNameLower.includes(term) ||
            nodeIdLower.includes(term)
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