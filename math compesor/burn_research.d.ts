/* tslint:disable */
/* eslint-disable */

export class AgentGraphBuilder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(spec: AgentLayerSpec, left_slot: number, right_slot: number, output_slot: number): void;
    addUnary(spec: AgentLayerSpec, input_slot: number, output_slot: number): void;
    /**
     * Compile using a temporary output selection without mutating the builder's configured output.
     * This is the canonical path for stateless workspace orchestration.
     */
    compileWithOutput(registry: LayerRegistry, output_slot: number): CompiledGraph;
    compile(registry: LayerRegistry): CompiledGraph;
    multiInputPlanV1(): MultiInputGraphPlan;
    constructor(num_slots: number);
    numSlots(): number;
    numSteps(): number;
    setOutput(output_slot: number): void;
}

export class AgentLayerSpec {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static adaptiveAvgPool2d(layer_id: number, output_h: number, output_w: number): AgentLayerSpec;
    static add(layer_id: number): AgentLayerSpec;
    static avgPool1d(layer_id: number, kernel: number, stride?: number | null, padding?: number | null): AgentLayerSpec;
    static avgPool2d(layer_id: number, kernel_h: number, kernel_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): AgentLayerSpec;
    static batchNorm(layer_id: number, num_features: number, epsilon?: number | null): AgentLayerSpec;
    static concat(layer_id: number, dim: number): AgentLayerSpec;
    static conv1d(layer_id: number, in_channels: number, out_channels: number, kernel_size: number, stride?: number | null, padding?: number | null): AgentLayerSpec;
    static conv2d(layer_id: number, in_channels: number, out_channels: number, kernel_h: number, kernel_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): AgentLayerSpec;
    static convTranspose2d(layer_id: number, in_channels: number, out_channels: number, kernel_h: number, kernel_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): AgentLayerSpec;
    static embedding(layer_id: number, vocab_size: number, d_model: number): AgentLayerSpec;
    static featureNorm(layer_id: number, epsilon?: number | null): AgentLayerSpec;
    static gelu(layer_id: number): AgentLayerSpec;
    static ghost(layer_id: number, in_channels: number, out_channels: number, kernel_h: number, kernel_w: number, ratio: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): AgentLayerSpec;
    static glu(layer_id: number, dim: number): AgentLayerSpec;
    static groupNorm(layer_id: number, num_groups: number, num_channels: number, epsilon?: number | null): AgentLayerSpec;
    static hardSigmoid(layer_id: number, alpha: number, beta: number): AgentLayerSpec;
    static hardSwish(layer_id: number): AgentLayerSpec;
    static instanceNorm(layer_id: number, num_channels: number, epsilon?: number | null): AgentLayerSpec;
    static intAdd(layer_id: number): AgentLayerSpec;
    static intFromFloat(layer_id: number): AgentLayerSpec;
    static intMatmul(layer_id: number): AgentLayerSpec;
    static intMul(layer_id: number): AgentLayerSpec;
    static intSub(layer_id: number): AgentLayerSpec;
    static intToFloat(layer_id: number): AgentLayerSpec;
    layerId(): number;
    static layerNorm(layer_id: number, size: number, epsilon?: number | null): AgentLayerSpec;
    layerType(): number;
    static leakyRelu(layer_id: number, negative_slope: number): AgentLayerSpec;
    static linear(layer_id: number, in_dim: number, out_dim: number, bias: boolean): AgentLayerSpec;
    static logSoftmax(layer_id: number, dim: number): AgentLayerSpec;
    static matmul(layer_id: number): AgentLayerSpec;
    static maxPool1d(layer_id: number, kernel: number, stride?: number | null, padding?: number | null): AgentLayerSpec;
    static maxPool2d(layer_id: number, kernel_h: number, kernel_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): AgentLayerSpec;
    static mish(layer_id: number): AgentLayerSpec;
    static mul(layer_id: number): AgentLayerSpec;
    static prelu(layer_id: number, num_parameters: number, alpha: number): AgentLayerSpec;
    static relu(layer_id: number): AgentLayerSpec;
    static rmsNorm(layer_id: number, size: number, epsilon?: number | null): AgentLayerSpec;
    static seBlock(layer_id: number, channels: number, reduction: number): AgentLayerSpec;
    static shiftDown(layer_id: number, shift_size: number): AgentLayerSpec;
    static shiftLeft(layer_id: number, shift_size: number): AgentLayerSpec;
    static shiftRight(layer_id: number, shift_size: number): AgentLayerSpec;
    static shiftUp(layer_id: number, shift_size: number): AgentLayerSpec;
    static sigmoid(layer_id: number): AgentLayerSpec;
    static softmax(layer_id: number, dim: number): AgentLayerSpec;
    static softplus(layer_id: number, beta: number): AgentLayerSpec;
    static sub(layer_id: number): AgentLayerSpec;
    static swiGlu(layer_id: number, d_input: number, d_output: number, bias: boolean): AgentLayerSpec;
    static tanh(layer_id: number): AgentLayerSpec;
    static transpose(layer_id: number, dim0: number, dim1: number): AgentLayerSpec;
    variant(): number;
}

export class AgentWorkspace {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Forget only workspace metadata. This never mutates LayerRegistry.
     */
    forgetLayer(layer_id: number): boolean;
    get(table: string, key: string): string;
    /**
     * Return the explicit metadata quotas for agent planning.
     */
    limits(): string;
    constructor(num_slots: number);
    /**
     * Generic user-space row upsert. Tables prefixed with `_` are reserved for workspace internals.
     */
    put(table: string, key: string, kind: string, state: string, value: string): void;
    /**
     * Query any table, including read-only inspection of internal tables.
     */
    query(table: string, kind?: string | null, state?: string | null): string;
    recordEvent(kind: string, reference: string, detail: string): number;
    recordProof(label: string, passed: boolean, max_error: number, detail: string): number;
    releaseSlot(slot: number): void;
    remove(table: string, key: string): boolean;
    reserveLayerId(registry: LayerRegistry, label: string): number;
    reserveSlot(owner: string): number;
    snapshot(): string;
    /**
     * Reconcile a typed layer with the actual registry after caller initializes it manually.
     */
    syncLayer(registry: LayerRegistry, spec: AgentLayerSpec, label: string): void;
    tableNames(): string;
}

export class CheckpointBranchSet {
    free(): void;
    [Symbol.dispose](): void;
    baselineBundle(): Uint8Array;
    baselineStateDigest(): string;
    branchCount(): number;
    candidateBundle(branch_id: string): Uint8Array;
    commitBranchByReceipt(branch_id: string, live_registry: LayerRegistry, live_graph: CompiledMultiInputGraph, expected_program_identity: string, expected_state_digest: string, receipt_digest: string, authorize: boolean): CompiledMultiInputGraph;
    fork(branch_id: string): number;
    insertStep(branch_id: string, index: number, spec: AgentLayerSpec, first: number, second: number, output: number): void;
    constructor(registry: LayerRegistry, graph: CompiledMultiInputGraph, expected_program_identity: string, expected_state_digest: string);
    promotedBranch(): string | undefined;
    reconnectStep(branch_id: string, index: number, first: number, second: number, output: number): void;
    removeStep(branch_id: string, index: number): void;
    replaceStep(branch_id: string, index: number, spec: AgentLayerSpec, first: number, second: number, output: number): void;
    setOutput(branch_id: string, output: number): void;
    setWeightsFlat(branch_id: string, layer_type: number, layer_id: number, values: Float32Array): void;
    stageBranch(branch_id: string): string;
    stateDiff(branch_id: string): string;
    verifyBranch(branch_id: string, cases: MultiInputVerificationCases, abs_tol: number, rel_tol: number): string;
}

export class CompiledGraph {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run(registry: LayerRegistry, input: WasmTensor): WasmTensor;
    validateRegistryBinding(registry: LayerRegistry): void;
    verifyFlat(registry: LayerRegistry, input: WasmTensor, candidate: Float32Array, abs_tol: number, rel_tol: number): string;
}

export class CompiledMultiInputGraph {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    explainPlan(registry: LayerRegistry): string;
    inputPlanV1(): Uint8Array;
    preflight(registry: LayerRegistry, bundle: MultiInputInputBundle): string;
    programIdentity(): string;
    programPlan(): Uint8Array;
    requiredInputSlots(): Uint8Array;
    runWithTrace(registry: LayerRegistry, bundle: MultiInputInputBundle, start_step: number, max_steps: number, max_tensor_bytes: number): TracedMultiInputRun;
    run(registry: LayerRegistry, bundle: MultiInputInputBundle): WasmTensor;
    validateRegistryBinding(registry: LayerRegistry): void;
    verifyFlat(registry: LayerRegistry, bundle: MultiInputInputBundle, candidate: Float32Array, abs_tol: number, rel_tol: number): string;
}

export class EsOptimizer {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Minta kandidat generasi ini. Mengembalikan Float32Array flat (n_kandidat * dim).
     * JS slice per `dim()`. Panggil `tell()` sesudahnya dengan fitness seurut kandidat.
     * Memanggil ask lagi sebelum tell diperbolehkan: batch sebelumnya dianggap dibatalkan.
     */
    ask(): Float32Array;
    batchSize(): number;
    /**
     * Vektor terbaik sepanjang pelatihan (Float32Array).
     */
    best(): Float32Array;
    dim(): number;
    generation(): number;
    /**
     * Rata-rata populasi saat ini (Float32Array).
     */
    mean(): Float32Array;
    /**
     * Legacy forgiving constructor retained for compatibility.
     *
     * It clamps dim/pop and falls back unknown strategies to OpenES. Agent/proof workflows
     * should prefer `EsOptimizer.strict(...)`, whose invalid configurations are controlled errors.
     */
    constructor(dim: number, strategy: number, seed: number, pop?: number | null, sigma?: number | null, lr?: number | null);
    /**
     * Laporan JSON generasi terakhir.
     */
    report(): string;
    /**
     * Proof-of-life mandiri untuk problem linear tetap `in=3, out=2`.
     *
     * Contract: optimizer harus dibuat dengan `dim == 6` dan `gens > 0`.
     * Pelanggaran contract atau kegagalan internal `tell()` dikembalikan sebagai error
     * (menjadi exception terkontrol pada boundary JavaScript/WASM), bukan report kosong/stale.
     */
    runLinearDemo(gens: number): string;
    /**
     * Change OpenES learning rate without resetting search state.
     *
     * Mutation is valid only between completed generations. If an ask() batch
     * is still awaiting fitness, reject without consuming or replacing it.
     */
    setLearningRate(lr: number): void;
    /**
     * Strict proof-boundary factory. Unlike the legacy constructor, this never silently
     * repairs dimensions/population, never falls back an unknown strategy, and rejects
     * non-finite/non-positive numerical hyperparameters before optimizer state is created.
     */
    static strict(dim: number, strategy: number, seed: number, pop?: number | null, sigma?: number | null, lr?: number | null): EsOptimizer;
    /**
     * Serahkan fitness (seurut kandidat ask). Mengembalikan laporan JSON generasi ini.
     * Boundary contract: tell hanya sah setelah ask, cardinality harus tepat, dan semua fitness finite.
     */
    tell(fitnesses: Float32Array): string;
    /**
     * Strict factory dengan pilihan PRNG eksplisit (#14).
     *
     * `rng_kind`: 0 = mulberry32 (default lama), 1 = pcg32, 2 = philox4x32.
     * Tidak seperti `new`, factory ini TIDAK pernah memperbaiki diam-diam:
     * `rng_kind` tak dikenal, strategi tak dikenal, dan hiperparameter
     * invalid semuanya menjadi `Err` yang menyebut pelakunya.
     */
    static withRng(dim: number, strategy: number, seed: number, rng_kind: number, pop?: number | null, sigma?: number | null, lr?: number | null): EsOptimizer;
}

export class GraphMutationTransaction {
    free(): void;
    [Symbol.dispose](): void;
    baselineBundle(): Uint8Array;
    baselineStateDigest(): string;
    candidateBundle(): Uint8Array;
    commitByReceipt(live_registry: LayerRegistry, live_graph: CompiledMultiInputGraph, expected_program_identity: string, expected_state_digest: string, receipt_digest: string, authorize: boolean): CompiledMultiInputGraph;
    insertStep(index: number, spec: AgentLayerSpec, first: number, second: number, output: number): void;
    constructor(registry: LayerRegistry, graph: CompiledMultiInputGraph, expected_program_identity: string, expected_state_digest: string);
    reconnectStep(index: number, first: number, second: number, output: number): void;
    removeStep(index: number): void;
    replaceStep(index: number, spec: AgentLayerSpec, first: number, second: number, output: number): void;
    setOutput(output: number): void;
    setWeightsFlat(layer_type: number, layer_id: number, values: Float32Array): void;
    stageCandidate(): string;
    verifyCases(cases: MultiInputVerificationCases, abs_tol: number, rel_tol: number): string;
}

