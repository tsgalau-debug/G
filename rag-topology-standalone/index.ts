// =============================================================================
// STANDALONE EMBEDDING-FREE RAG & SIMPLICIAL TOPOLOGY RESEARCH PACKAGE
// Zero framework dependencies, zero external embedding API dependencies.
// =============================================================================

export * from './rag/base-indexer';
export * from './rag/chunk-store';
export * from './rag/continuous-hrr';
export * from './rag/epistemic-retrieval-kernel';
export * from './rag/holographic-memory';
export * from './rag/hybrid-pipeline';
export * from './rag/multi-world';
export * from './rag/pipeline-bridge';
export * from './rag/timeline-dag';
export {
  Matrix,
  TopKSelector,
  ExactSimilarityKernel,
  RandomProjectionLSH,
  HybridVectorRetriever,
} from './rag/vector-retriever';
export * from './rag/vsarl-policy-kernel';
export * from './rag/wasm-math-v9-scorer';
export * from './rag/worker-tokenizer-embedder';
export * from './rag/worker-whatif-simulator';
export * from './rag/world-merge-resolver';
export * from './rag/agentic-chunk-orchestrator';
export * from './rag/rag-engine';

export * from './topology/csr-matrix';
export * from './topology/topological-simulation';
export * from './topology/simplicial-complex';
export * from './topology/topological-sync';
