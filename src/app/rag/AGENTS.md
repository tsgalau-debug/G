# Purpose
Domain-specific boundary for the Agentic Retrieval-Augmented Generation (RAG) system, Lore retrieval, VSARL policy kernels, and Holographic memory modules. It drives intelligent decision strategies and semantic associations in games or interactive simulations.

# Ownership
Core RAG Orchestrator Engine

# Local Contracts
- **Tensor-Driven Execution Rules (Vector Space Symbolic Alignment)**:
  - Utilize continuous wave / vector representations via high-performance Float32Arrays.
  - Implement Hebbian Association and superposition of vectors (Outer Product Association).
  - Strongly prefer Structure of Arrays (SoA) layout instead of Array of Structures (AoS) for performance-sensitive pathways (such as the Replay Buffer: `replayStates`, `replayActions`, `replayRewards`, etc.).
  - Avoid discrete spawn/destruction of physical structural nodes; manipulate continuous weights and field-based resonance instead.
  - Dot product operations must use hand-unrolled loops for optimal performance.
- **Safety Boundaries**:
  - Always guard vector norm calculations against zero or near-zero divisions with safety buffers (e.g. `1e-10`).
  - Keep arrays bound-checked and handle empty state arrays gracefully.

# Work Guidance
- **`vsarl-policy-kernel.ts`**: Handles Float32Array-based state vector packing/unpacking and Hebbian reinforcement learning. Do not introduce backpropagation or neural-network overhead.
- **`lore-engine.service.ts`**: Bridged with a fast Web Worker thread to index game lore and context snippets. Always verify dynamic context changes before flushing caches.
- **`agentic-chunk-orchestrator.ts`**: Coordinates dynamic query strategies (e.g., return, requery, escalate-llm, kernel-answer).

# Verification
- Run the localized RAG test suite to ensure regressions are not introduced:
  ```bash
  npx vitest run src/tests/rag/
  ```