export class InputPortConsumerSpec {
    free(): void;
    [Symbol.dispose](): void;
    acceptedRoles(): string;
    allowExtensionRoles(): boolean;
    consumerId(): string;
    describe(): string;
    minimumRevision(): bigint;
    constructor(consumer_id: string, accepted_roles_json: string, allow_extension_roles: boolean, require_fingerprint: boolean, minimum_revision: bigint);
    requireFingerprint(): boolean;
}

export class LayerRegistry {
    free(): void;
    [Symbol.dispose](): void;
    compileGraph(plan: Uint8Array): CompiledGraph;
    compileMultiInputGraph(plan: MultiInputGraphPlan): CompiledMultiInputGraph;
    destroyLayer(layer_id: number, layer_type: number): boolean;
    forwardBinaryLayer(layer_id: number, a: WasmTensor, b: WasmTensor): WasmTensor;
    /**
     * Boundary #5: forward for integer binary layers (i64 exact).
     */
    forwardIntBinary(layer_id: number, a: WasmIntTensor, b: WasmIntTensor): WasmIntTensor;
    /**
     * Boundary #5: float -> int cast (f32 -> i64, truncating toward zero).
     */
    forwardIntCastFromFloat(layer_id: number, input: WasmTensor): WasmIntTensor;
    /**
     * Boundary #5: int -> float cast (i64 -> f32; exact only for |x| <= 2^24).
     */
    forwardIntCastToFloat(layer_id: number, input: WasmIntTensor): WasmTensor;
    forwardLayer(layer_id: number, layer_type: number, input: WasmTensor): WasmTensor;
    getLayerState(layer_id: number, layer_type: number): Uint8Array;
    getWeightsFlat(layer_id: number, layer_type: number): Float32Array;
    initAgentLayer(spec: AgentLayerSpec): void;
    initLayer(header: PacketHeader, payload: Uint8Array): void;
    inventorySnapshot(): string;
    layerExists(layer_type: number, layer_id: number): boolean;
    /**
     * Return the canonical init identity for a live layer.
     * The identity is derived from the validated payload prefix plus variant/flags,
     * so ignored outer trailing bytes never affect provenance.
     */
    layerInitFingerprint(layer_type: number, layer_id: number): string;
    loadLayerState(layer_id: number, layer_type: number, data: Uint8Array): void;
    constructor();
    operationBindingSnapshot(): string;
    runGraph(plan: Uint8Array, input: WasmTensor): WasmTensor;
    setWeightsFlat(layer_id: number, layer_type: number, data: Float32Array): void;
    totalParams(): number;
    weightLayout(layer_id: number, layer_type: number): string;
}

export class MultiInputGraphPlan {
    free(): void;
    [Symbol.dispose](): void;
    addInputPort(slot: number, role: string, dim0: number, dim1: number, dim2: number, dim3: number, layout: string, require_fingerprint: boolean, minimum_revision: bigint): boolean;
    static fromBytes(bytes: Uint8Array): MultiInputGraphPlan;
    inputSlots(): Uint8Array;
    constructor(builder: AgentGraphBuilder);
    planFingerprint(): string;
    portCount(): number;
    programPlan(): Uint8Array;
    toBytes(): Uint8Array;
    toJSON(): string;
}

export class MultiInputInputBundle {
    free(): void;
    [Symbol.dispose](): void;
    bindInput(slot: number, tensor: WasmTensor, role: string, layout: string, source: string, revision: bigint, fingerprint: string): boolean;
    boundPortCount(): number;
    clearInput(slot: number): boolean;
    constructor(plan: MultiInputGraphPlan);
    planFingerprint(): string;
}

export class MultiInputVerificationCases {
    free(): void;
    [Symbol.dispose](): void;
    addCase(baseline: MultiInputInputBundle, candidate: MultiInputInputBundle): number;
    caseCount(): number;
    constructor(baseline: CompiledMultiInputGraph, candidate: CompiledMultiInputGraph);
    verify(baseline_registry: LayerRegistry, baseline: CompiledMultiInputGraph, candidate_registry: LayerRegistry, candidate: CompiledMultiInputGraph, abs_tol: number, rel_tol: number): string;
}

export class PacketHeader {
    free(): void;
    [Symbol.dispose](): void;
    constructor(bytes: Uint8Array);
    has_bias(): boolean;
    is_training(): boolean;
    to_bytes(): Uint8Array;
    flags: number;
    layer_type: number;
    opcode: number;
    payload_len: number;
    variant: number;
}

export class SemanticIngressManifest {
    free(): void;
    [Symbol.dispose](): void;
    addDeferredPort(logical_port_id: string, role: string, source: string, revision: bigint, fingerprint: string, required: boolean): boolean;
    addRuntimeBackedPort(logical_port_id: string, role: string, source: string, revision: bigint, fingerprint: string, runtime_slot: number, required: boolean): boolean;
    manifestFingerprint(): string;
    constructor();
    portCount(): number;
    toJSON(): string;
}

export class SemanticIngressManifestV2 {
    free(): void;
    [Symbol.dispose](): void;
    addDeferredPort(logical_port_id: string, role: string, required: boolean): boolean;
    addRuntimePort(logical_port_id: string, slot: number, expected_source: string): boolean;
    consumerCompatibility(slot: number, bundle: MultiInputInputBundle, consumer: InputPortConsumerSpec): string;
    inputPortStatus(slot: number, bundle: MultiInputInputBundle): string;
    manifestFingerprint(): string;
    constructor(plan: MultiInputGraphPlan);
    runWithTrace(registry: LayerRegistry, graph: CompiledMultiInputGraph, bundle: MultiInputInputBundle, start_step: number, max_steps: number, max_tensor_bytes: number): TracedMultiInputRun;
    run(registry: LayerRegistry, graph: CompiledMultiInputGraph, bundle: MultiInputInputBundle): WasmTensor;
    status(registry: LayerRegistry, graph: CompiledMultiInputGraph, bundle: MultiInputInputBundle): string;
    toJSON(): string;
    verifyFlat(registry: LayerRegistry, graph: CompiledMultiInputGraph, bundle: MultiInputInputBundle, candidate: Float32Array, abs_tol: number, rel_tol: number): string;
}

export class SemanticTransitionSpec {
    free(): void;
    [Symbol.dispose](): void;
    describe(): string;
    inputRoles(): string;
    constructor(transition_id: string, input_roles_json: string, output_role: string);
    outputRole(): string;
    transitionId(): string;
}

export class TensorView {
    free(): void;
    [Symbol.dispose](): void;
    len(): number;
    constructor(total_elements: number);
    /**
     * Copy data dari SAB ke slice Rust (Rust baca data JS)
     */
    read(dst: Float32Array): void;
    setShape(shape: Uint32Array): void;
    shape(): Uint32Array;
    /**
     * Copy data dari slice Rust ke SAB (Rust tulis data untuk JS)
     */
    write(src: Float32Array): void;
}

export class TracedMultiInputRun {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * A failed numerical step has no output and never issues an execution receipt.
     */
    output(): WasmTensor;
    report(): string;
}

export class WasmActivation {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    get_state(): Uint8Array;
    load_state(data: Uint8Array): void;
    static newGelu(): WasmActivation;
    static newGlu(dim: number): WasmActivation;
    static newHardSigmoid(alpha?: number | null, beta?: number | null): WasmActivation;
    static newHardSwish(): WasmActivation;
    static newLeakyRelu(negative_slope?: number | null): WasmActivation;
    static newLogSoftmax(dim: number): WasmActivation;
    static newMish(): WasmActivation;
    static newPRelu(num_parameters?: number | null, alpha?: number | null): WasmActivation;
    static newRelu(): WasmActivation;
    static newSigmoid(): WasmActivation;
    static newSoftmax(dim: number): WasmActivation;
    static newSoftplus(beta?: number | null): WasmActivation;
    static newSwiGlu(d_input: number, d_output: number, bias?: boolean | null): WasmActivation;
    static newTanh(): WasmActivation;
    num_params(): number;
}

export class WasmBinary {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Dua input. Shape-mismatch -> thrown string (bukan trap).
     */
    forwardBinary(a: WasmTensor, b: WasmTensor): WasmTensor;
    static newAdd(): WasmBinary;
    static newConcat(dim: number): WasmBinary;
    static newMatmul(): WasmBinary;
    static newMul(): WasmBinary;
    static newSub(): WasmBinary;
    num_params(): number;
}

export class WasmComparison {
    free(): void;
    [Symbol.dispose](): void;
    lessEqual01(lhs: WasmTensor, rhs: WasmTensor): WasmTensor;
    constructor();
}

export class WasmConv {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     */
    getWeightsFlat(): Float32Array;
    get_state(): Uint8Array;
    load_state(data: Uint8Array): void;
    static newConv1d(in_channels: number, out_channels: number, kernel_size: number, stride?: number | null, padding?: number | null): WasmConv;
    static newConv2d(in_channels: number, out_channels: number, kernel_size_h: number, kernel_size_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): WasmConv;
    static newConvTranspose2d(in_channels: number, out_channels: number, kernel_size_h: number, kernel_size_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): WasmConv;
    num_params(): number;
    setWeightsFlat(data: Float32Array): void;
}

export class WasmEmbedding {
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     */
    getWeightsFlat(): Float32Array;
    get_state(): Uint8Array;
    load_state(data: Uint8Array): void;
    constructor(vocab_size: number, d_model: number);
    num_params(): number;
    setWeightsFlat(data: Float32Array): void;
    weightDims(): Uint32Array;
}

export class WasmFeatureNorm {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    static newFeatureNorm(epsilon?: number | null): WasmFeatureNorm;
    num_params(): number;
}

export class WasmGhostModule {
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    get_state(): Uint8Array;
    load_state(data: Uint8Array): void;
    num_params(): number;
    /**
     * Fallible constructor (complaint #14): invalid configs are a per-call
     * `Err`, never a panic/`throw_str`, so corrupt bundle bytes cannot wedge
     * the in-process WASM runtime.
     */
    constructor(in_channels: number, out_channels: number, kernel_size_h: number, kernel_size_w: number, ratio?: number | null, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null);
}

export class WasmIndexSource {
    free(): void;
    [Symbol.dispose](): void;
    indicesLike(reference: WasmTensor, axis: number): WasmTensor;
    constructor();
}

export class WasmIntTensor {
    free(): void;
    [Symbol.dispose](): void;
    byte_length(): number;
    /**
     * Ergonomic constructor from plain JS numbers (Float64Array).
     *
     * Every element must be a *safe integer*: finite, integral, and
     * |v| <= 2^53 - 1 (the exact-integer range of f64). Anything else
     * is a clean `Err` naming the offending index — never a silent
     * rounding. For magnitudes beyond 2^53, use `new(BigInt64Array)`
     * instead, which carries the full i64 range exactly.
     */
    static fromNumbers(data: Float64Array, shape: Uint32Array): WasmIntTensor;
    constructor(data: BigInt64Array, shape: Uint32Array);
    shape(): Uint32Array;
    to_array(): BigInt64Array;
}

export class WasmLinear {
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     */
    getWeightsFlat(): Float32Array;
    get_state(): Uint8Array;
    load_state(data: Uint8Array): void;
    constructor(in_dim: number, out_dim: number, bias: boolean);
    num_params(): number;
    setWeightsFlat(data: Float32Array): void;
    /**
     * [in_dim, out_dim] — supaya JS tahu cara memotong vektor flat.
     */
    weightDims(): Uint32Array;
}

/**
 * Stateless Burn-backed linear algebra surface for the canonical rank-4 bridge.
 *
 * Vector operations use `[B,F,1,1]`. Matrix multiplication follows Burn's rank-4
 * batched semantics `[B,G,M,K] @ [B,G,K,N] -> [B,G,M,N]`.
 */
export class WasmLinearAlgebra {
    free(): void;
    [Symbol.dispose](): void;
    cosineSimilarity(a: WasmTensor, b: WasmTensor, epsilon?: number | null): WasmTensor;
    dot(a: WasmTensor, b: WasmTensor): WasmTensor;
    l2Distance(a: WasmTensor, b: WasmTensor): WasmTensor;
    l2Norm(input: WasmTensor): WasmTensor;
    matmul(a: WasmTensor, b: WasmTensor): WasmTensor;
    constructor();
}

export class WasmMathProgram {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromPlan(plan: Uint8Array): WasmMathProgram;
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run1(input: WasmTensor): WasmTensor;
    run2(a: WasmTensor, b: WasmTensor): WasmTensor;
}

export class WasmMathProgramBuilder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(op: number, lhs: number, rhs: number, output: number): void;
    addClamp(input: number, output: number, min: number, max: number): void;
    addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
    addPermute(input: number, output: number, axes: Uint32Array): void;
    addReshape(input: number, output: number, shape: Uint32Array): void;
    addSlice(input: number, output: number, starts: Uint32Array, ends: Uint32Array): void;
    addUnary(op: number, input: number, output: number): void;
    compile(): WasmMathProgram;
    constructor(num_inputs: number, num_slots: number);
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    setOutput(slot: number): void;
}

export class WasmMathProgramV4 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromPlan(plan: Uint8Array): WasmMathProgramV4;
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run1(input: WasmTensor): WasmTensor;
    run2(a: WasmTensor, b: WasmTensor): WasmTensor;
}

