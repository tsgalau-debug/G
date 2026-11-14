export type NodeId = string;
export type Category = string;
export type EdgeKey = string;

export interface KGNode {
  id: NodeId;
  category: Category;
  properties: Record<string, unknown>;
  signature: string;
}

export interface KGEdge {
  source: NodeId;
  target: NodeId;
  relation: string;
  weight: number;
  restriction: Record<string, unknown>;
}

export interface GraphSnapshot {
  nodes: Map<NodeId, KGNode>;
  edges: Map<EdgeKey, KGEdge>;
  adjacency: Map<NodeId, Set<NodeId>>;
}

export function edgeKey(a: NodeId, b: NodeId): EdgeKey {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}