export class WasmMathProgramV4Builder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(op: number, lhs: number, rhs: number, output: number): void;
    addClamp(input: number, output: number, min: number, max: number): void;
    addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
    addPermute(input: number, output: number, axes: Uint32Array): void;
    addReshape(input: number, output: number, shape: Uint32Array): void;
    addSelectAxis(input: number, output: number, axis: number, indices: Uint32Array): void;
    addSlice(input: number, output: number, starts: Uint32Array, ends: Uint32Array): void;
    addUnary(op: number, input: number, output: number): void;
    compile(): WasmMathProgramV4;
    constructor(num_inputs: number, num_slots: number);
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    setOutput(slot: number): void;
}

export class WasmMathProgramV5 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromPlan(plan: Uint8Array): WasmMathProgramV5;
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run3(a: WasmTensor, b: WasmTensor, c: WasmTensor): WasmTensor;
    run4(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor): WasmTensor;
    run5(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor): WasmTensor;
    run6(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor): WasmTensor;
    run7(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor): WasmTensor;
    run8(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor, h: WasmTensor): WasmTensor;
}

export class WasmMathProgramV5Builder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(op: number, lhs: number, rhs: number, output: number): void;
    addClamp(input: number, output: number, min: number, max: number): void;
    addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
    addPermute(input: number, output: number, axes: Uint32Array): void;
    addReshape(input: number, output: number, shape: Uint32Array): void;
    addSelectAxis(input: number, output: number, axis: number, indices: Uint32Array): void;
    addSlice(input: number, output: number, starts: Uint32Array, ends: Uint32Array): void;
    addUnary(op: number, input: number, output: number): void;
    compile(): WasmMathProgramV5;
    constructor(num_inputs: number, num_slots: number);
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    setOutput(slot: number): void;
}

export class WasmMathProgramV6 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromPlan(plan: Uint8Array): WasmMathProgramV6;
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run1(a: WasmTensor): WasmTensor;
    run2(a: WasmTensor, b: WasmTensor): WasmTensor;
    run3(a: WasmTensor, b: WasmTensor, c: WasmTensor): WasmTensor;
    run4(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor): WasmTensor;
    run5(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor): WasmTensor;
    run6(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor): WasmTensor;
    run7(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor): WasmTensor;
    run8(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor, h: WasmTensor): WasmTensor;
}

export class WasmMathProgramV6Builder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(op: number, lhs: number, rhs: number, output: number): void;
    addClamp(input: number, output: number, min: number, max: number): void;
    addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
    addFillLike(reference: number, output: number, scalar: number): void;
    addPermute(input: number, output: number, axes: Uint32Array): void;
    addReshape(input: number, output: number, shape: Uint32Array): void;
    addSelectAxis(input: number, output: number, axis: number, indices: Uint32Array): void;
    addSlice(input: number, output: number, starts: Uint32Array, ends: Uint32Array): void;
    addUnary(op: number, input: number, output: number): void;
    compile(): WasmMathProgramV6;
    constructor(num_inputs: number, num_slots: number);
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    setOutput(slot: number): void;
}

export class WasmMathProgramV7 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromPlan(plan: Uint8Array): WasmMathProgramV7;
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run1(a: WasmTensor): WasmTensor;
    run2(a: WasmTensor, b: WasmTensor): WasmTensor;
    run3(a: WasmTensor, b: WasmTensor, c: WasmTensor): WasmTensor;
    run4(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor): WasmTensor;
    run5(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor): WasmTensor;
    run6(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor): WasmTensor;
    run7(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor): WasmTensor;
    run8(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor, h: WasmTensor): WasmTensor;
}

export class WasmMathProgramV7Builder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(op: number, lhs: number, rhs: number, output: number): void;
    addClamp(input: number, output: number, min: number, max: number): void;
    addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
    addExpandLike(source: number, reference: number, output: number): void;
    addFillLike(reference: number, output: number, scalar: number): void;
    addPermute(input: number, output: number, axes: Uint32Array): void;
    addReshape(input: number, output: number, shape: Uint32Array): void;
    addSelectAxis(input: number, output: number, axis: number, indices: Uint32Array): void;
    addSlice(input: number, output: number, starts: Uint32Array, ends: Uint32Array): void;
    addUnary(op: number, input: number, output: number): void;
    compile(): WasmMathProgramV7;
    constructor(num_inputs: number, num_slots: number);
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    setOutput(slot: number): void;
}

export class WasmMathProgramV8 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromPlan(plan: Uint8Array): WasmMathProgramV8;
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run1(a: WasmTensor): WasmTensor;
    run2(a: WasmTensor, b: WasmTensor): WasmTensor;
    run3(a: WasmTensor, b: WasmTensor, c: WasmTensor): WasmTensor;
    run4(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor): WasmTensor;
    run5(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor): WasmTensor;
    run6(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor): WasmTensor;
    run7(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor): WasmTensor;
    run8(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor, h: WasmTensor): WasmTensor;
}

export class WasmMathProgramV8Builder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(op: number, lhs: number, rhs: number, output: number): void;
    addClamp(input: number, output: number, min: number, max: number): void;
    addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
    addExpandLike(source: number, reference: number, output: number): void;
    addFillLike(reference: number, output: number, scalar: number): void;
    addMaxAxis(input: number, output: number, axis: number): void;
    addMeanAxis(input: number, output: number, axis: number): void;
    addMinAxis(input: number, output: number, axis: number): void;
    addPermute(input: number, output: number, axes: Uint32Array): void;
    addReshape(input: number, output: number, shape: Uint32Array): void;
    addSelectAxis(input: number, output: number, axis: number, indices: Uint32Array): void;
    addSlice(input: number, output: number, starts: Uint32Array, ends: Uint32Array): void;
    addSumAxis(input: number, output: number, axis: number): void;
    addUnary(op: number, input: number, output: number): void;
    compile(): WasmMathProgramV8;
    constructor(num_inputs: number, num_slots: number);
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    setOutput(slot: number): void;
}

export class WasmMathProgramV9 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static fromPlan(plan: Uint8Array): WasmMathProgramV9;
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    outSlot(): number;
    programIdentity(): string;
    programPlan(): Uint8Array;
    run1(a: WasmTensor): WasmTensor;
    run2(a: WasmTensor, b: WasmTensor): WasmTensor;
    run3(a: WasmTensor, b: WasmTensor, c: WasmTensor): WasmTensor;
    run4(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor): WasmTensor;
    run5(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor): WasmTensor;
    run6(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor): WasmTensor;
    run7(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor): WasmTensor;
    run8(a: WasmTensor, b: WasmTensor, c: WasmTensor, d: WasmTensor, e: WasmTensor, f: WasmTensor, g: WasmTensor, h: WasmTensor): WasmTensor;
}

export class WasmMathProgramV9Builder {
    free(): void;
    [Symbol.dispose](): void;
    addBinary(op: number, lhs: number, rhs: number, output: number): void;
    addClamp(input: number, output: number, min: number, max: number): void;
    addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
    addExpandLike(source: number, reference: number, output: number): void;
    addFillLike(reference: number, output: number, scalar: number): void;
    addIndicesLike(reference: number, output: number, axis: number): void;
    addLessEqual01(lhs: number, rhs: number, output: number): void;
    addMaxAxis(input: number, output: number, axis: number): void;
    addMeanAxis(input: number, output: number, axis: number): void;
    addMinAxis(input: number, output: number, axis: number): void;
    addPermute(input: number, output: number, axes: Uint32Array): void;
    addReshape(input: number, output: number, shape: Uint32Array): void;
    addSelectAxis(input: number, output: number, axis: number, indices: Uint32Array): void;
    addSlice(input: number, output: number, starts: Uint32Array, ends: Uint32Array): void;
    addSumAxis(input: number, output: number, axis: number): void;
    addUnary(op: number, input: number, output: number): void;
    compile(): WasmMathProgramV9;
    constructor(num_inputs: number, num_slots: number);
    numInputs(): number;
    numSlots(): number;
    numSteps(): number;
    setOutput(slot: number): void;
}

export class WasmNorm {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     */
    getWeightsFlat(): Float32Array;
    get_state(): Uint8Array;
    load_state(data: Uint8Array): void;
    static new_batch_norm(num_features: number, epsilon?: number | null): WasmNorm;
    static new_group_norm(num_groups: number, num_channels: number, epsilon?: number | null): WasmNorm;
    static new_instance_norm(num_channels: number, epsilon?: number | null): WasmNorm;
    static new_layer_norm(size: number, epsilon?: number | null): WasmNorm;
    static new_rms_norm(size: number, epsilon?: number | null): WasmNorm;
    num_params(): number;
    setWeightsFlat(data: Float32Array): void;
}

/**
 * Stateless Burn-backed primitive math surface.
 *
 * Numeric Kernel v1 intentionally forbids implicit broadcasting and rejects invalid numerical
 * domains as controlled errors instead of silently producing NaN/Inf. It is a lower-level math
 * primitive, not a neural layer or graph policy.
 */
export class WasmNumericKernel {
    free(): void;
    [Symbol.dispose](): void;
    abs(input: WasmTensor): WasmTensor;
    add(a: WasmTensor, b: WasmTensor): WasmTensor;
    allFinite(input: WasmTensor): boolean;
    clamp(input: WasmTensor, min: number, max: number): WasmTensor;
    div(a: WasmTensor, b: WasmTensor): WasmTensor;
    exp(input: WasmTensor): WasmTensor;
    log(input: WasmTensor): WasmTensor;
    mul(a: WasmTensor, b: WasmTensor): WasmTensor;
    constructor();
    sqrt(input: WasmTensor): WasmTensor;
    sub(a: WasmTensor, b: WasmTensor): WasmTensor;
}

export class WasmPool {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    static newAdaptiveAvgPool2d(output_size_h: number, output_size_w: number): WasmPool;
    static newAvgPool1d(kernel_size: number, stride?: number | null, padding?: number | null): WasmPool;
    static newAvgPool2d(kernel_size_h: number, kernel_size_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): WasmPool;
    static newMaxPool1d(kernel_size: number, stride?: number | null, padding?: number | null): WasmPool;
    static newMaxPool2d(kernel_size_h: number, kernel_size_w: number, stride_h?: number | null, stride_w?: number | null, padding_h?: number | null, padding_w?: number | null): WasmPool;
    num_params(): number;
}

/**
 * Deterministic probability-distribution math over `[B,F,1,1]` tensors.
 *
 * Entropy, cross-entropy and KL require normalized distributions. Zero-probability
 * P entries contribute exactly zero. Q support must cover every positive P entry.
 */
export class WasmProbability {
    free(): void;
    [Symbol.dispose](): void;
    crossEntropy(p: WasmTensor, q: WasmTensor): WasmTensor;
    entropy(p: WasmTensor): WasmTensor;
    klDivergence(p: WasmTensor, q: WasmTensor): WasmTensor;
    constructor();
    normalize(input: WasmTensor): WasmTensor;
}

export class WasmReduction {
    free(): void;
    [Symbol.dispose](): void;
    maxAxis(input: WasmTensor, axis: number): WasmTensor;
    meanAxis(input: WasmTensor, axis: number): WasmTensor;
    minAxis(input: WasmTensor, axis: number): WasmTensor;
    constructor();
    sumAxis(input: WasmTensor, axis: number): WasmTensor;
}

export class WasmSeBlock {
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    get_state(): Uint8Array;
    load_state(data: Uint8Array): void;
    num_params(): number;
    /**
     * Fallible constructor (complaint #14): invalid configs are a per-call
     * `Err`, never a panic/`throw_str`, so corrupt bundle bytes cannot wedge
     * the in-process WASM runtime.
     */
    constructor(channels: number, reduction?: number | null);
}

export class WasmShift {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    forward(input: WasmTensor): WasmTensor;
    static newShiftDown(shift_size: number): WasmShift;
    static newShiftLeft(shift_size: number): WasmShift;
    static newShiftRight(shift_size: number): WasmShift;
    static newShiftUp(shift_size: number): WasmShift;
    num_params(): number;
}

/**
 * Stateless descriptive-statistics surface for canonical feature tensors `[B,F,1,1]`.
 *
 * All reducers operate across feature axis 1 and retain the canonical rank-4 bridge,
 * producing `[B,1,1,1]`. Variance and standard deviation use population semantics.
 */
export class WasmStatistics {
    free(): void;
    [Symbol.dispose](): void;
    max(input: WasmTensor): WasmTensor;
    mean(input: WasmTensor): WasmTensor;
    min(input: WasmTensor): WasmTensor;
    constructor();
    stdPopulation(input: WasmTensor): WasmTensor;
    sum(input: WasmTensor): WasmTensor;
    variancePopulation(input: WasmTensor): WasmTensor;
}

export class WasmTensor {
    free(): void;
    [Symbol.dispose](): void;
    byte_length(): number;
    static fromTensorView(view: TensorView): WasmTensor;
    constructor(data: Float32Array, shape: Uint32Array);
    shape(): Uint32Array;
    toTensorView(view: TensorView): void;
    to_array(): Float32Array;
}

/**
 * Stateless rank-4 tensor/layout transform surface.
 *
 * Every operation validates shape/axis/range/index metadata before calling Burn so malformed
 * requests fail as controlled errors rather than backend panics or unchecked indexing behavior.
 */
export class WasmTensorTransform {
    free(): void;
    [Symbol.dispose](): void;
    constructor();
    permute(input: WasmTensor, axes: Uint32Array): WasmTensor;
    reshape(input: WasmTensor, shape: Uint32Array): WasmTensor;
    selectAxis(input: WasmTensor, axis: number, indices: Uint32Array): WasmTensor;
    slice(input: WasmTensor, starts: Uint32Array, ends: Uint32Array): WasmTensor;
    transpose(input: WasmTensor): WasmTensor;
}

/**
 * Return a compact, machine-readable description of the stable WASM capabilities.
 *
 * Agents should call this once before planning numerical work instead of inferring
 * features from generated JS glue or repeatedly probing exports.
 */
export function agentCapabilities(): string;

/**
 * Return the canonical machine-readable contract manifest used by agents and future fuzzers.
 */
export function agentContractSchema(): string;

/**
 * Return the contract schema version without requiring JSON parsing during capability discovery.
 */
export function agentContractSchemaVersion(): number;

/**
 * Return the complete typed AgentLayerSpec constructor catalog.
 *
 * The catalog is embedded from a versioned JSON contract so agents can discover
 * all advertised constructor signatures without reading generated JS/TS glue.
 */
export function agentLayerCatalog(): string;

/**
 * Compare a producer's declared output layout with a consumer's declared input layout.
 * `unknown` is intentionally not an error: it means runtime Burn/shape validation is still needed.
 */
export function agentLayoutCompatibility(producer: AgentLayerSpec, consumer: AgentLayerSpec): string;

/**
 * Return the companion tensor-layout contract. Burn tensor/module semantics remain authoritative;
 * this schema only defines how the rank-4 agent adapter interprets axes between layers.
 */
export function agentLayoutContract(): string;

export function agentLayoutContractVersion(): number;

/**
 * Return the input/output layout profile for one typed layer spec.
 */
export function agentSpecLayout(spec: AgentLayerSpec): string;

export function bindInputPortConsumerEdge(workspace: AgentWorkspace, builder: AgentGraphBuilder, consumer: InputPortConsumerSpec, step_index: number): boolean;

export function bindSemanticLifecycleTransition(workspace: AgentWorkspace, builder: AgentGraphBuilder, spec: SemanticTransitionSpec, step_index: number): boolean;

export function checkpointBranchCapabilities(): string;

export function comparisonCapabilities(): string;

/**
 * Decide the bincode byte-limit tier for a state-record payload, without
 * decoding anything.
 *
 * This is the guard's decision function: the same tier the live decode path
 * enforces. Only the input *length* is inspected, so probing is always safe.
 *
 * Returns JSON:
 * `{"input_bytes":N,"tier_limit":M,"accepted":true,"reason":null}`
 * or `{"input_bytes":N,"tier_limit":null,"accepted":false,"reason":"..."}`.
 *
 * An agent designing around untrusted checkpoints uses this to ask, before
 * touching `load_state`: "would this payload shape be accepted, and under
 * which tier?" A corrupt varint *inside* the payload is then bounded by that
 * tier at decode time (`DecodeError::LimitExceeded` instead of a wedged
 * instance).
 *
 * Note: JSON is built by hand because `serde_json` is a non-wasm32-only
 * dependency in this crate; the `reason` string is fully controlled
 * (byte count + static text), so no escaping edge cases arise.
 */
export function decodeGuardCheck(data: Uint8Array): string;

/**
 * Describe the semantic graph topology currently held by AgentGraphBuilder.
 *
 * Workspace metadata is used only when available to recover constructor/variant
 * labels. Missing metadata is reported as unknown rather than inferred.
 * LayerRegistry is used only to report live execution binding/provenance.
 */
export function describeGraph(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry): string;

/**
 * Describe AgentWorkspace as semantic read-only state.
 *
 * LayerRegistry is supplied only to report whether initialized workspace metadata
 * is still bound to live execution state. Neither input is mutated.
 */
export function describeWorkspace(workspace: AgentWorkspace, registry: LayerRegistry): string;

/**
 * Machine-readable ES contracts for agent planning.
 */
export function esCapabilities(): string;

export function exportMultiInputProgramBundle(graph: CompiledMultiInputGraph, registry: LayerRegistry, include_state: boolean): Uint8Array;

export function exportProgramBundle(graph: CompiledGraph, registry: LayerRegistry, include_state: boolean): Uint8Array;

export function getGraphParametersFlat(graph: CompiledGraph, registry: LayerRegistry): Float32Array;

export function graphParameterCapabilities(): string;

export function graphParameterIdentity(graph: CompiledGraph, registry: LayerRegistry): string;

export function graphParameterLayout(graph: CompiledGraph, registry: LayerRegistry): string;

export function importMultiInputProgramBundle(registry: LayerRegistry, bundle: Uint8Array): CompiledMultiInputGraph;

export function importProgramBundle(registry: LayerRegistry, bundle: Uint8Array): CompiledGraph;

export function indexSourceCapabilities(): string;

/**
 * Return the embedded contract for optional external input metadata.
 */
export function inputContractCapabilities(): string;

/**
 * Compare the current optional input contract against one typed consumer spec.
 *
 * Unbound and unknown are not failures. Incompatible means the declared
 * shape/layout proves the consumer cannot accept the external input without an
 * explicit transform.
 */
export function inputContractCompatibility(workspace: AgentWorkspace, consumer: AgentLayerSpec): string;

export function inputPortCapabilities(): string;

export function inputPortConsumerCapabilities(): string;

export function inputPortConsumerCompatibility(workspace: AgentWorkspace, consumer: InputPortConsumerSpec): string;

export function inputPortConsumerEdgeBinding(workspace: AgentWorkspace, builder: AgentGraphBuilder, step_index: number): string;

export function inputPortConsumerEdgeCompatibility(workspace: AgentWorkspace, builder: AgentGraphBuilder, consumer: InputPortConsumerSpec, step_index: number): string;

export function inputPortEdgeBindingCapabilities(): string;

export function inputPortRoutingCapabilities(): string;

/**
 * Describe the projection-only interaction surface layered above existing
 * workspace, builder, and registry authorities.
 */
export function interactionCapabilities(): string;

export function interactionCheckCompile(builder: AgentGraphBuilder, registry: LayerRegistry, output_slot: number): string;

export function interactionCheckInitBinary(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, spec: AgentLayerSpec, left_slot: number, right_slot: number, label: string): string;

export function interactionCheckInitUnary(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, spec: AgentLayerSpec, input_slot: number, label: string): string;

export function interactionCheckReleaseSlot(workspace: AgentWorkspace, slot: number): string;

export function interactionCheckReserveSlot(workspace: AgentWorkspace, owner: string): string;

/**
 * Machine-readable description of the non-mutating action-preflight fault surface.
 */
export function interactionFaultCapabilities(): string;

/**
 * Produce a compact point-in-time projection for agent planning.
 *
 * No new source of truth is introduced: every field is derived from the
 * supplied workspace, graph builder, and registry.
 */
export function interactionSnapshot(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry): string;

/**
 * Return the currently state-admissible canonical interaction families.
 *
 * This is a read-only projection. Availability means the current state admits
 * at least one valid argument assignment; operation-specific validation remains
 * authoritative at the actual call boundary.
 */
export function interactionValidActions(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry): string;

export function interactionValidActionsForInputConsumer(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, consumer: InputPortConsumerSpec): string;

/**
 * Return the semantic-introspection contract embedded in the WASM artifact.
 */
export function introspectionCapabilities(): string;

export function layerRegistryInventoryCapabilities(): string;

export function layerRegistryOperationBindingCapabilities(): string;

export function linearAlgebraCapabilities(): string;

/**
 * Validate only operation metadata that can be proven without reading tensor values.
 *
 * u32_params carries shape/axis/index metadata and f32_params carries scalar
 * operation parameters. Value-domain predicates remain explicitly deferred to the
 * authoritative direct/program execution surface.
 */
export function mathCheckOperation(operation_id: string, lhs_shape: Uint32Array, rhs_shape: Uint32Array, u32_params: Uint32Array, f32_params: Float32Array): string;

/**
 * Describe one canonical operation without executing it or selecting it for the agent.
 */
export function mathDescribeOperation(operation_id: string): string;

/**
 * Machine-readable authority and lifecycle description for the unified math vocabulary.
 *
 * This layer is discovery/projection only. It owns no tensor, program, execution,
 * verification, or Resolution state.
 */
export function mathInteractionCapabilities(): string;

/**
 * Return canonical math operation IDs and their bindings to existing direct/program surfaces.
 *
 * The catalog intentionally delegates detailed numerical/domain constraints to the existing
 * per-family capability contracts instead of becoming a second semantic authority.
 */
export function mathOperationCatalog(): string;

/**
 * Translate a canonical operation into an explicit direct or MathProgram binding plan.
 *
 * The caller must choose target="direct" or target="program". This function validates
 * metadata through mathCheckOperation, but never calls the direct method, never mutates
 * a MathProgram builder, and never chooses a target or program generation.
 */
export function mathPlanBinding(operation_id: string, target: string, lhs_shape: Uint32Array, rhs_shape: Uint32Array, u32_params: Uint32Array, f32_params: Float32Array): string;

export function mathProgramCapabilities(): string;

export function mathProgramV4Capabilities(): string;

export function mathProgramV5Capabilities(): string;

export function mathProgramV6Capabilities(): string;

export function mathProgramV7Capabilities(): string;

export function mathProgramV8Capabilities(): string;

export function mathProgramV9Capabilities(): string;

/**
 * Return the MathProgram proof/correlation authority contract.
 */
export function mathProofCapabilities(): string;

/**
 * Project all canonical math operations against available operand-shape metadata.
 *
 * This is a candidate filter, not a chooser. Unary operations are evaluated against
 * lhs independently even when rhs is available. Binary operations require rhs.
 * Operations needing operation-specific parameters are retained as candidates with
 * status requires_parameters rather than being falsely rejected for missing params.
 */
export function mathValidOperations(lhs_shape: Uint32Array, rhs_shape: Uint32Array): string;

/**
 * Compare an external implementation result with a trusted numerical reference.
 *
 * This is intentionally dependency-free and returns compact JSON so an agent can
 * consume the proof result without coupling the produced artifact to this WASM runtime.
 */
export function mathVerifyVectors(reference: Float32Array, candidate: Float32Array, abs_tol: number, rel_tol: number): string;

export function multiInputGraphCapabilities(): string;

export function multiInputProgramBundleCapabilities(): string;

export function numericKernelCapabilities(): string;

export function probabilityCapabilities(): string;

export function programBundleCapabilities(): string;

export function programCapabilities(): string;

/**
 * Return the embedded proof-provenance contract.
 */
export function proofProvenanceCapabilities(): string;

export function reductionCapabilities(): string;

export function resolutionRuntimeBridgeCapabilities(): string;

export function runtimeResolutionEvidenceCapabilities(): string;

export function semanticExecutionContext(builder: AgentGraphBuilder, graph: CompiledGraph, registry: LayerRegistry): string;

export function semanticExecutionContextCapabilities(): string;

export function semanticGraphIdentity(builder: AgentGraphBuilder): string;

export function semanticIngressManifestCapabilities(): string;

export function semanticIngressManifestStatus(workspace: AgentWorkspace, manifest: SemanticIngressManifest): string;

export function semanticIngressManifestV2Capabilities(): string;

export function semanticLifecycleCapabilities(): string;

export function semanticLifecycleIdentity(builder: AgentGraphBuilder): string;

export function semanticLifecycleProjection(builder: AgentGraphBuilder): string;

export function semanticLifecycleTransition(builder: AgentGraphBuilder, step_index: number): string;

export function setGraphParametersFlat(graph: CompiledGraph, registry: LayerRegistry, candidate: Float32Array): void;

export function statisticsCapabilities(): string;

export function tensorTransformCapabilities(): string;

/**
 * Reject only known semantic layout mismatches. No implicit transpose/reshape is inserted.
 */
export function validateAgentLayoutEdge(producer: AgentLayerSpec, consumer: AgentLayerSpec): void;

/**
 * Bind optional shape/layout metadata to the canonical external input slot 0.
 *
 * This mutates AgentWorkspace metadata only. It does not allocate tensors,
 * initialize layers, alter the graph plan, or mutate LayerRegistry.
 */
export function workspaceBindInputContract(workspace: AgentWorkspace, dim0: number, dim1: number, dim2: number, dim3: number, layout: string, semantics: string): void;

export function workspaceBindInputPortMetadata(workspace: AgentWorkspace, role: string, source: string, revision: bigint, fingerprint: string): boolean;

/**
 * Bind the canonical one-step MathProgramV9 reference identity for a direct math operation.
 *
 * This does not execute the direct operation. It validates metadata through mathCheckOperation,
 * builds the verifier-owned V9 reference program, and binds only that exact replayable identity
 * to the already-bound runtime subject.
 */
export function workspaceBindRuntimeDirectMathOperation(workspace: AgentWorkspace, operation_id: string, lhs_shape: Uint32Array, rhs_shape: Uint32Array, u32_params: Uint32Array, f32_params: Float32Array): string;

/**
 * Bind a replay-derived MathProgram programIdentity to an already-bound runtime subject.
 *
 * Callers supply canonical plan bytes, never a free-form identity string. Replay validation
 * derives the authoritative exact programIdentity before any binding mutation occurs.
 */
export function workspaceBindRuntimeMathProgramPlan(workspace: AgentWorkspace, plan: Uint8Array): string;

export function workspaceBindRuntimeSubject(workspace: AgentWorkspace, intent_id: string, workflow_revision: bigint, approval_id: string, subject_kind: string, subject_identity: string, authorization_policy_id: string, authorization_policy_revision: bigint, authorization_is_revision: boolean): boolean;

/**
 * Discover the canonical agent-facing workspace/control-plane API.
 */
export function workspaceCapabilities(): string;

/**
 * Clear optional external input metadata. Runtime execution behavior is unchanged.
 */
export function workspaceClearInputContract(workspace: AgentWorkspace): boolean;

export function workspaceClearInputPortMetadata(workspace: AgentWorkspace): boolean;

/**
 * Compile using a temporary output selection without mutating builder state.
 */
export function workspaceCompile(builder: AgentGraphBuilder, registry: LayerRegistry, output_slot: number): CompiledGraph;

/**
 * Compile and bind the exact CompiledGraph.programIdentity to the immutable runtime subject.
 *
 * This is the canonical compile path for subject-bound verification. The historical
 * workspaceCompile surface remains available as an explicit unbound/legacy escape hatch.
 */
export function workspaceCompileForRuntimeSubject(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, output_slot: number): CompiledGraph;

/**
 * Initialize a reserved binary layer and wire it into the graph.
 * A workspace checkpoint protects the entire control state until graph commit succeeds.
 */
export function workspaceInitBinary(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, spec: AgentLayerSpec, left_slot: number, right_slot: number, label: string): number;

/**
 * Initialize a reserved unary layer and wire it into the graph.
 * A workspace checkpoint protects the entire control state until graph commit succeeds.
 */
export function workspaceInitUnary(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, spec: AgentLayerSpec, input_slot: number, label: string): number;

/**
 * Return the current input contract or an explicit unbound marker.
 */
export function workspaceInputContract(workspace: AgentWorkspace): string;

export function workspaceInputPortMetadata(workspace: AgentWorkspace): string;

/**
 * Return proof-related workspace collections without merging their authority classes.
 */
export function workspaceProofLedger(workspace: AgentWorkspace): string;

/**
 * Record an explicit caller claim. This never upgrades into verifier authority.
 */
export function workspaceRecordAttestation(workspace: AgentWorkspace, label: string, claimed_passed: boolean, detail: string): string;

export function workspaceRuntimeProgramBinding(workspace: AgentWorkspace, graph: CompiledGraph): string;

export function workspaceRuntimeSubject(workspace: AgentWorkspace): string;

/**
 * Execute a canonical unary direct math operation and compare it to a verifier-owned V9 reference.
 */
export function workspaceVerifyDirectMath1Receipt(workspace: AgentWorkspace, operation_id: string, input: WasmTensor, u32_params: Uint32Array, f32_params: Float32Array, abs_tol: number, rel_tol: number, label: string): string;

/**
 * Execute a canonical binary direct math operation and compare it to a verifier-owned V9 reference.
 */
export function workspaceVerifyDirectMath2Receipt(workspace: AgentWorkspace, operation_id: string, lhs: WasmTensor, rhs: WasmTensor, u32_params: Uint32Array, f32_params: Float32Array, abs_tol: number, rel_tol: number, label: string): string;

/**
 * Execute the compiled Burn graph as reference, compare the candidate, and record the receipt.
 *
 * The returned receipt includes the exact programIdentity object. The workspace ledger stores a
 * compact receipt keyed by the deterministic program-identity fingerprint.
 */
export function workspaceVerifyGraphReceipt(workspace: AgentWorkspace, graph: CompiledGraph, registry: LayerRegistry, input: WasmTensor, candidate: Float32Array, abs_tol: number, rel_tol: number, label: string): string;

/**
 * Replay a canonical 1-input MathProgram as the independent numerical reference.
 */
export function workspaceVerifyMathProgram1Receipt(workspace: AgentWorkspace, plan: Uint8Array, input: WasmTensor, candidate: Float32Array, abs_tol: number, rel_tol: number, label: string): string;

/**
 * Replay a canonical 2-input MathProgram as the independent numerical reference.
 */
export function workspaceVerifyMathProgram2Receipt(workspace: AgentWorkspace, plan: Uint8Array, lhs: WasmTensor, rhs: WasmTensor, candidate: Float32Array, abs_tol: number, rel_tol: number, label: string): string;

/**
 * Verify a Burn graph while binding the current semantic graph/lifecycle identities
 * into the returned proof context. Numerical authority remains CompiledGraph.verifyFlat.
 */
export function workspaceVerifySemanticGraphReceipt(workspace: AgentWorkspace, builder: AgentGraphBuilder, graph: CompiledGraph, registry: LayerRegistry, input: WasmTensor, candidate: Float32Array, abs_tol: number, rel_tol: number, label: string): string;

/**
 * Verify against a caller-supplied reference and record a lower-authority comparator receipt.
 */
export function workspaceVerifyVectorReceipt(workspace: AgentWorkspace, reference: Float32Array, candidate: Float32Array, abs_tol: number, rel_tol: number, label: string): string;

/**
 * Reconcile an already initialized binary layer into workspace metadata and graph wiring.
 * The supplied spec must exactly match the live registry layer's validated init identity.
 */
export function workspaceWireBinary(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, spec: AgentLayerSpec, left_slot: number, right_slot: number, label: string): number;

/**
 * Reconcile an already initialized unary layer into workspace metadata and graph wiring.
 * The supplied spec must exactly match the live registry layer's validated init identity.
 */
export function workspaceWireUnary(workspace: AgentWorkspace, builder: AgentGraphBuilder, registry: LayerRegistry, spec: AgentLayerSpec, input_slot: number, label: string): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_agentgraphbuilder_free: (a: number, b: number) => void;
    readonly __wbg_agentlayerspec_free: (a: number, b: number) => void;
    readonly __wbg_agentworkspace_free: (a: number, b: number) => void;
    readonly __wbg_checkpointbranchset_free: (a: number, b: number) => void;
    readonly __wbg_compiledgraph_free: (a: number, b: number) => void;
    readonly __wbg_compiledmultiinputgraph_free: (a: number, b: number) => void;
    readonly __wbg_esoptimizer_free: (a: number, b: number) => void;
    readonly __wbg_get_packetheader_flags: (a: number) => number;
    readonly __wbg_get_packetheader_layer_type: (a: number) => number;
    readonly __wbg_get_packetheader_opcode: (a: number) => number;
    readonly __wbg_get_packetheader_payload_len: (a: number) => number;
    readonly __wbg_get_packetheader_variant: (a: number) => number;
    readonly __wbg_graphmutationtransaction_free: (a: number, b: number) => void;
    readonly __wbg_inputportconsumerspec_free: (a: number, b: number) => void;
    readonly __wbg_layerregistry_free: (a: number, b: number) => void;
    readonly __wbg_multiinputgraphplan_free: (a: number, b: number) => void;
    readonly __wbg_multiinputinputbundle_free: (a: number, b: number) => void;
    readonly __wbg_multiinputverificationcases_free: (a: number, b: number) => void;
    readonly __wbg_packetheader_free: (a: number, b: number) => void;
    readonly __wbg_semanticingressmanifest_free: (a: number, b: number) => void;
    readonly __wbg_semanticingressmanifestv2_free: (a: number, b: number) => void;
    readonly __wbg_semantictransitionspec_free: (a: number, b: number) => void;
    readonly __wbg_set_packetheader_flags: (a: number, b: number) => void;
    readonly __wbg_set_packetheader_layer_type: (a: number, b: number) => void;
    readonly __wbg_set_packetheader_opcode: (a: number, b: number) => void;
    readonly __wbg_set_packetheader_payload_len: (a: number, b: number) => void;
    readonly __wbg_set_packetheader_variant: (a: number, b: number) => void;
    readonly __wbg_tensorview_free: (a: number, b: number) => void;
    readonly __wbg_tracedmultiinputrun_free: (a: number, b: number) => void;
    readonly __wbg_wasmactivation_free: (a: number, b: number) => void;
    readonly __wbg_wasmbinary_free: (a: number, b: number) => void;
    readonly __wbg_wasmcomparison_free: (a: number, b: number) => void;
    readonly __wbg_wasmconv_free: (a: number, b: number) => void;
    readonly __wbg_wasmembedding_free: (a: number, b: number) => void;
    readonly __wbg_wasmfeaturenorm_free: (a: number, b: number) => void;
    readonly __wbg_wasmghostmodule_free: (a: number, b: number) => void;
    readonly __wbg_wasmindexsource_free: (a: number, b: number) => void;
    readonly __wbg_wasminttensor_free: (a: number, b: number) => void;
    readonly __wbg_wasmlinear_free: (a: number, b: number) => void;
    readonly __wbg_wasmlinearalgebra_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogram_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogrambuilder_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv4_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv4builder_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv5_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv5builder_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv6_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv6builder_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv7_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv7builder_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv8_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv8builder_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv9_free: (a: number, b: number) => void;
    readonly __wbg_wasmmathprogramv9builder_free: (a: number, b: number) => void;
    readonly __wbg_wasmnorm_free: (a: number, b: number) => void;
    readonly __wbg_wasmnumerickernel_free: (a: number, b: number) => void;
    readonly __wbg_wasmpool_free: (a: number, b: number) => void;
    readonly __wbg_wasmprobability_free: (a: number, b: number) => void;
    readonly __wbg_wasmreduction_free: (a: number, b: number) => void;
    readonly __wbg_wasmseblock_free: (a: number, b: number) => void;
    readonly __wbg_wasmshift_free: (a: number, b: number) => void;
    readonly __wbg_wasmstatistics_free: (a: number, b: number) => void;
    readonly __wbg_wasmtensor_free: (a: number, b: number) => void;
    readonly __wbg_wasmtensortransform_free: (a: number, b: number) => void;
    readonly agentCapabilities: () => [number, number];
    readonly agentContractSchema: () => [number, number];
    readonly agentContractSchemaVersion: () => number;
    readonly agentLayerCatalog: () => [number, number];
    readonly agentLayoutCompatibility: (a: number, b: number) => [number, number];
    readonly agentLayoutContract: () => [number, number];
    readonly agentLayoutContractVersion: () => number;
    readonly agentSpecLayout: (a: number) => [number, number];
    readonly agentgraphbuilder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly agentgraphbuilder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly agentgraphbuilder_compile: (a: number, b: number) => [number, number, number];
    readonly agentgraphbuilder_compileWithOutput: (a: number, b: number, c: number) => [number, number, number];
    readonly agentgraphbuilder_multiInputPlanV1: (a: number) => [number, number, number];
    readonly agentgraphbuilder_new: (a: number) => [number, number, number];
    readonly agentgraphbuilder_numSlots: (a: number) => number;
    readonly agentgraphbuilder_numSteps: (a: number) => number;
    readonly agentgraphbuilder_setOutput: (a: number, b: number) => [number, number];
    readonly agentlayerspec_adaptiveAvgPool2d: (a: number, b: number, c: number) => [number, number, number];
    readonly agentlayerspec_add: (a: number) => number;
    readonly agentlayerspec_avgPool1d: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_avgPool2d: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly agentlayerspec_batchNorm: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_concat: (a: number, b: number) => number;
    readonly agentlayerspec_conv1d: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly agentlayerspec_conv2d: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly agentlayerspec_convTranspose2d: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly agentlayerspec_embedding: (a: number, b: number, c: number) => [number, number, number];
    readonly agentlayerspec_featureNorm: (a: number, b: number, c: number) => [number, number, number];
    readonly agentlayerspec_gelu: (a: number) => number;
    readonly agentlayerspec_ghost: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number];
    readonly agentlayerspec_glu: (a: number, b: number) => number;
    readonly agentlayerspec_groupNorm: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly agentlayerspec_hardSigmoid: (a: number, b: number, c: number) => [number, number, number];
    readonly agentlayerspec_hardSwish: (a: number) => number;
    readonly agentlayerspec_instanceNorm: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_intAdd: (a: number) => number;
    readonly agentlayerspec_intFromFloat: (a: number) => number;
    readonly agentlayerspec_intMatmul: (a: number) => number;
    readonly agentlayerspec_intMul: (a: number) => number;
    readonly agentlayerspec_intSub: (a: number) => number;
    readonly agentlayerspec_intToFloat: (a: number) => number;
    readonly agentlayerspec_layerId: (a: number) => number;
    readonly agentlayerspec_layerNorm: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_layerType: (a: number) => number;
    readonly agentlayerspec_leakyRelu: (a: number, b: number) => [number, number, number];
    readonly agentlayerspec_linear: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_logSoftmax: (a: number, b: number) => number;
    readonly agentlayerspec_matmul: (a: number) => number;
    readonly agentlayerspec_maxPool1d: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_maxPool2d: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly agentlayerspec_mish: (a: number) => number;
    readonly agentlayerspec_mul: (a: number) => number;
    readonly agentlayerspec_prelu: (a: number, b: number, c: number) => [number, number, number];
    readonly agentlayerspec_relu: (a: number) => number;
    readonly agentlayerspec_rmsNorm: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_seBlock: (a: number, b: number, c: number) => [number, number, number];
    readonly agentlayerspec_shiftDown: (a: number, b: number) => number;
    readonly agentlayerspec_shiftLeft: (a: number, b: number) => number;
    readonly agentlayerspec_shiftRight: (a: number, b: number) => number;
    readonly agentlayerspec_shiftUp: (a: number, b: number) => number;
    readonly agentlayerspec_sigmoid: (a: number) => number;
    readonly agentlayerspec_softmax: (a: number, b: number) => number;
    readonly agentlayerspec_softplus: (a: number, b: number) => [number, number, number];
    readonly agentlayerspec_sub: (a: number) => number;
    readonly agentlayerspec_swiGlu: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentlayerspec_tanh: (a: number) => number;
    readonly agentlayerspec_transpose: (a: number, b: number, c: number) => [number, number, number];
    readonly agentlayerspec_variant: (a: number) => number;
    readonly agentworkspace_forgetLayer: (a: number, b: number) => number;
    readonly agentworkspace_get: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly agentworkspace_limits: (a: number) => [number, number];
    readonly agentworkspace_new: (a: number) => [number, number, number];
    readonly agentworkspace_put: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number];
    readonly agentworkspace_query: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly agentworkspace_recordEvent: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly agentworkspace_recordProof: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly agentworkspace_releaseSlot: (a: number, b: number) => [number, number];
    readonly agentworkspace_remove: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly agentworkspace_reserveLayerId: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly agentworkspace_reserveSlot: (a: number, b: number, c: number) => [number, number, number];
    readonly agentworkspace_snapshot: (a: number) => [number, number];
    readonly agentworkspace_syncLayer: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly agentworkspace_tableNames: (a: number) => [number, number];
    readonly bindInputPortConsumerEdge: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly bindSemanticLifecycleTransition: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly checkpointBranchCapabilities: () => [number, number];
    readonly checkpointbranchset_baselineBundle: (a: number) => [number, number];
    readonly checkpointbranchset_baselineStateDigest: (a: number) => [number, number];
    readonly checkpointbranchset_branchCount: (a: number) => number;
    readonly checkpointbranchset_candidateBundle: (a: number, b: number, c: number) => [number, number, number, number];
    readonly checkpointbranchset_commitBranchByReceipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number, number];
    readonly checkpointbranchset_fork: (a: number, b: number, c: number) => [number, number, number];
    readonly checkpointbranchset_insertStep: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly checkpointbranchset_new: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly checkpointbranchset_promotedBranch: (a: number) => [number, number];
    readonly checkpointbranchset_reconnectStep: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly checkpointbranchset_removeStep: (a: number, b: number, c: number, d: number) => [number, number];
    readonly checkpointbranchset_replaceStep: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly checkpointbranchset_setOutput: (a: number, b: number, c: number, d: number) => [number, number];
    readonly checkpointbranchset_setWeightsFlat: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly checkpointbranchset_stageBranch: (a: number, b: number, c: number) => [number, number, number, number];
    readonly checkpointbranchset_stateDiff: (a: number, b: number, c: number) => [number, number, number, number];
    readonly checkpointbranchset_verifyBranch: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly comparisonCapabilities: () => [number, number];
    readonly compiledgraph_numSlots: (a: number) => number;
    readonly compiledgraph_numSteps: (a: number) => number;
    readonly compiledgraph_outSlot: (a: number) => number;
    readonly compiledgraph_programIdentity: (a: number) => [number, number];
    readonly compiledgraph_programPlan: (a: number) => [number, number];
    readonly compiledgraph_run: (a: number, b: number, c: number) => [number, number, number];
    readonly compiledgraph_validateRegistryBinding: (a: number, b: number) => [number, number];
    readonly compiledgraph_verifyFlat: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number, number];
    readonly compiledmultiinputgraph_explainPlan: (a: number, b: number) => [number, number];
    readonly compiledmultiinputgraph_inputPlanV1: (a: number) => [number, number];
    readonly compiledmultiinputgraph_preflight: (a: number, b: number, c: number) => [number, number];
    readonly compiledmultiinputgraph_programIdentity: (a: number) => [number, number];
    readonly compiledmultiinputgraph_programPlan: (a: number) => [number, number];
    readonly compiledmultiinputgraph_requiredInputSlots: (a: number) => [number, number];
    readonly compiledmultiinputgraph_run: (a: number, b: number, c: number) => [number, number, number];
    readonly compiledmultiinputgraph_runWithTrace: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly compiledmultiinputgraph_validateRegistryBinding: (a: number, b: number) => [number, number];
    readonly compiledmultiinputgraph_verifyFlat: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number, number];
    readonly decodeGuardCheck: (a: number, b: number) => [number, number];
    readonly describeGraph: (a: number, b: number, c: number) => [number, number, number, number];
    readonly describeWorkspace: (a: number, b: number) => [number, number];
    readonly esCapabilities: () => [number, number];
    readonly esoptimizer_ask: (a: number) => [number, number];
    readonly esoptimizer_batchSize: (a: number) => number;
    readonly esoptimizer_best: (a: number) => [number, number];
    readonly esoptimizer_dim: (a: number) => number;
    readonly esoptimizer_generation: (a: number) => number;
    readonly esoptimizer_mean: (a: number) => [number, number];
    readonly esoptimizer_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly esoptimizer_report: (a: number) => [number, number];
    readonly esoptimizer_runLinearDemo: (a: number, b: number) => [number, number, number, number];
    readonly esoptimizer_setLearningRate: (a: number, b: number) => [number, number];
    readonly esoptimizer_strict: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly esoptimizer_tell: (a: number, b: number, c: number) => [number, number, number, number];
    readonly esoptimizer_withRng: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly exportMultiInputProgramBundle: (a: number, b: number, c: number) => [number, number, number, number];
    readonly exportProgramBundle: (a: number, b: number, c: number) => [number, number, number, number];
    readonly getGraphParametersFlat: (a: number, b: number) => [number, number, number, number];
    readonly graphParameterCapabilities: () => [number, number];
    readonly graphParameterIdentity: (a: number, b: number) => [number, number, number, number];
    readonly graphParameterLayout: (a: number, b: number) => [number, number, number, number];
    readonly graphmutationtransaction_baselineBundle: (a: number) => [number, number];
    readonly graphmutationtransaction_baselineStateDigest: (a: number) => [number, number];
    readonly graphmutationtransaction_candidateBundle: (a: number) => [number, number, number, number];
    readonly graphmutationtransaction_commitByReceipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number];
    readonly graphmutationtransaction_insertStep: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly graphmutationtransaction_new: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly graphmutationtransaction_reconnectStep: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly graphmutationtransaction_removeStep: (a: number, b: number) => [number, number];
    readonly graphmutationtransaction_replaceStep: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly graphmutationtransaction_setOutput: (a: number, b: number) => [number, number];
    readonly graphmutationtransaction_setWeightsFlat: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly graphmutationtransaction_stageCandidate: (a: number) => [number, number, number, number];
    readonly graphmutationtransaction_verifyCases: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly importMultiInputProgramBundle: (a: number, b: number, c: number) => [number, number, number];
    readonly importProgramBundle: (a: number, b: number, c: number) => [number, number, number];
    readonly indexSourceCapabilities: () => [number, number];
    readonly inputContractCapabilities: () => [number, number];
    readonly inputContractCompatibility: (a: number, b: number) => [number, number];
    readonly inputPortCapabilities: () => [number, number];
    readonly inputPortConsumerCapabilities: () => [number, number];
    readonly inputPortConsumerCompatibility: (a: number, b: number) => [number, number];
    readonly inputPortConsumerEdgeBinding: (a: number, b: number, c: number) => [number, number, number, number];
    readonly inputPortConsumerEdgeCompatibility: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly inputPortEdgeBindingCapabilities: () => [number, number];
    readonly inputPortRoutingCapabilities: () => [number, number];
    readonly inputportconsumerspec_acceptedRoles: (a: number) => [number, number];
    readonly inputportconsumerspec_allowExtensionRoles: (a: number) => number;
    readonly inputportconsumerspec_consumerId: (a: number) => [number, number];
    readonly inputportconsumerspec_describe: (a: number) => [number, number];
    readonly inputportconsumerspec_minimumRevision: (a: number) => bigint;
    readonly inputportconsumerspec_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: bigint) => [number, number, number];
    readonly inputportconsumerspec_requireFingerprint: (a: number) => number;
    readonly interactionCapabilities: () => [number, number];
    readonly interactionCheckCompile: (a: number, b: number, c: number) => [number, number];
    readonly interactionCheckInitBinary: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly interactionCheckInitUnary: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly interactionCheckReleaseSlot: (a: number, b: number) => [number, number];
    readonly interactionCheckReserveSlot: (a: number, b: number, c: number) => [number, number];
    readonly interactionFaultCapabilities: () => [number, number];
    readonly interactionSnapshot: (a: number, b: number, c: number) => [number, number, number, number];
    readonly interactionValidActions: (a: number, b: number, c: number) => [number, number, number, number];
    readonly interactionValidActionsForInputConsumer: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly introspectionCapabilities: () => [number, number];
    readonly layerRegistryInventoryCapabilities: () => [number, number];
    readonly layerRegistryOperationBindingCapabilities: () => [number, number];
    readonly layerregistry_compileGraph: (a: number, b: number, c: number) => [number, number, number];
    readonly layerregistry_compileMultiInputGraph: (a: number, b: number) => [number, number, number];
    readonly layerregistry_destroyLayer: (a: number, b: number, c: number) => number;
    readonly layerregistry_forwardBinaryLayer: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly layerregistry_forwardIntBinary: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly layerregistry_forwardIntCastFromFloat: (a: number, b: number, c: number) => [number, number, number];
    readonly layerregistry_forwardIntCastToFloat: (a: number, b: number, c: number) => [number, number, number];
    readonly layerregistry_forwardLayer: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly layerregistry_getLayerState: (a: number, b: number, c: number) => [number, number, number, number];
    readonly layerregistry_getWeightsFlat: (a: number, b: number, c: number) => [number, number, number, number];
    readonly layerregistry_initAgentLayer: (a: number, b: number) => [number, number];
    readonly layerregistry_initLayer: (a: number, b: number, c: number, d: number) => [number, number];
    readonly layerregistry_inventorySnapshot: (a: number) => [number, number, number, number];
    readonly layerregistry_layerExists: (a: number, b: number, c: number) => number;
    readonly layerregistry_layerInitFingerprint: (a: number, b: number, c: number) => [number, number, number, number];
    readonly layerregistry_loadLayerState: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly layerregistry_new: () => number;
    readonly layerregistry_operationBindingSnapshot: (a: number) => [number, number, number, number];
    readonly layerregistry_runGraph: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly layerregistry_setWeightsFlat: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly layerregistry_totalParams: (a: number) => number;
    readonly layerregistry_weightLayout: (a: number, b: number, c: number) => [number, number, number, number];
    readonly linearAlgebraCapabilities: () => [number, number];
    readonly mathCheckOperation: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number, number];
    readonly mathDescribeOperation: (a: number, b: number) => [number, number, number, number];
    readonly mathInteractionCapabilities: () => [number, number];
    readonly mathOperationCatalog: () => [number, number];
    readonly mathPlanBinding: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number, number, number];
    readonly mathProgramCapabilities: () => [number, number];
    readonly mathProgramV4Capabilities: () => [number, number];
    readonly mathProgramV5Capabilities: () => [number, number];
    readonly mathProgramV6Capabilities: () => [number, number];
    readonly mathProgramV7Capabilities: () => [number, number];
    readonly mathProgramV8Capabilities: () => [number, number];
    readonly mathProgramV9Capabilities: () => [number, number];
    readonly mathProofCapabilities: () => [number, number];
    readonly mathValidOperations: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly mathVerifyVectors: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly multiInputGraphCapabilities: () => [number, number];
    readonly multiInputProgramBundleCapabilities: () => [number, number];
    readonly multiinputgraphplan_addInputPort: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: bigint) => [number, number, number];
    readonly multiinputgraphplan_fromBytes: (a: number, b: number) => [number, number, number];
    readonly multiinputgraphplan_inputSlots: (a: number) => [number, number];
    readonly multiinputgraphplan_new: (a: number) => [number, number, number];
    readonly multiinputgraphplan_planFingerprint: (a: number) => [number, number, number, number];
    readonly multiinputgraphplan_portCount: (a: number) => number;
    readonly multiinputgraphplan_programPlan: (a: number) => [number, number];
    readonly multiinputgraphplan_toBytes: (a: number) => [number, number, number, number];
    readonly multiinputgraphplan_toJSON: (a: number) => [number, number, number, number];
    readonly multiinputinputbundle_bindInput: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: bigint, k: number, l: number) => [number, number, number];
    readonly multiinputinputbundle_boundPortCount: (a: number) => number;
    readonly multiinputinputbundle_clearInput: (a: number, b: number) => number;
    readonly multiinputinputbundle_new: (a: number) => [number, number, number];
    readonly multiinputinputbundle_planFingerprint: (a: number) => [number, number];
    readonly multiinputverificationcases_addCase: (a: number, b: number, c: number) => [number, number, number];
    readonly multiinputverificationcases_caseCount: (a: number) => number;
    readonly multiinputverificationcases_new: (a: number, b: number) => [number, number, number];
    readonly multiinputverificationcases_verify: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number, number];
    readonly numericKernelCapabilities: () => [number, number];
    readonly packetheader_from_bytes: (a: number, b: number) => [number, number, number];
    readonly packetheader_has_bias: (a: number) => number;
    readonly packetheader_is_training: (a: number) => number;
    readonly packetheader_to_bytes: (a: number) => [number, number];
    readonly probabilityCapabilities: () => [number, number];
    readonly programBundleCapabilities: () => [number, number];
    readonly programCapabilities: () => [number, number];
    readonly proofProvenanceCapabilities: () => [number, number];
    readonly reductionCapabilities: () => [number, number];
    readonly resolutionRuntimeBridgeCapabilities: () => [number, number];
    readonly runtimeResolutionEvidenceCapabilities: () => [number, number];
    readonly semanticExecutionContext: (a: number, b: number, c: number) => [number, number, number, number];
    readonly semanticExecutionContextCapabilities: () => [number, number];
    readonly semanticGraphIdentity: (a: number) => [number, number];
    readonly semanticIngressManifestCapabilities: () => [number, number];
    readonly semanticIngressManifestStatus: (a: number, b: number) => [number, number];
    readonly semanticIngressManifestV2Capabilities: () => [number, number];
    readonly semanticLifecycleCapabilities: () => [number, number];
    readonly semanticLifecycleIdentity: (a: number) => [number, number];
    readonly semanticLifecycleProjection: (a: number) => [number, number];
    readonly semanticLifecycleTransition: (a: number, b: number) => [number, number, number, number];
    readonly semanticingressmanifest_addDeferredPort: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: bigint, i: number, j: number, k: number) => [number, number, number];
    readonly semanticingressmanifest_addRuntimeBackedPort: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: bigint, i: number, j: number, k: number, l: number) => [number, number, number];
    readonly semanticingressmanifest_manifestFingerprint: (a: number) => [number, number];
    readonly semanticingressmanifest_new: () => number;
    readonly semanticingressmanifest_portCount: (a: number) => number;
    readonly semanticingressmanifest_toJSON: (a: number) => [number, number];
    readonly semanticingressmanifestv2_addDeferredPort: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly semanticingressmanifestv2_addRuntimePort: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly semanticingressmanifestv2_consumerCompatibility: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly semanticingressmanifestv2_inputPortStatus: (a: number, b: number, c: number) => [number, number, number, number];
    readonly semanticingressmanifestv2_manifestFingerprint: (a: number) => [number, number];
    readonly semanticingressmanifestv2_new: (a: number) => [number, number, number];
    readonly semanticingressmanifestv2_run: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly semanticingressmanifestv2_runWithTrace: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly semanticingressmanifestv2_status: (a: number, b: number, c: number, d: number) => [number, number];
    readonly semanticingressmanifestv2_toJSON: (a: number) => [number, number];
    readonly semanticingressmanifestv2_verifyFlat: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
    readonly semantictransitionspec_describe: (a: number) => [number, number];
    readonly semantictransitionspec_inputRoles: (a: number) => [number, number];
    readonly semantictransitionspec_new: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly semantictransitionspec_outputRole: (a: number) => [number, number];
    readonly semantictransitionspec_transitionId: (a: number) => [number, number];
    readonly setGraphParametersFlat: (a: number, b: number, c: number, d: number) => [number, number];
    readonly statisticsCapabilities: () => [number, number];
    readonly tensorTransformCapabilities: () => [number, number];
    readonly tensorview_len: (a: number) => number;
    readonly tensorview_new: (a: number) => number;
    readonly tensorview_read: (a: number, b: number, c: number, d: any) => void;
    readonly tensorview_setShape: (a: number, b: number, c: number) => [number, number];
    readonly tensorview_shape: (a: number) => [number, number];
    readonly tensorview_write: (a: number, b: number, c: number) => void;
    readonly tracedmultiinputrun_output: (a: number) => [number, number, number];
    readonly tracedmultiinputrun_report: (a: number) => [number, number];
    readonly validateAgentLayoutEdge: (a: number, b: number) => [number, number];
    readonly wasmactivation_forward: (a: number, b: number) => number;
    readonly wasmactivation_get_state: (a: number) => [number, number, number, number];
    readonly wasmactivation_load_state: (a: number, b: number, c: number) => [number, number];
    readonly wasmactivation_newGelu: () => number;
    readonly wasmactivation_newGlu: (a: number) => number;
    readonly wasmactivation_newHardSigmoid: (a: number, b: number, c: number, d: number) => number;
    readonly wasmactivation_newHardSwish: () => number;
    readonly wasmactivation_newLeakyRelu: (a: number, b: number) => number;
    readonly wasmactivation_newLogSoftmax: (a: number) => number;
    readonly wasmactivation_newMish: () => number;
    readonly wasmactivation_newPRelu: (a: number, b: number, c: number) => number;
    readonly wasmactivation_newRelu: () => number;
    readonly wasmactivation_newSigmoid: () => number;
    readonly wasmactivation_newSoftmax: (a: number) => number;
    readonly wasmactivation_newSoftplus: (a: number, b: number) => number;
    readonly wasmactivation_newSwiGlu: (a: number, b: number, c: number) => number;
    readonly wasmactivation_newTanh: () => number;
    readonly wasmactivation_num_params: (a: number) => number;
    readonly wasmbinary_forwardBinary: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmbinary_newAdd: () => number;
    readonly wasmbinary_newConcat: (a: number) => number;
    readonly wasmbinary_newMatmul: () => number;
    readonly wasmbinary_newMul: () => number;
    readonly wasmbinary_newSub: () => number;
    readonly wasmbinary_num_params: (a: number) => number;
    readonly wasmcomparison_lessEqual01: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmcomparison_new: () => number;
    readonly wasmconv_forward: (a: number, b: number) => number;
    readonly wasmconv_getWeightsFlat: (a: number) => [number, number, number, number];
    readonly wasmconv_get_state: (a: number) => [number, number, number, number];
    readonly wasmconv_load_state: (a: number, b: number, c: number) => [number, number];
    readonly wasmconv_newConv1d: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly wasmconv_newConv2d: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
    readonly wasmconv_newConvTranspose2d: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
    readonly wasmconv_num_params: (a: number) => number;
    readonly wasmconv_setWeightsFlat: (a: number, b: number, c: number) => [number, number];
    readonly wasmembedding_forward: (a: number, b: number) => number;
    readonly wasmembedding_getWeightsFlat: (a: number) => [number, number, number, number];
    readonly wasmembedding_get_state: (a: number) => [number, number, number, number];
    readonly wasmembedding_load_state: (a: number, b: number, c: number) => [number, number];
    readonly wasmembedding_new: (a: number, b: number) => number;
    readonly wasmembedding_num_params: (a: number) => number;
    readonly wasmembedding_setWeightsFlat: (a: number, b: number, c: number) => [number, number];
    readonly wasmembedding_weightDims: (a: number) => [number, number];
    readonly wasmfeaturenorm_forward: (a: number, b: number) => [number, number, number];
    readonly wasmfeaturenorm_newFeatureNorm: (a: number, b: number) => [number, number, number];
    readonly wasmfeaturenorm_num_params: (a: number) => number;
    readonly wasmghostmodule_forward: (a: number, b: number) => number;
    readonly wasmghostmodule_get_state: (a: number) => [number, number, number, number];
    readonly wasmghostmodule_load_state: (a: number, b: number, c: number) => [number, number];
    readonly wasmghostmodule_num_params: (a: number) => number;
    readonly wasmghostmodule_try_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly wasmindexsource_indicesLike: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmindexsource_new: () => number;
    readonly wasminttensor_byte_length: (a: number) => number;
    readonly wasminttensor_fromNumbers: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasminttensor_new: (a: number, b: number, c: number, d: number) => number;
    readonly wasminttensor_shape: (a: number) => [number, number];
    readonly wasminttensor_to_array: (a: number) => [number, number];
    readonly wasmlinear_forward: (a: number, b: number) => number;
    readonly wasmlinear_getWeightsFlat: (a: number) => [number, number, number, number];
    readonly wasmlinear_get_state: (a: number) => [number, number, number, number];
    readonly wasmlinear_load_state: (a: number, b: number, c: number) => [number, number];
    readonly wasmlinear_new: (a: number, b: number, c: number) => number;
    readonly wasmlinear_num_params: (a: number) => number;
    readonly wasmlinear_setWeightsFlat: (a: number, b: number, c: number) => [number, number];
    readonly wasmlinear_weightDims: (a: number) => [number, number];
    readonly wasmlinearalgebra_cosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmlinearalgebra_dot: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmlinearalgebra_l2Distance: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmlinearalgebra_l2Norm: (a: number, b: number) => [number, number, number];
    readonly wasmlinearalgebra_matmul: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmlinearalgebra_new: () => number;
    readonly wasmmathprogram_fromPlan: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogram_numInputs: (a: number) => number;
    readonly wasmmathprogram_numSlots: (a: number) => number;
    readonly wasmmathprogram_numSteps: (a: number) => number;
    readonly wasmmathprogram_outSlot: (a: number) => number;
    readonly wasmmathprogram_programIdentity: (a: number) => [number, number];
    readonly wasmmathprogram_programPlan: (a: number) => [number, number];
    readonly wasmmathprogram_run1: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogram_run2: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmmathprogrambuilder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogrambuilder_addClamp: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogrambuilder_addCosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogrambuilder_addPermute: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogrambuilder_addReshape: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogrambuilder_addSlice: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmmathprogrambuilder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogrambuilder_compile: (a: number) => [number, number, number];
    readonly wasmmathprogrambuilder_new: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogrambuilder_numInputs: (a: number) => number;
    readonly wasmmathprogrambuilder_numSlots: (a: number) => number;
    readonly wasmmathprogrambuilder_numSteps: (a: number) => number;
    readonly wasmmathprogrambuilder_setOutput: (a: number, b: number) => [number, number];
    readonly wasmmathprogramv4_fromPlan: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv4_numInputs: (a: number) => number;
    readonly wasmmathprogramv4_numSlots: (a: number) => number;
    readonly wasmmathprogramv4_numSteps: (a: number) => number;
    readonly wasmmathprogramv4_outSlot: (a: number) => number;
    readonly wasmmathprogramv4_programIdentity: (a: number) => [number, number];
    readonly wasmmathprogramv4_programPlan: (a: number) => [number, number];
    readonly wasmmathprogramv4_run1: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv4_run2: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmmathprogramv4builder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv4builder_addClamp: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv4builder_addCosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv4builder_addPermute: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv4builder_addReshape: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv4builder_addSelectAxis: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmmathprogramv4builder_addSlice: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmmathprogramv4builder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv4builder_compile: (a: number) => [number, number, number];
    readonly wasmmathprogramv4builder_new: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv4builder_numInputs: (a: number) => number;
    readonly wasmmathprogramv4builder_numSlots: (a: number) => number;
    readonly wasmmathprogramv4builder_numSteps: (a: number) => number;
    readonly wasmmathprogramv4builder_setOutput: (a: number, b: number) => [number, number];
    readonly wasmmathprogramv5_fromPlan: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv5_numInputs: (a: number) => number;
    readonly wasmmathprogramv5_numSlots: (a: number) => number;
    readonly wasmmathprogramv5_numSteps: (a: number) => number;
    readonly wasmmathprogramv5_outSlot: (a: number) => number;
    readonly wasmmathprogramv5_programIdentity: (a: number) => [number, number];
    readonly wasmmathprogramv5_programPlan: (a: number) => [number, number];
    readonly wasmmathprogramv5_run3: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmmathprogramv5_run4: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmmathprogramv5_run5: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly wasmmathprogramv5_run6: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly wasmmathprogramv5_run7: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
    readonly wasmmathprogramv5_run8: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly wasmmathprogramv5builder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv5builder_addClamp: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv5builder_addCosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv5builder_addPermute: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv5builder_addReshape: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv5builder_addSelectAxis: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmmathprogramv5builder_addSlice: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmmathprogramv5builder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv5builder_compile: (a: number) => [number, number, number];
    readonly wasmmathprogramv5builder_new: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv5builder_numInputs: (a: number) => number;
    readonly wasmmathprogramv5builder_numSlots: (a: number) => number;
    readonly wasmmathprogramv5builder_numSteps: (a: number) => number;
    readonly wasmmathprogramv5builder_setOutput: (a: number, b: number) => [number, number];
    readonly wasmmathprogramv6_fromPlan: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv6_numInputs: (a: number) => number;
    readonly wasmmathprogramv6_numSlots: (a: number) => number;
    readonly wasmmathprogramv6_numSteps: (a: number) => number;
    readonly wasmmathprogramv6_outSlot: (a: number) => number;
    readonly wasmmathprogramv6_programIdentity: (a: number) => [number, number];
    readonly wasmmathprogramv6_programPlan: (a: number) => [number, number];
    readonly wasmmathprogramv6_run1: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv6_run2: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmmathprogramv6_run3: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmmathprogramv6_run4: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmmathprogramv6_run5: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly wasmmathprogramv6_run6: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly wasmmathprogramv6_run7: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
    readonly wasmmathprogramv6_run8: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly wasmmathprogramv6builder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv6builder_addClamp: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv6builder_addCosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv6builder_addFillLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv6builder_addPermute: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv6builder_addReshape: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv6builder_addSelectAxis: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmmathprogramv6builder_addSlice: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmmathprogramv6builder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv6builder_compile: (a: number) => [number, number, number];
    readonly wasmmathprogramv6builder_new: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv6builder_numInputs: (a: number) => number;
    readonly wasmmathprogramv6builder_numSlots: (a: number) => number;
    readonly wasmmathprogramv6builder_numSteps: (a: number) => number;
    readonly wasmmathprogramv6builder_setOutput: (a: number, b: number) => [number, number];
    readonly wasmmathprogramv7_fromPlan: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv7_numInputs: (a: number) => number;
    readonly wasmmathprogramv7_numSlots: (a: number) => number;
    readonly wasmmathprogramv7_numSteps: (a: number) => number;
    readonly wasmmathprogramv7_outSlot: (a: number) => number;
    readonly wasmmathprogramv7_programIdentity: (a: number) => [number, number];
    readonly wasmmathprogramv7_programPlan: (a: number) => [number, number];
    readonly wasmmathprogramv7_run1: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv7_run2: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmmathprogramv7_run3: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmmathprogramv7_run4: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmmathprogramv7_run5: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly wasmmathprogramv7_run6: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly wasmmathprogramv7_run7: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
    readonly wasmmathprogramv7_run8: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly wasmmathprogramv7builder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv7builder_addClamp: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv7builder_addCosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv7builder_addExpandLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv7builder_addFillLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv7builder_addPermute: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv7builder_addReshape: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv7builder_addSelectAxis: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmmathprogramv7builder_addSlice: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmmathprogramv7builder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv7builder_compile: (a: number) => [number, number, number];
    readonly wasmmathprogramv7builder_new: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv7builder_numInputs: (a: number) => number;
    readonly wasmmathprogramv7builder_numSlots: (a: number) => number;
    readonly wasmmathprogramv7builder_numSteps: (a: number) => number;
    readonly wasmmathprogramv7builder_setOutput: (a: number, b: number) => [number, number];
    readonly wasmmathprogramv8_fromPlan: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv8_numInputs: (a: number) => number;
    readonly wasmmathprogramv8_numSlots: (a: number) => number;
    readonly wasmmathprogramv8_numSteps: (a: number) => number;
    readonly wasmmathprogramv8_outSlot: (a: number) => number;
    readonly wasmmathprogramv8_programIdentity: (a: number) => [number, number];
    readonly wasmmathprogramv8_programPlan: (a: number) => [number, number];
    readonly wasmmathprogramv8_run1: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv8_run2: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmmathprogramv8_run3: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmmathprogramv8_run4: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmmathprogramv8_run5: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly wasmmathprogramv8_run6: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly wasmmathprogramv8_run7: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
    readonly wasmmathprogramv8_run8: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly wasmmathprogramv8builder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv8builder_addClamp: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv8builder_addCosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv8builder_addExpandLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv8builder_addFillLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv8builder_addMaxAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv8builder_addMeanAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv8builder_addMinAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv8builder_addPermute: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv8builder_addReshape: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv8builder_addSelectAxis: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmmathprogramv8builder_addSlice: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmmathprogramv8builder_addSumAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv8builder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv8builder_compile: (a: number) => [number, number, number];
    readonly wasmmathprogramv8builder_new: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv8builder_numInputs: (a: number) => number;
    readonly wasmmathprogramv8builder_numSlots: (a: number) => number;
    readonly wasmmathprogramv8builder_numSteps: (a: number) => number;
    readonly wasmmathprogramv8builder_setOutput: (a: number, b: number) => [number, number];
    readonly wasmmathprogramv9_fromPlan: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv9_numInputs: (a: number) => number;
    readonly wasmmathprogramv9_numSlots: (a: number) => number;
    readonly wasmmathprogramv9_numSteps: (a: number) => number;
    readonly wasmmathprogramv9_outSlot: (a: number) => number;
    readonly wasmmathprogramv9_programIdentity: (a: number) => [number, number];
    readonly wasmmathprogramv9_programPlan: (a: number) => [number, number];
    readonly wasmmathprogramv9_run1: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv9_run2: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmmathprogramv9_run3: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmmathprogramv9_run4: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmmathprogramv9_run5: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly wasmmathprogramv9_run6: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly wasmmathprogramv9_run7: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
    readonly wasmmathprogramv9_run8: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly wasmmathprogramv9builder_addBinary: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv9builder_addClamp: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv9builder_addCosineSimilarity: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv9builder_addExpandLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addFillLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addIndicesLike: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addLessEqual01: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addMaxAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addMeanAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addMinAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addPermute: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv9builder_addReshape: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly wasmmathprogramv9builder_addSelectAxis: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmmathprogramv9builder_addSlice: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmmathprogramv9builder_addSumAxis: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_addUnary: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmmathprogramv9builder_compile: (a: number) => [number, number, number];
    readonly wasmmathprogramv9builder_new: (a: number, b: number) => [number, number, number];
    readonly wasmmathprogramv9builder_numInputs: (a: number) => number;
    readonly wasmmathprogramv9builder_numSlots: (a: number) => number;
    readonly wasmmathprogramv9builder_numSteps: (a: number) => number;
    readonly wasmmathprogramv9builder_setOutput: (a: number, b: number) => [number, number];
    readonly wasmnorm_forward: (a: number, b: number) => number;
    readonly wasmnorm_getWeightsFlat: (a: number) => [number, number, number, number];
    readonly wasmnorm_get_state: (a: number) => [number, number, number, number];
    readonly wasmnorm_load_state: (a: number, b: number, c: number) => [number, number];
    readonly wasmnorm_new_batch_norm: (a: number, b: number, c: number) => number;
    readonly wasmnorm_new_group_norm: (a: number, b: number, c: number, d: number) => number;
    readonly wasmnorm_new_instance_norm: (a: number, b: number, c: number) => number;
    readonly wasmnorm_new_layer_norm: (a: number, b: number, c: number) => number;
    readonly wasmnorm_new_rms_norm: (a: number, b: number, c: number) => number;
    readonly wasmnorm_num_params: (a: number) => number;
    readonly wasmnorm_setWeightsFlat: (a: number, b: number, c: number) => [number, number];
    readonly wasmnumerickernel_abs: (a: number, b: number) => [number, number, number];
    readonly wasmnumerickernel_add: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmnumerickernel_allFinite: (a: number, b: number) => number;
    readonly wasmnumerickernel_clamp: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmnumerickernel_div: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmnumerickernel_exp: (a: number, b: number) => [number, number, number];
    readonly wasmnumerickernel_log: (a: number, b: number) => [number, number, number];
    readonly wasmnumerickernel_mul: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmnumerickernel_new: () => number;
    readonly wasmnumerickernel_sqrt: (a: number, b: number) => [number, number, number];
    readonly wasmnumerickernel_sub: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmpool_forward: (a: number, b: number) => number;
    readonly wasmpool_newAdaptiveAvgPool2d: (a: number, b: number) => number;
    readonly wasmpool_newAvgPool1d: (a: number, b: number, c: number) => number;
    readonly wasmpool_newAvgPool2d: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly wasmpool_newMaxPool1d: (a: number, b: number, c: number) => number;
    readonly wasmpool_newMaxPool2d: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly wasmpool_num_params: (a: number) => number;
    readonly wasmprobability_crossEntropy: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmprobability_entropy: (a: number, b: number) => [number, number, number];
    readonly wasmprobability_klDivergence: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmprobability_new: () => number;
    readonly wasmprobability_normalize: (a: number, b: number) => [number, number, number];
    readonly wasmreduction_maxAxis: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmreduction_meanAxis: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmreduction_minAxis: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmreduction_new: () => number;
    readonly wasmreduction_sumAxis: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmseblock_forward: (a: number, b: number) => number;
    readonly wasmseblock_get_state: (a: number) => [number, number, number, number];
    readonly wasmseblock_load_state: (a: number, b: number, c: number) => [number, number];
    readonly wasmseblock_num_params: (a: number) => number;
    readonly wasmseblock_try_new: (a: number, b: number) => [number, number, number];
    readonly wasmshift_forward: (a: number, b: number) => number;
    readonly wasmshift_newShiftDown: (a: number) => number;
    readonly wasmshift_newShiftLeft: (a: number) => number;
    readonly wasmshift_newShiftRight: (a: number) => number;
    readonly wasmshift_newShiftUp: (a: number) => number;
    readonly wasmshift_num_params: (a: number) => number;
    readonly wasmstatistics_max: (a: number, b: number) => [number, number, number];
    readonly wasmstatistics_mean: (a: number, b: number) => [number, number, number];
    readonly wasmstatistics_min: (a: number, b: number) => [number, number, number];
    readonly wasmstatistics_new: () => number;
    readonly wasmstatistics_stdPopulation: (a: number, b: number) => [number, number, number];
    readonly wasmstatistics_sum: (a: number, b: number) => [number, number, number];
    readonly wasmstatistics_variancePopulation: (a: number, b: number) => [number, number, number];
    readonly wasmtensor_byte_length: (a: number) => number;
    readonly wasmtensor_fromTensorView: (a: number) => number;
    readonly wasmtensor_new: (a: number, b: number, c: number, d: number) => number;
    readonly wasmtensor_shape: (a: number) => [number, number];
    readonly wasmtensor_toTensorView: (a: number, b: number) => [number, number];
    readonly wasmtensor_to_array: (a: number) => [number, number];
    readonly wasmtensortransform_new: () => number;
    readonly wasmtensortransform_permute: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmtensortransform_reshape: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly wasmtensortransform_selectAxis: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmtensortransform_slice: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly wasmtensortransform_transpose: (a: number, b: number) => number;
    readonly workspaceBindInputContract: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number];
    readonly workspaceBindInputPortMetadata: (a: number, b: number, c: number, d: number, e: number, f: bigint, g: number, h: number) => [number, number, number];
    readonly workspaceBindRuntimeDirectMathOperation: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number, number, number];
    readonly workspaceBindRuntimeMathProgramPlan: (a: number, b: number, c: number) => [number, number, number, number];
    readonly workspaceBindRuntimeSubject: (a: number, b: number, c: number, d: bigint, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: bigint, n: number) => [number, number, number];
    readonly workspaceCapabilities: () => [number, number];
    readonly workspaceClearInputContract: (a: number) => number;
    readonly workspaceClearInputPortMetadata: (a: number) => number;
    readonly workspaceCompile: (a: number, b: number, c: number) => [number, number, number];
    readonly workspaceCompileForRuntimeSubject: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly workspaceInitBinary: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
    readonly workspaceInitUnary: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly workspaceInputContract: (a: number) => [number, number];
    readonly workspaceInputPortMetadata: (a: number) => [number, number];
    readonly workspaceProofLedger: (a: number) => [number, number];
    readonly workspaceRecordAttestation: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly workspaceRuntimeProgramBinding: (a: number, b: number) => [number, number];
    readonly workspaceRuntimeSubject: (a: number) => [number, number];
    readonly workspaceVerifyDirectMath1Receipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number, number, number];
    readonly workspaceVerifyDirectMath2Receipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => [number, number, number, number];
    readonly workspaceVerifyGraphReceipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number, number];
    readonly workspaceVerifyMathProgram1Receipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number, number];
    readonly workspaceVerifyMathProgram2Receipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number, number, number];
    readonly workspaceVerifySemanticGraphReceipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number, number, number];
    readonly workspaceVerifyVectorReceipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number, number];
    readonly workspaceWireBinary: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
    readonly workspaceWireUnary: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
