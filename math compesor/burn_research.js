/* @ts-self-types="./burn_research.d.ts" */

export class AgentGraphBuilder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AgentGraphBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_agentgraphbuilder_free(ptr, 0);
    }
    /**
     * @param {AgentLayerSpec} spec
     * @param {number} left_slot
     * @param {number} right_slot
     * @param {number} output_slot
     */
    addBinary(spec, left_slot, right_slot, output_slot) {
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.agentgraphbuilder_addBinary(this.__wbg_ptr, spec.__wbg_ptr, left_slot, right_slot, output_slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {AgentLayerSpec} spec
     * @param {number} input_slot
     * @param {number} output_slot
     */
    addUnary(spec, input_slot, output_slot) {
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.agentgraphbuilder_addUnary(this.__wbg_ptr, spec.__wbg_ptr, input_slot, output_slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Compile using a temporary output selection without mutating the builder's configured output.
     * This is the canonical path for stateless workspace orchestration.
     * @param {LayerRegistry} registry
     * @param {number} output_slot
     * @returns {CompiledGraph}
     */
    compileWithOutput(registry, output_slot) {
        _assertClass(registry, LayerRegistry);
        const ret = wasm.agentgraphbuilder_compileWithOutput(this.__wbg_ptr, registry.__wbg_ptr, output_slot);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return CompiledGraph.__wrap(ret[0]);
    }
    /**
     * @param {LayerRegistry} registry
     * @returns {CompiledGraph}
     */
    compile(registry) {
        _assertClass(registry, LayerRegistry);
        const ret = wasm.agentgraphbuilder_compile(this.__wbg_ptr, registry.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return CompiledGraph.__wrap(ret[0]);
    }
    /**
     * @returns {MultiInputGraphPlan}
     */
    multiInputPlanV1() {
        const ret = wasm.agentgraphbuilder_multiInputPlanV1(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return MultiInputGraphPlan.__wrap(ret[0]);
    }
    /**
     * @param {number} num_slots
     */
    constructor(num_slots) {
        const ret = wasm.agentgraphbuilder_new(num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        AgentGraphBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.agentgraphbuilder_numSlots(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.agentgraphbuilder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} output_slot
     */
    setOutput(output_slot) {
        const ret = wasm.agentgraphbuilder_setOutput(this.__wbg_ptr, output_slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) AgentGraphBuilder.prototype[Symbol.dispose] = AgentGraphBuilder.prototype.free;

export class AgentLayerSpec {
    static __wrap(ptr) {
        const obj = Object.create(AgentLayerSpec.prototype);
        obj.__wbg_ptr = ptr;
        AgentLayerSpecFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AgentLayerSpecFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_agentlayerspec_free(ptr, 0);
    }
    /**
     * @param {number} layer_id
     * @param {number} output_h
     * @param {number} output_w
     * @returns {AgentLayerSpec}
     */
    static adaptiveAvgPool2d(layer_id, output_h, output_w) {
        const ret = wasm.agentlayerspec_adaptiveAvgPool2d(layer_id, output_h, output_w);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static add(layer_id) {
        const ret = wasm.agentlayerspec_add(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} kernel
     * @param {number | null} [stride]
     * @param {number | null} [padding]
     * @returns {AgentLayerSpec}
     */
    static avgPool1d(layer_id, kernel, stride, padding) {
        const ret = wasm.agentlayerspec_avgPool1d(layer_id, kernel, isLikeNone(stride) ? Number.MAX_SAFE_INTEGER : (stride) >>> 0, isLikeNone(padding) ? Number.MAX_SAFE_INTEGER : (padding) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} kernel_h
     * @param {number} kernel_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {AgentLayerSpec}
     */
    static avgPool2d(layer_id, kernel_h, kernel_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.agentlayerspec_avgPool2d(layer_id, kernel_h, kernel_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} num_features
     * @param {number | null} [epsilon]
     * @returns {AgentLayerSpec}
     */
    static batchNorm(layer_id, num_features, epsilon) {
        const ret = wasm.agentlayerspec_batchNorm(layer_id, num_features, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} dim
     * @returns {AgentLayerSpec}
     */
    static concat(layer_id, dim) {
        const ret = wasm.agentlayerspec_concat(layer_id, dim);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_size
     * @param {number | null} [stride]
     * @param {number | null} [padding]
     * @returns {AgentLayerSpec}
     */
    static conv1d(layer_id, in_channels, out_channels, kernel_size, stride, padding) {
        const ret = wasm.agentlayerspec_conv1d(layer_id, in_channels, out_channels, kernel_size, isLikeNone(stride) ? Number.MAX_SAFE_INTEGER : (stride) >>> 0, isLikeNone(padding) ? Number.MAX_SAFE_INTEGER : (padding) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_h
     * @param {number} kernel_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {AgentLayerSpec}
     */
    static conv2d(layer_id, in_channels, out_channels, kernel_h, kernel_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.agentlayerspec_conv2d(layer_id, in_channels, out_channels, kernel_h, kernel_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_h
     * @param {number} kernel_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {AgentLayerSpec}
     */
    static convTranspose2d(layer_id, in_channels, out_channels, kernel_h, kernel_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.agentlayerspec_convTranspose2d(layer_id, in_channels, out_channels, kernel_h, kernel_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} vocab_size
     * @param {number} d_model
     * @returns {AgentLayerSpec}
     */
    static embedding(layer_id, vocab_size, d_model) {
        const ret = wasm.agentlayerspec_embedding(layer_id, vocab_size, d_model);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number | null} [epsilon]
     * @returns {AgentLayerSpec}
     */
    static featureNorm(layer_id, epsilon) {
        const ret = wasm.agentlayerspec_featureNorm(layer_id, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static gelu(layer_id) {
        const ret = wasm.agentlayerspec_gelu(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_h
     * @param {number} kernel_w
     * @param {number} ratio
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {AgentLayerSpec}
     */
    static ghost(layer_id, in_channels, out_channels, kernel_h, kernel_w, ratio, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.agentlayerspec_ghost(layer_id, in_channels, out_channels, kernel_h, kernel_w, ratio, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} dim
     * @returns {AgentLayerSpec}
     */
    static glu(layer_id, dim) {
        const ret = wasm.agentlayerspec_glu(layer_id, dim);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} num_groups
     * @param {number} num_channels
     * @param {number | null} [epsilon]
     * @returns {AgentLayerSpec}
     */
    static groupNorm(layer_id, num_groups, num_channels, epsilon) {
        const ret = wasm.agentlayerspec_groupNorm(layer_id, num_groups, num_channels, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} alpha
     * @param {number} beta
     * @returns {AgentLayerSpec}
     */
    static hardSigmoid(layer_id, alpha, beta) {
        const ret = wasm.agentlayerspec_hardSigmoid(layer_id, alpha, beta);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static hardSwish(layer_id) {
        const ret = wasm.agentlayerspec_hardSwish(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} num_channels
     * @param {number | null} [epsilon]
     * @returns {AgentLayerSpec}
     */
    static instanceNorm(layer_id, num_channels, epsilon) {
        const ret = wasm.agentlayerspec_instanceNorm(layer_id, num_channels, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static intAdd(layer_id) {
        const ret = wasm.agentlayerspec_intAdd(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static intFromFloat(layer_id) {
        const ret = wasm.agentlayerspec_intFromFloat(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static intMatmul(layer_id) {
        const ret = wasm.agentlayerspec_intMatmul(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static intMul(layer_id) {
        const ret = wasm.agentlayerspec_intMul(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static intSub(layer_id) {
        const ret = wasm.agentlayerspec_intSub(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static intToFloat(layer_id) {
        const ret = wasm.agentlayerspec_intToFloat(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    layerId() {
        const ret = wasm.agentlayerspec_layerId(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} layer_id
     * @param {number} size
     * @param {number | null} [epsilon]
     * @returns {AgentLayerSpec}
     */
    static layerNorm(layer_id, size, epsilon) {
        const ret = wasm.agentlayerspec_layerNorm(layer_id, size, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    layerType() {
        const ret = wasm.agentlayerspec_layerType(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} layer_id
     * @param {number} negative_slope
     * @returns {AgentLayerSpec}
     */
    static leakyRelu(layer_id, negative_slope) {
        const ret = wasm.agentlayerspec_leakyRelu(layer_id, negative_slope);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} in_dim
     * @param {number} out_dim
     * @param {boolean} bias
     * @returns {AgentLayerSpec}
     */
    static linear(layer_id, in_dim, out_dim, bias) {
        const ret = wasm.agentlayerspec_linear(layer_id, in_dim, out_dim, bias);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} dim
     * @returns {AgentLayerSpec}
     */
    static logSoftmax(layer_id, dim) {
        const ret = wasm.agentlayerspec_logSoftmax(layer_id, dim);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static matmul(layer_id) {
        const ret = wasm.agentlayerspec_matmul(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} kernel
     * @param {number | null} [stride]
     * @param {number | null} [padding]
     * @returns {AgentLayerSpec}
     */
    static maxPool1d(layer_id, kernel, stride, padding) {
        const ret = wasm.agentlayerspec_maxPool1d(layer_id, kernel, isLikeNone(stride) ? Number.MAX_SAFE_INTEGER : (stride) >>> 0, isLikeNone(padding) ? Number.MAX_SAFE_INTEGER : (padding) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} kernel_h
     * @param {number} kernel_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {AgentLayerSpec}
     */
    static maxPool2d(layer_id, kernel_h, kernel_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.agentlayerspec_maxPool2d(layer_id, kernel_h, kernel_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static mish(layer_id) {
        const ret = wasm.agentlayerspec_mish(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static mul(layer_id) {
        const ret = wasm.agentlayerspec_mul(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} num_parameters
     * @param {number} alpha
     * @returns {AgentLayerSpec}
     */
    static prelu(layer_id, num_parameters, alpha) {
        const ret = wasm.agentlayerspec_prelu(layer_id, num_parameters, alpha);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static relu(layer_id) {
        const ret = wasm.agentlayerspec_relu(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} size
     * @param {number | null} [epsilon]
     * @returns {AgentLayerSpec}
     */
    static rmsNorm(layer_id, size, epsilon) {
        const ret = wasm.agentlayerspec_rmsNorm(layer_id, size, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} channels
     * @param {number} reduction
     * @returns {AgentLayerSpec}
     */
    static seBlock(layer_id, channels, reduction) {
        const ret = wasm.agentlayerspec_seBlock(layer_id, channels, reduction);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} shift_size
     * @returns {AgentLayerSpec}
     */
    static shiftDown(layer_id, shift_size) {
        const ret = wasm.agentlayerspec_shiftDown(layer_id, shift_size);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} shift_size
     * @returns {AgentLayerSpec}
     */
    static shiftLeft(layer_id, shift_size) {
        const ret = wasm.agentlayerspec_shiftLeft(layer_id, shift_size);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} shift_size
     * @returns {AgentLayerSpec}
     */
    static shiftRight(layer_id, shift_size) {
        const ret = wasm.agentlayerspec_shiftRight(layer_id, shift_size);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} shift_size
     * @returns {AgentLayerSpec}
     */
    static shiftUp(layer_id, shift_size) {
        const ret = wasm.agentlayerspec_shiftUp(layer_id, shift_size);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static sigmoid(layer_id) {
        const ret = wasm.agentlayerspec_sigmoid(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} dim
     * @returns {AgentLayerSpec}
     */
    static softmax(layer_id, dim) {
        const ret = wasm.agentlayerspec_softmax(layer_id, dim);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} beta
     * @returns {AgentLayerSpec}
     */
    static softplus(layer_id, beta) {
        const ret = wasm.agentlayerspec_softplus(layer_id, beta);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static sub(layer_id) {
        const ret = wasm.agentlayerspec_sub(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} d_input
     * @param {number} d_output
     * @param {boolean} bias
     * @returns {AgentLayerSpec}
     */
    static swiGlu(layer_id, d_input, d_output, bias) {
        const ret = wasm.agentlayerspec_swiGlu(layer_id, d_input, d_output, bias);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @returns {AgentLayerSpec}
     */
    static tanh(layer_id) {
        const ret = wasm.agentlayerspec_tanh(layer_id);
        return AgentLayerSpec.__wrap(ret);
    }
    /**
     * @param {number} layer_id
     * @param {number} dim0
     * @param {number} dim1
     * @returns {AgentLayerSpec}
     */
    static transpose(layer_id, dim0, dim1) {
        const ret = wasm.agentlayerspec_transpose(layer_id, dim0, dim1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AgentLayerSpec.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    variant() {
        const ret = wasm.agentlayerspec_variant(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) AgentLayerSpec.prototype[Symbol.dispose] = AgentLayerSpec.prototype.free;

export class AgentWorkspace {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AgentWorkspaceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_agentworkspace_free(ptr, 0);
    }
    /**
     * Forget only workspace metadata. This never mutates LayerRegistry.
     * @param {number} layer_id
     * @returns {boolean}
     */
    forgetLayer(layer_id) {
        const ret = wasm.agentworkspace_forgetLayer(this.__wbg_ptr, layer_id);
        return ret !== 0;
    }
    /**
     * @param {string} table
     * @param {string} key
     * @returns {string}
     */
    get(table, key) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(table, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.agentworkspace_get(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            deferred3_0 = ret[0];
            deferred3_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Return the explicit metadata quotas for agent planning.
     * @returns {string}
     */
    limits() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.agentworkspace_limits(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {number} num_slots
     */
    constructor(num_slots) {
        const ret = wasm.agentworkspace_new(num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        AgentWorkspaceFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Generic user-space row upsert. Tables prefixed with `_` are reserved for workspace internals.
     * @param {string} table
     * @param {string} key
     * @param {string} kind
     * @param {string} state
     * @param {string} value
     */
    put(table, key, kind, state, value) {
        const ptr0 = passStringToWasm0(table, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(state, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.agentworkspace_put(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Query any table, including read-only inspection of internal tables.
     * @param {string} table
     * @param {string | null} [kind]
     * @param {string | null} [state]
     * @returns {string}
     */
    query(table, kind, state) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(table, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(kind) ? 0 : passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ptr2 = isLikeNone(state) ? 0 : passStringToWasm0(state, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len2 = WASM_VECTOR_LEN;
            const ret = wasm.agentworkspace_query(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            deferred4_0 = ret[0];
            deferred4_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * @param {string} kind
     * @param {string} reference
     * @param {string} detail
     * @returns {number}
     */
    recordEvent(kind, reference, detail) {
        const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(reference, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(detail, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.agentworkspace_recordEvent(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {string} label
     * @param {boolean} passed
     * @param {number} max_error
     * @param {string} detail
     * @returns {number}
     */
    recordProof(label, passed, max_error, detail) {
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(detail, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.agentworkspace_recordProof(this.__wbg_ptr, ptr0, len0, passed, max_error, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {number} slot
     */
    releaseSlot(slot) {
        const ret = wasm.agentworkspace_releaseSlot(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} table
     * @param {string} key
     * @returns {boolean}
     */
    remove(table, key) {
        const ptr0 = passStringToWasm0(table, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.agentworkspace_remove(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @param {LayerRegistry} registry
     * @param {string} label
     * @returns {number}
     */
    reserveLayerId(registry, label) {
        _assertClass(registry, LayerRegistry);
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.agentworkspace_reserveLayerId(this.__wbg_ptr, registry.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {string} owner
     * @returns {number}
     */
    reserveSlot(owner) {
        const ptr0 = passStringToWasm0(owner, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.agentworkspace_reserveSlot(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @returns {string}
     */
    snapshot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.agentworkspace_snapshot(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Reconcile a typed layer with the actual registry after caller initializes it manually.
     * @param {LayerRegistry} registry
     * @param {AgentLayerSpec} spec
     * @param {string} label
     */
    syncLayer(registry, spec, label) {
        _assertClass(registry, LayerRegistry);
        _assertClass(spec, AgentLayerSpec);
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.agentworkspace_syncLayer(this.__wbg_ptr, registry.__wbg_ptr, spec.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {string}
     */
    tableNames() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.agentworkspace_tableNames(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) AgentWorkspace.prototype[Symbol.dispose] = AgentWorkspace.prototype.free;

export class CheckpointBranchSet {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CheckpointBranchSetFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_checkpointbranchset_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    baselineBundle() {
        const ret = wasm.checkpointbranchset_baselineBundle(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    baselineStateDigest() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.checkpointbranchset_baselineStateDigest(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    branchCount() {
        const ret = wasm.checkpointbranchset_branchCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {string} branch_id
     * @returns {Uint8Array}
     */
    candidateBundle(branch_id) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_candidateBundle(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
    /**
     * @param {string} branch_id
     * @param {LayerRegistry} live_registry
     * @param {CompiledMultiInputGraph} live_graph
     * @param {string} expected_program_identity
     * @param {string} expected_state_digest
     * @param {string} receipt_digest
     * @param {boolean} authorize
     * @returns {CompiledMultiInputGraph}
     */
    commitBranchByReceipt(branch_id, live_registry, live_graph, expected_program_identity, expected_state_digest, receipt_digest, authorize) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(live_registry, LayerRegistry);
        _assertClass(live_graph, CompiledMultiInputGraph);
        const ptr1 = passStringToWasm0(expected_program_identity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(expected_state_digest, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(receipt_digest, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_commitBranchByReceipt(this.__wbg_ptr, ptr0, len0, live_registry.__wbg_ptr, live_graph.__wbg_ptr, ptr1, len1, ptr2, len2, ptr3, len3, authorize);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return CompiledMultiInputGraph.__wrap(ret[0]);
    }
    /**
     * @param {string} branch_id
     * @returns {number}
     */
    fork(branch_id) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_fork(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {string} branch_id
     * @param {number} index
     * @param {AgentLayerSpec} spec
     * @param {number} first
     * @param {number} second
     * @param {number} output
     */
    insertStep(branch_id, index, spec, first, second, output) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.checkpointbranchset_insertStep(this.__wbg_ptr, ptr0, len0, index, spec.__wbg_ptr, first, second, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {LayerRegistry} registry
     * @param {CompiledMultiInputGraph} graph
     * @param {string} expected_program_identity
     * @param {string} expected_state_digest
     */
    constructor(registry, graph, expected_program_identity, expected_state_digest) {
        _assertClass(registry, LayerRegistry);
        _assertClass(graph, CompiledMultiInputGraph);
        const ptr0 = passStringToWasm0(expected_program_identity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(expected_state_digest, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_new(registry.__wbg_ptr, graph.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        CheckpointBranchSetFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string | undefined}
     */
    promotedBranch() {
        const ret = wasm.checkpointbranchset_promotedBranch(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]);
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string} branch_id
     * @param {number} index
     * @param {number} first
     * @param {number} second
     * @param {number} output
     */
    reconnectStep(branch_id, index, first, second, output) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_reconnectStep(this.__wbg_ptr, ptr0, len0, index, first, second, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} branch_id
     * @param {number} index
     */
    removeStep(branch_id, index) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_removeStep(this.__wbg_ptr, ptr0, len0, index);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} branch_id
     * @param {number} index
     * @param {AgentLayerSpec} spec
     * @param {number} first
     * @param {number} second
     * @param {number} output
     */
    replaceStep(branch_id, index, spec, first, second, output) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.checkpointbranchset_replaceStep(this.__wbg_ptr, ptr0, len0, index, spec.__wbg_ptr, first, second, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} branch_id
     * @param {number} output
     */
    setOutput(branch_id, output) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_setOutput(this.__wbg_ptr, ptr0, len0, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} branch_id
     * @param {number} layer_type
     * @param {number} layer_id
     * @param {Float32Array} values
     */
    setWeightsFlat(branch_id, layer_type, layer_id, values) {
        const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(values, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.checkpointbranchset_setWeightsFlat(this.__wbg_ptr, ptr0, len0, layer_type, layer_id, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} branch_id
     * @returns {string}
     */
    stageBranch(branch_id) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.checkpointbranchset_stageBranch(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @param {string} branch_id
     * @returns {string}
     */
    stateDiff(branch_id) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.checkpointbranchset_stateDiff(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @param {string} branch_id
     * @param {MultiInputVerificationCases} cases
     * @param {number} abs_tol
     * @param {number} rel_tol
     * @returns {string}
     */
    verifyBranch(branch_id, cases, abs_tol, rel_tol) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(branch_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            _assertClass(cases, MultiInputVerificationCases);
            const ret = wasm.checkpointbranchset_verifyBranch(this.__wbg_ptr, ptr0, len0, cases.__wbg_ptr, abs_tol, rel_tol);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
}
if (Symbol.dispose) CheckpointBranchSet.prototype[Symbol.dispose] = CheckpointBranchSet.prototype.free;

export class CompiledGraph {
    static __wrap(ptr) {
        const obj = Object.create(CompiledGraph.prototype);
        obj.__wbg_ptr = ptr;
        CompiledGraphFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CompiledGraphFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_compiledgraph_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.compiledgraph_numSlots(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.compiledgraph_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.compiledgraph_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.compiledgraph_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.compiledgraph_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {LayerRegistry} registry
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    run(registry, input) {
        _assertClass(registry, LayerRegistry);
        _assertClass(input, WasmTensor);
        const ret = wasm.compiledgraph_run(this.__wbg_ptr, registry.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {LayerRegistry} registry
     */
    validateRegistryBinding(registry) {
        _assertClass(registry, LayerRegistry);
        const ret = wasm.compiledgraph_validateRegistryBinding(this.__wbg_ptr, registry.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {LayerRegistry} registry
     * @param {WasmTensor} input
     * @param {Float32Array} candidate
     * @param {number} abs_tol
     * @param {number} rel_tol
     * @returns {string}
     */
    verifyFlat(registry, input, candidate, abs_tol, rel_tol) {
        let deferred3_0;
        let deferred3_1;
        try {
            _assertClass(registry, LayerRegistry);
            _assertClass(input, WasmTensor);
            const ptr0 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.compiledgraph_verifyFlat(this.__wbg_ptr, registry.__wbg_ptr, input.__wbg_ptr, ptr0, len0, abs_tol, rel_tol);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
}
if (Symbol.dispose) CompiledGraph.prototype[Symbol.dispose] = CompiledGraph.prototype.free;

export class CompiledMultiInputGraph {
    static __wrap(ptr) {
        const obj = Object.create(CompiledMultiInputGraph.prototype);
        obj.__wbg_ptr = ptr;
        CompiledMultiInputGraphFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CompiledMultiInputGraphFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_compiledmultiinputgraph_free(ptr, 0);
    }
    /**
     * @param {LayerRegistry} registry
     * @returns {string}
     */
    explainPlan(registry) {
        let deferred1_0;
        let deferred1_1;
        try {
            _assertClass(registry, LayerRegistry);
            const ret = wasm.compiledmultiinputgraph_explainPlan(this.__wbg_ptr, registry.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    inputPlanV1() {
        const ret = wasm.compiledmultiinputgraph_inputPlanV1(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {LayerRegistry} registry
     * @param {MultiInputInputBundle} bundle
     * @returns {string}
     */
    preflight(registry, bundle) {
        let deferred1_0;
        let deferred1_1;
        try {
            _assertClass(registry, LayerRegistry);
            _assertClass(bundle, MultiInputInputBundle);
            const ret = wasm.compiledmultiinputgraph_preflight(this.__wbg_ptr, registry.__wbg_ptr, bundle.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.compiledmultiinputgraph_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.compiledmultiinputgraph_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    requiredInputSlots() {
        const ret = wasm.compiledmultiinputgraph_requiredInputSlots(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {LayerRegistry} registry
     * @param {MultiInputInputBundle} bundle
     * @param {number} start_step
     * @param {number} max_steps
     * @param {number} max_tensor_bytes
     * @returns {TracedMultiInputRun}
     */
    runWithTrace(registry, bundle, start_step, max_steps, max_tensor_bytes) {
        _assertClass(registry, LayerRegistry);
        _assertClass(bundle, MultiInputInputBundle);
        const ret = wasm.compiledmultiinputgraph_runWithTrace(this.__wbg_ptr, registry.__wbg_ptr, bundle.__wbg_ptr, start_step, max_steps, max_tensor_bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TracedMultiInputRun.__wrap(ret[0]);
    }
    /**
     * @param {LayerRegistry} registry
     * @param {MultiInputInputBundle} bundle
     * @returns {WasmTensor}
     */
    run(registry, bundle) {
        _assertClass(registry, LayerRegistry);
        _assertClass(bundle, MultiInputInputBundle);
        const ret = wasm.compiledmultiinputgraph_run(this.__wbg_ptr, registry.__wbg_ptr, bundle.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {LayerRegistry} registry
     */
    validateRegistryBinding(registry) {
        _assertClass(registry, LayerRegistry);
        const ret = wasm.compiledmultiinputgraph_validateRegistryBinding(this.__wbg_ptr, registry.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {LayerRegistry} registry
     * @param {MultiInputInputBundle} bundle
     * @param {Float32Array} candidate
     * @param {number} abs_tol
     * @param {number} rel_tol
     * @returns {string}
     */
    verifyFlat(registry, bundle, candidate, abs_tol, rel_tol) {
        let deferred3_0;
        let deferred3_1;
        try {
            _assertClass(registry, LayerRegistry);
            _assertClass(bundle, MultiInputInputBundle);
            const ptr0 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.compiledmultiinputgraph_verifyFlat(this.__wbg_ptr, registry.__wbg_ptr, bundle.__wbg_ptr, ptr0, len0, abs_tol, rel_tol);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
}
if (Symbol.dispose) CompiledMultiInputGraph.prototype[Symbol.dispose] = CompiledMultiInputGraph.prototype.free;

export class EsOptimizer {
    static __wrap(ptr) {
        const obj = Object.create(EsOptimizer.prototype);
        obj.__wbg_ptr = ptr;
        EsOptimizerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EsOptimizerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_esoptimizer_free(ptr, 0);
    }
    /**
     * Minta kandidat generasi ini. Mengembalikan Float32Array flat (n_kandidat * dim).
     * JS slice per `dim()`. Panggil `tell()` sesudahnya dengan fitness seurut kandidat.
     * Memanggil ask lagi sebelum tell diperbolehkan: batch sebelumnya dianggap dibatalkan.
     * @returns {Float32Array}
     */
    ask() {
        const ret = wasm.esoptimizer_ask(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    batchSize() {
        const ret = wasm.esoptimizer_batchSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Vektor terbaik sepanjang pelatihan (Float32Array).
     * @returns {Float32Array}
     */
    best() {
        const ret = wasm.esoptimizer_best(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    dim() {
        const ret = wasm.esoptimizer_dim(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    generation() {
        const ret = wasm.esoptimizer_generation(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Rata-rata populasi saat ini (Float32Array).
     * @returns {Float32Array}
     */
    mean() {
        const ret = wasm.esoptimizer_mean(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Legacy forgiving constructor retained for compatibility.
     *
     * It clamps dim/pop and falls back unknown strategies to OpenES. Agent/proof workflows
     * should prefer `EsOptimizer.strict(...)`, whose invalid configurations are controlled errors.
     * @param {number} dim
     * @param {number} strategy
     * @param {number} seed
     * @param {number | null} [pop]
     * @param {number | null} [sigma]
     * @param {number | null} [lr]
     */
    constructor(dim, strategy, seed, pop, sigma, lr) {
        const ret = wasm.esoptimizer_new(dim, strategy, seed, isLikeNone(pop) ? Number.MAX_SAFE_INTEGER : (pop) >>> 0, isLikeNone(sigma) ? Number.MAX_SAFE_INTEGER : Math.fround(sigma), isLikeNone(lr) ? Number.MAX_SAFE_INTEGER : Math.fround(lr));
        this.__wbg_ptr = ret;
        EsOptimizerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Laporan JSON generasi terakhir.
     * @returns {string}
     */
    report() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.esoptimizer_report(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Proof-of-life mandiri untuk problem linear tetap `in=3, out=2`.
     *
     * Contract: optimizer harus dibuat dengan `dim == 6` dan `gens > 0`.
     * Pelanggaran contract atau kegagalan internal `tell()` dikembalikan sebagai error
     * (menjadi exception terkontrol pada boundary JavaScript/WASM), bukan report kosong/stale.
     * @param {number} gens
     * @returns {string}
     */
    runLinearDemo(gens) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.esoptimizer_runLinearDemo(this.__wbg_ptr, gens);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Change OpenES learning rate without resetting search state.
     *
     * Mutation is valid only between completed generations. If an ask() batch
     * is still awaiting fitness, reject without consuming or replacing it.
     * @param {number} lr
     */
    setLearningRate(lr) {
        const ret = wasm.esoptimizer_setLearningRate(this.__wbg_ptr, lr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Strict proof-boundary factory. Unlike the legacy constructor, this never silently
     * repairs dimensions/population, never falls back an unknown strategy, and rejects
     * non-finite/non-positive numerical hyperparameters before optimizer state is created.
     * @param {number} dim
     * @param {number} strategy
     * @param {number} seed
     * @param {number | null} [pop]
     * @param {number | null} [sigma]
     * @param {number | null} [lr]
     * @returns {EsOptimizer}
     */
    static strict(dim, strategy, seed, pop, sigma, lr) {
        const ret = wasm.esoptimizer_strict(dim, strategy, seed, isLikeNone(pop) ? Number.MAX_SAFE_INTEGER : (pop) >>> 0, isLikeNone(sigma) ? Number.MAX_SAFE_INTEGER : Math.fround(sigma), isLikeNone(lr) ? Number.MAX_SAFE_INTEGER : Math.fround(lr));
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return EsOptimizer.__wrap(ret[0]);
    }
    /**
     * Serahkan fitness (seurut kandidat ask). Mengembalikan laporan JSON generasi ini.
     * Boundary contract: tell hanya sah setelah ask, cardinality harus tepat, dan semua fitness finite.
     * @param {Float32Array} fitnesses
     * @returns {string}
     */
    tell(fitnesses) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passArrayF32ToWasm0(fitnesses, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.esoptimizer_tell(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Strict factory dengan pilihan PRNG eksplisit (#14).
     *
     * `rng_kind`: 0 = mulberry32 (default lama), 1 = pcg32, 2 = philox4x32.
     * Tidak seperti `new`, factory ini TIDAK pernah memperbaiki diam-diam:
     * `rng_kind` tak dikenal, strategi tak dikenal, dan hiperparameter
     * invalid semuanya menjadi `Err` yang menyebut pelakunya.
     * @param {number} dim
     * @param {number} strategy
     * @param {number} seed
     * @param {number} rng_kind
     * @param {number | null} [pop]
     * @param {number | null} [sigma]
     * @param {number | null} [lr]
     * @returns {EsOptimizer}
     */
    static withRng(dim, strategy, seed, rng_kind, pop, sigma, lr) {
        const ret = wasm.esoptimizer_withRng(dim, strategy, seed, rng_kind, isLikeNone(pop) ? Number.MAX_SAFE_INTEGER : (pop) >>> 0, isLikeNone(sigma) ? Number.MAX_SAFE_INTEGER : Math.fround(sigma), isLikeNone(lr) ? Number.MAX_SAFE_INTEGER : Math.fround(lr));
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return EsOptimizer.__wrap(ret[0]);
    }
}
if (Symbol.dispose) EsOptimizer.prototype[Symbol.dispose] = EsOptimizer.prototype.free;

export class GraphMutationTransaction {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GraphMutationTransactionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_graphmutationtransaction_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    baselineBundle() {
        const ret = wasm.graphmutationtransaction_baselineBundle(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    baselineStateDigest() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.graphmutationtransaction_baselineStateDigest(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    candidateBundle() {
        const ret = wasm.graphmutationtransaction_candidateBundle(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {LayerRegistry} live_registry
     * @param {CompiledMultiInputGraph} live_graph
     * @param {string} expected_program_identity
     * @param {string} expected_state_digest
     * @param {string} receipt_digest
     * @param {boolean} authorize
     * @returns {CompiledMultiInputGraph}
     */
    commitByReceipt(live_registry, live_graph, expected_program_identity, expected_state_digest, receipt_digest, authorize) {
        _assertClass(live_registry, LayerRegistry);
        _assertClass(live_graph, CompiledMultiInputGraph);
        const ptr0 = passStringToWasm0(expected_program_identity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(expected_state_digest, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(receipt_digest, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.graphmutationtransaction_commitByReceipt(this.__wbg_ptr, live_registry.__wbg_ptr, live_graph.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, authorize);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return CompiledMultiInputGraph.__wrap(ret[0]);
    }
    /**
     * @param {number} index
     * @param {AgentLayerSpec} spec
     * @param {number} first
     * @param {number} second
     * @param {number} output
     */
    insertStep(index, spec, first, second, output) {
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.graphmutationtransaction_insertStep(this.__wbg_ptr, index, spec.__wbg_ptr, first, second, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {LayerRegistry} registry
     * @param {CompiledMultiInputGraph} graph
     * @param {string} expected_program_identity
     * @param {string} expected_state_digest
     */
    constructor(registry, graph, expected_program_identity, expected_state_digest) {
        _assertClass(registry, LayerRegistry);
        _assertClass(graph, CompiledMultiInputGraph);
        const ptr0 = passStringToWasm0(expected_program_identity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(expected_state_digest, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.graphmutationtransaction_new(registry.__wbg_ptr, graph.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        GraphMutationTransactionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} index
     * @param {number} first
     * @param {number} second
     * @param {number} output
     */
    reconnectStep(index, first, second, output) {
        const ret = wasm.graphmutationtransaction_reconnectStep(this.__wbg_ptr, index, first, second, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} index
     */
    removeStep(index) {
        const ret = wasm.graphmutationtransaction_removeStep(this.__wbg_ptr, index);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} index
     * @param {AgentLayerSpec} spec
     * @param {number} first
     * @param {number} second
     * @param {number} output
     */
    replaceStep(index, spec, first, second, output) {
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.graphmutationtransaction_replaceStep(this.__wbg_ptr, index, spec.__wbg_ptr, first, second, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} output
     */
    setOutput(output) {
        const ret = wasm.graphmutationtransaction_setOutput(this.__wbg_ptr, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} layer_type
     * @param {number} layer_id
     * @param {Float32Array} values
     */
    setWeightsFlat(layer_type, layer_id, values) {
        const ptr0 = passArrayF32ToWasm0(values, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.graphmutationtransaction_setWeightsFlat(this.__wbg_ptr, layer_type, layer_id, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {string}
     */
    stageCandidate() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.graphmutationtransaction_stageCandidate(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @param {MultiInputVerificationCases} cases
     * @param {number} abs_tol
     * @param {number} rel_tol
     * @returns {string}
     */
    verifyCases(cases, abs_tol, rel_tol) {
        let deferred2_0;
        let deferred2_1;
        try {
            _assertClass(cases, MultiInputVerificationCases);
            const ret = wasm.graphmutationtransaction_verifyCases(this.__wbg_ptr, cases.__wbg_ptr, abs_tol, rel_tol);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) GraphMutationTransaction.prototype[Symbol.dispose] = GraphMutationTransaction.prototype.free;

export class InputPortConsumerSpec {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InputPortConsumerSpecFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputportconsumerspec_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    acceptedRoles() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.inputportconsumerspec_acceptedRoles(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    allowExtensionRoles() {
        const ret = wasm.inputportconsumerspec_allowExtensionRoles(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    consumerId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.inputportconsumerspec_consumerId(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    describe() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.inputportconsumerspec_describe(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {bigint}
     */
    minimumRevision() {
        const ret = wasm.inputportconsumerspec_minimumRevision(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {string} consumer_id
     * @param {string} accepted_roles_json
     * @param {boolean} allow_extension_roles
     * @param {boolean} require_fingerprint
     * @param {bigint} minimum_revision
     */
    constructor(consumer_id, accepted_roles_json, allow_extension_roles, require_fingerprint, minimum_revision) {
        const ptr0 = passStringToWasm0(consumer_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(accepted_roles_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.inputportconsumerspec_new(ptr0, len0, ptr1, len1, allow_extension_roles, require_fingerprint, minimum_revision);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        InputPortConsumerSpecFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {boolean}
     */
    requireFingerprint() {
        const ret = wasm.inputportconsumerspec_requireFingerprint(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) InputPortConsumerSpec.prototype[Symbol.dispose] = InputPortConsumerSpec.prototype.free;

export class LayerRegistry {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LayerRegistryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_layerregistry_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {CompiledGraph}
     */
    compileGraph(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.layerregistry_compileGraph(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return CompiledGraph.__wrap(ret[0]);
    }
    /**
     * @param {MultiInputGraphPlan} plan
     * @returns {CompiledMultiInputGraph}
     */
    compileMultiInputGraph(plan) {
        _assertClass(plan, MultiInputGraphPlan);
        const ret = wasm.layerregistry_compileMultiInputGraph(this.__wbg_ptr, plan.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return CompiledMultiInputGraph.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} layer_type
     * @returns {boolean}
     */
    destroyLayer(layer_id, layer_type) {
        const ret = wasm.layerregistry_destroyLayer(this.__wbg_ptr, layer_id, layer_type);
        return ret !== 0;
    }
    /**
     * @param {number} layer_id
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    forwardBinaryLayer(layer_id, a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.layerregistry_forwardBinaryLayer(this.__wbg_ptr, layer_id, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * Boundary #5: forward for integer binary layers (i64 exact).
     * @param {number} layer_id
     * @param {WasmIntTensor} a
     * @param {WasmIntTensor} b
     * @returns {WasmIntTensor}
     */
    forwardIntBinary(layer_id, a, b) {
        _assertClass(a, WasmIntTensor);
        _assertClass(b, WasmIntTensor);
        const ret = wasm.layerregistry_forwardIntBinary(this.__wbg_ptr, layer_id, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmIntTensor.__wrap(ret[0]);
    }
    /**
     * Boundary #5: float -> int cast (f32 -> i64, truncating toward zero).
     * @param {number} layer_id
     * @param {WasmTensor} input
     * @returns {WasmIntTensor}
     */
    forwardIntCastFromFloat(layer_id, input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.layerregistry_forwardIntCastFromFloat(this.__wbg_ptr, layer_id, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmIntTensor.__wrap(ret[0]);
    }
    /**
     * Boundary #5: int -> float cast (i64 -> f32; exact only for |x| <= 2^24).
     * @param {number} layer_id
     * @param {WasmIntTensor} input
     * @returns {WasmTensor}
     */
    forwardIntCastToFloat(layer_id, input) {
        _assertClass(input, WasmIntTensor);
        const ret = wasm.layerregistry_forwardIntCastToFloat(this.__wbg_ptr, layer_id, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} layer_type
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forwardLayer(layer_id, layer_type, input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.layerregistry_forwardLayer(this.__wbg_ptr, layer_id, layer_type, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} layer_type
     * @returns {Uint8Array}
     */
    getLayerState(layer_id, layer_type) {
        const ret = wasm.layerregistry_getLayerState(this.__wbg_ptr, layer_id, layer_type);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} layer_id
     * @param {number} layer_type
     * @returns {Float32Array}
     */
    getWeightsFlat(layer_id, layer_type) {
        const ret = wasm.layerregistry_getWeightsFlat(this.__wbg_ptr, layer_id, layer_type);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {AgentLayerSpec} spec
     */
    initAgentLayer(spec) {
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.layerregistry_initAgentLayer(this.__wbg_ptr, spec.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {PacketHeader} header
     * @param {Uint8Array} payload
     */
    initLayer(header, payload) {
        _assertClass(header, PacketHeader);
        const ptr0 = passArray8ToWasm0(payload, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.layerregistry_initLayer(this.__wbg_ptr, header.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {string}
     */
    inventorySnapshot() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.layerregistry_inventorySnapshot(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @param {number} layer_type
     * @param {number} layer_id
     * @returns {boolean}
     */
    layerExists(layer_type, layer_id) {
        const ret = wasm.layerregistry_layerExists(this.__wbg_ptr, layer_type, layer_id);
        return ret !== 0;
    }
    /**
     * Return the canonical init identity for a live layer.
     * The identity is derived from the validated payload prefix plus variant/flags,
     * so ignored outer trailing bytes never affect provenance.
     * @param {number} layer_type
     * @param {number} layer_id
     * @returns {string}
     */
    layerInitFingerprint(layer_type, layer_id) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.layerregistry_layerInitFingerprint(this.__wbg_ptr, layer_type, layer_id);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @param {number} layer_id
     * @param {number} layer_type
     * @param {Uint8Array} data
     */
    loadLayerState(layer_id, layer_type, data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.layerregistry_loadLayerState(this.__wbg_ptr, layer_id, layer_type, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    constructor() {
        const ret = wasm.layerregistry_new();
        this.__wbg_ptr = ret;
        LayerRegistryFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    operationBindingSnapshot() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.layerregistry_operationBindingSnapshot(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @param {Uint8Array} plan
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    runGraph(plan, input) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(input, WasmTensor);
        const ret = wasm.layerregistry_runGraph(this.__wbg_ptr, ptr0, len0, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {number} layer_id
     * @param {number} layer_type
     * @param {Float32Array} data
     */
    setWeightsFlat(layer_id, layer_type, data) {
        const ptr0 = passArrayF32ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.layerregistry_setWeightsFlat(this.__wbg_ptr, layer_id, layer_type, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {number}
     */
    totalParams() {
        const ret = wasm.layerregistry_totalParams(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} layer_id
     * @param {number} layer_type
     * @returns {string}
     */
    weightLayout(layer_id, layer_type) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.layerregistry_weightLayout(this.__wbg_ptr, layer_id, layer_type);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) LayerRegistry.prototype[Symbol.dispose] = LayerRegistry.prototype.free;

export class MultiInputGraphPlan {
    static __wrap(ptr) {
        const obj = Object.create(MultiInputGraphPlan.prototype);
        obj.__wbg_ptr = ptr;
        MultiInputGraphPlanFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MultiInputGraphPlanFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_multiinputgraphplan_free(ptr, 0);
    }
    /**
     * @param {number} slot
     * @param {string} role
     * @param {number} dim0
     * @param {number} dim1
     * @param {number} dim2
     * @param {number} dim3
     * @param {string} layout
     * @param {boolean} require_fingerprint
     * @param {bigint} minimum_revision
     * @returns {boolean}
     */
    addInputPort(slot, role, dim0, dim1, dim2, dim3, layout, require_fingerprint, minimum_revision) {
        const ptr0 = passStringToWasm0(role, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(layout, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.multiinputgraphplan_addInputPort(this.__wbg_ptr, slot, ptr0, len0, dim0, dim1, dim2, dim3, ptr1, len1, require_fingerprint, minimum_revision);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {MultiInputGraphPlan}
     */
    static fromBytes(bytes) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.multiinputgraphplan_fromBytes(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return MultiInputGraphPlan.__wrap(ret[0]);
    }
    /**
     * @returns {Uint8Array}
     */
    inputSlots() {
        const ret = wasm.multiinputgraphplan_inputSlots(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {AgentGraphBuilder} builder
     */
    constructor(builder) {
        _assertClass(builder, AgentGraphBuilder);
        const ret = wasm.multiinputgraphplan_new(builder.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        MultiInputGraphPlanFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    planFingerprint() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.multiinputgraphplan_planFingerprint(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    portCount() {
        const ret = wasm.multiinputgraphplan_portCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.multiinputgraphplan_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        const ret = wasm.multiinputgraphplan_toBytes(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    toJSON() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.multiinputgraphplan_toJSON(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) MultiInputGraphPlan.prototype[Symbol.dispose] = MultiInputGraphPlan.prototype.free;

export class MultiInputInputBundle {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MultiInputInputBundleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_multiinputinputbundle_free(ptr, 0);
    }
    /**
     * @param {number} slot
     * @param {WasmTensor} tensor
     * @param {string} role
     * @param {string} layout
     * @param {string} source
     * @param {bigint} revision
     * @param {string} fingerprint
     * @returns {boolean}
     */
    bindInput(slot, tensor, role, layout, source, revision, fingerprint) {
        _assertClass(tensor, WasmTensor);
        const ptr0 = passStringToWasm0(role, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(layout, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(fingerprint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.multiinputinputbundle_bindInput(this.__wbg_ptr, slot, tensor.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, revision, ptr3, len3);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @returns {number}
     */
    boundPortCount() {
        const ret = wasm.multiinputinputbundle_boundPortCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     * @returns {boolean}
     */
    clearInput(slot) {
        const ret = wasm.multiinputinputbundle_clearInput(this.__wbg_ptr, slot);
        return ret !== 0;
    }
    /**
     * @param {MultiInputGraphPlan} plan
     */
    constructor(plan) {
        _assertClass(plan, MultiInputGraphPlan);
        const ret = wasm.multiinputinputbundle_new(plan.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        MultiInputInputBundleFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    planFingerprint() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.multiinputinputbundle_planFingerprint(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) MultiInputInputBundle.prototype[Symbol.dispose] = MultiInputInputBundle.prototype.free;

export class MultiInputVerificationCases {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MultiInputVerificationCasesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_multiinputverificationcases_free(ptr, 0);
    }
    /**
     * @param {MultiInputInputBundle} baseline
     * @param {MultiInputInputBundle} candidate
     * @returns {number}
     */
    addCase(baseline, candidate) {
        _assertClass(baseline, MultiInputInputBundle);
        _assertClass(candidate, MultiInputInputBundle);
        const ret = wasm.multiinputverificationcases_addCase(this.__wbg_ptr, baseline.__wbg_ptr, candidate.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @returns {number}
     */
    caseCount() {
        const ret = wasm.multiinputverificationcases_caseCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {CompiledMultiInputGraph} baseline
     * @param {CompiledMultiInputGraph} candidate
     */
    constructor(baseline, candidate) {
        _assertClass(baseline, CompiledMultiInputGraph);
        _assertClass(candidate, CompiledMultiInputGraph);
        const ret = wasm.multiinputverificationcases_new(baseline.__wbg_ptr, candidate.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        MultiInputVerificationCasesFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {LayerRegistry} baseline_registry
     * @param {CompiledMultiInputGraph} baseline
     * @param {LayerRegistry} candidate_registry
     * @param {CompiledMultiInputGraph} candidate
     * @param {number} abs_tol
     * @param {number} rel_tol
     * @returns {string}
     */
    verify(baseline_registry, baseline, candidate_registry, candidate, abs_tol, rel_tol) {
        let deferred2_0;
        let deferred2_1;
        try {
            _assertClass(baseline_registry, LayerRegistry);
            _assertClass(baseline, CompiledMultiInputGraph);
            _assertClass(candidate_registry, LayerRegistry);
            _assertClass(candidate, CompiledMultiInputGraph);
            const ret = wasm.multiinputverificationcases_verify(this.__wbg_ptr, baseline_registry.__wbg_ptr, baseline.__wbg_ptr, candidate_registry.__wbg_ptr, candidate.__wbg_ptr, abs_tol, rel_tol);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) MultiInputVerificationCases.prototype[Symbol.dispose] = MultiInputVerificationCases.prototype.free;

export class PacketHeader {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PacketHeaderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_packetheader_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get flags() {
        const ret = wasm.__wbg_get_packetheader_flags(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get layer_type() {
        const ret = wasm.__wbg_get_packetheader_layer_type(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get opcode() {
        const ret = wasm.__wbg_get_packetheader_opcode(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get payload_len() {
        const ret = wasm.__wbg_get_packetheader_payload_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get variant() {
        const ret = wasm.__wbg_get_packetheader_variant(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} bytes
     */
    constructor(bytes) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.packetheader_from_bytes(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        PacketHeaderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {boolean}
     */
    has_bias() {
        const ret = wasm.packetheader_has_bias(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    is_training() {
        const ret = wasm.packetheader_is_training(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {Uint8Array}
     */
    to_bytes() {
        const ret = wasm.packetheader_to_bytes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} arg0
     */
    set flags(arg0) {
        wasm.__wbg_set_packetheader_flags(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set layer_type(arg0) {
        wasm.__wbg_set_packetheader_layer_type(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set opcode(arg0) {
        wasm.__wbg_set_packetheader_opcode(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set payload_len(arg0) {
        wasm.__wbg_set_packetheader_payload_len(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set variant(arg0) {
        wasm.__wbg_set_packetheader_variant(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) PacketHeader.prototype[Symbol.dispose] = PacketHeader.prototype.free;

export class SemanticIngressManifest {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SemanticIngressManifestFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_semanticingressmanifest_free(ptr, 0);
    }
    /**
     * @param {string} logical_port_id
     * @param {string} role
     * @param {string} source
     * @param {bigint} revision
     * @param {string} fingerprint
     * @param {boolean} required
     * @returns {boolean}
     */
    addDeferredPort(logical_port_id, role, source, revision, fingerprint, required) {
        const ptr0 = passStringToWasm0(logical_port_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(fingerprint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.semanticingressmanifest_addDeferredPort(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, revision, ptr3, len3, required);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @param {string} logical_port_id
     * @param {string} role
     * @param {string} source
     * @param {bigint} revision
     * @param {string} fingerprint
     * @param {number} runtime_slot
     * @param {boolean} required
     * @returns {boolean}
     */
    addRuntimeBackedPort(logical_port_id, role, source, revision, fingerprint, runtime_slot, required) {
        const ptr0 = passStringToWasm0(logical_port_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(fingerprint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.semanticingressmanifest_addRuntimeBackedPort(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, revision, ptr3, len3, runtime_slot, required);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @returns {string}
     */
    manifestFingerprint() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semanticingressmanifest_manifestFingerprint(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    constructor() {
        const ret = wasm.semanticingressmanifest_new();
        this.__wbg_ptr = ret;
        SemanticIngressManifestFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    portCount() {
        const ret = wasm.semanticingressmanifest_portCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    toJSON() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semanticingressmanifest_toJSON(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) SemanticIngressManifest.prototype[Symbol.dispose] = SemanticIngressManifest.prototype.free;

export class SemanticIngressManifestV2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SemanticIngressManifestV2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_semanticingressmanifestv2_free(ptr, 0);
    }
    /**
     * @param {string} logical_port_id
     * @param {string} role
     * @param {boolean} required
     * @returns {boolean}
     */
    addDeferredPort(logical_port_id, role, required) {
        const ptr0 = passStringToWasm0(logical_port_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.semanticingressmanifestv2_addDeferredPort(this.__wbg_ptr, ptr0, len0, ptr1, len1, required);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @param {string} logical_port_id
     * @param {number} slot
     * @param {string} expected_source
     * @returns {boolean}
     */
    addRuntimePort(logical_port_id, slot, expected_source) {
        const ptr0 = passStringToWasm0(logical_port_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(expected_source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.semanticingressmanifestv2_addRuntimePort(this.__wbg_ptr, ptr0, len0, slot, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @param {number} slot
     * @param {MultiInputInputBundle} bundle
     * @param {InputPortConsumerSpec} consumer
     * @returns {string}
     */
    consumerCompatibility(slot, bundle, consumer) {
        let deferred2_0;
        let deferred2_1;
        try {
            _assertClass(bundle, MultiInputInputBundle);
            _assertClass(consumer, InputPortConsumerSpec);
            const ret = wasm.semanticingressmanifestv2_consumerCompatibility(this.__wbg_ptr, slot, bundle.__wbg_ptr, consumer.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @param {number} slot
     * @param {MultiInputInputBundle} bundle
     * @returns {string}
     */
    inputPortStatus(slot, bundle) {
        let deferred2_0;
        let deferred2_1;
        try {
            _assertClass(bundle, MultiInputInputBundle);
            const ret = wasm.semanticingressmanifestv2_inputPortStatus(this.__wbg_ptr, slot, bundle.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    manifestFingerprint() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semanticingressmanifestv2_manifestFingerprint(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {MultiInputGraphPlan} plan
     */
    constructor(plan) {
        _assertClass(plan, MultiInputGraphPlan);
        const ret = wasm.semanticingressmanifestv2_new(plan.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        SemanticIngressManifestV2Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {LayerRegistry} registry
     * @param {CompiledMultiInputGraph} graph
     * @param {MultiInputInputBundle} bundle
     * @param {number} start_step
     * @param {number} max_steps
     * @param {number} max_tensor_bytes
     * @returns {TracedMultiInputRun}
     */
    runWithTrace(registry, graph, bundle, start_step, max_steps, max_tensor_bytes) {
        _assertClass(registry, LayerRegistry);
        _assertClass(graph, CompiledMultiInputGraph);
        _assertClass(bundle, MultiInputInputBundle);
        const ret = wasm.semanticingressmanifestv2_runWithTrace(this.__wbg_ptr, registry.__wbg_ptr, graph.__wbg_ptr, bundle.__wbg_ptr, start_step, max_steps, max_tensor_bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TracedMultiInputRun.__wrap(ret[0]);
    }
    /**
     * @param {LayerRegistry} registry
     * @param {CompiledMultiInputGraph} graph
     * @param {MultiInputInputBundle} bundle
     * @returns {WasmTensor}
     */
    run(registry, graph, bundle) {
        _assertClass(registry, LayerRegistry);
        _assertClass(graph, CompiledMultiInputGraph);
        _assertClass(bundle, MultiInputInputBundle);
        const ret = wasm.semanticingressmanifestv2_run(this.__wbg_ptr, registry.__wbg_ptr, graph.__wbg_ptr, bundle.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {LayerRegistry} registry
     * @param {CompiledMultiInputGraph} graph
     * @param {MultiInputInputBundle} bundle
     * @returns {string}
     */
    status(registry, graph, bundle) {
        let deferred1_0;
        let deferred1_1;
        try {
            _assertClass(registry, LayerRegistry);
            _assertClass(graph, CompiledMultiInputGraph);
            _assertClass(bundle, MultiInputInputBundle);
            const ret = wasm.semanticingressmanifestv2_status(this.__wbg_ptr, registry.__wbg_ptr, graph.__wbg_ptr, bundle.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toJSON() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semanticingressmanifestv2_toJSON(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {LayerRegistry} registry
     * @param {CompiledMultiInputGraph} graph
     * @param {MultiInputInputBundle} bundle
     * @param {Float32Array} candidate
     * @param {number} abs_tol
     * @param {number} rel_tol
     * @returns {string}
     */
    verifyFlat(registry, graph, bundle, candidate, abs_tol, rel_tol) {
        let deferred3_0;
        let deferred3_1;
        try {
            _assertClass(registry, LayerRegistry);
            _assertClass(graph, CompiledMultiInputGraph);
            _assertClass(bundle, MultiInputInputBundle);
            const ptr0 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.semanticingressmanifestv2_verifyFlat(this.__wbg_ptr, registry.__wbg_ptr, graph.__wbg_ptr, bundle.__wbg_ptr, ptr0, len0, abs_tol, rel_tol);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
}
if (Symbol.dispose) SemanticIngressManifestV2.prototype[Symbol.dispose] = SemanticIngressManifestV2.prototype.free;

export class SemanticTransitionSpec {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SemanticTransitionSpecFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_semantictransitionspec_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    describe() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semantictransitionspec_describe(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    inputRoles() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semantictransitionspec_inputRoles(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} transition_id
     * @param {string} input_roles_json
     * @param {string} output_role
     */
    constructor(transition_id, input_roles_json, output_role) {
        const ptr0 = passStringToWasm0(transition_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(input_roles_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(output_role, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.semantictransitionspec_new(ptr0, len0, ptr1, len1, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        SemanticTransitionSpecFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    outputRole() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semantictransitionspec_outputRole(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    transitionId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.semantictransitionspec_transitionId(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) SemanticTransitionSpec.prototype[Symbol.dispose] = SemanticTransitionSpec.prototype.free;

export class TensorView {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TensorViewFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tensorview_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    len() {
        const ret = wasm.tensorview_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} total_elements
     */
    constructor(total_elements) {
        const ret = wasm.tensorview_new(total_elements);
        this.__wbg_ptr = ret;
        TensorViewFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Copy data dari SAB ke slice Rust (Rust baca data JS)
     * @param {Float32Array} dst
     */
    read(dst) {
        var ptr0 = passArrayF32ToWasm0(dst, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.tensorview_read(this.__wbg_ptr, ptr0, len0, dst);
    }
    /**
     * @param {Uint32Array} shape
     */
    setShape(shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tensorview_setShape(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {Uint32Array}
     */
    shape() {
        const ret = wasm.tensorview_shape(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Copy data dari slice Rust ke SAB (Rust tulis data untuk JS)
     * @param {Float32Array} src
     */
    write(src) {
        const ptr0 = passArrayF32ToWasm0(src, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.tensorview_write(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) TensorView.prototype[Symbol.dispose] = TensorView.prototype.free;

export class TracedMultiInputRun {
    static __wrap(ptr) {
        const obj = Object.create(TracedMultiInputRun.prototype);
        obj.__wbg_ptr = ptr;
        TracedMultiInputRunFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TracedMultiInputRunFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tracedmultiinputrun_free(ptr, 0);
    }
    /**
     * A failed numerical step has no output and never issues an execution receipt.
     * @returns {WasmTensor}
     */
    output() {
        const ret = wasm.tracedmultiinputrun_output(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    report() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.tracedmultiinputrun_report(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) TracedMultiInputRun.prototype[Symbol.dispose] = TracedMultiInputRun.prototype.free;

export class WasmActivation {
    static __wrap(ptr) {
        const obj = Object.create(WasmActivation.prototype);
        obj.__wbg_ptr = ptr;
        WasmActivationFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmActivationFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmactivation_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmactivation_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * @returns {Uint8Array}
     */
    get_state() {
        const ret = wasm.wasmactivation_get_state(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} data
     */
    load_state(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmactivation_load_state(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmActivation}
     */
    static newGelu() {
        const ret = wasm.wasmactivation_newGelu();
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number} dim
     * @returns {WasmActivation}
     */
    static newGlu(dim) {
        const ret = wasm.wasmactivation_newGlu(dim);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number | null} [alpha]
     * @param {number | null} [beta]
     * @returns {WasmActivation}
     */
    static newHardSigmoid(alpha, beta) {
        const ret = wasm.wasmactivation_newHardSigmoid(!isLikeNone(alpha), isLikeNone(alpha) ? 0 : alpha, !isLikeNone(beta), isLikeNone(beta) ? 0 : beta);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @returns {WasmActivation}
     */
    static newHardSwish() {
        const ret = wasm.wasmactivation_newHardSwish();
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number | null} [negative_slope]
     * @returns {WasmActivation}
     */
    static newLeakyRelu(negative_slope) {
        const ret = wasm.wasmactivation_newLeakyRelu(!isLikeNone(negative_slope), isLikeNone(negative_slope) ? 0 : negative_slope);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number} dim
     * @returns {WasmActivation}
     */
    static newLogSoftmax(dim) {
        const ret = wasm.wasmactivation_newLogSoftmax(dim);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @returns {WasmActivation}
     */
    static newMish() {
        const ret = wasm.wasmactivation_newMish();
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number | null} [num_parameters]
     * @param {number | null} [alpha]
     * @returns {WasmActivation}
     */
    static newPRelu(num_parameters, alpha) {
        const ret = wasm.wasmactivation_newPRelu(isLikeNone(num_parameters) ? Number.MAX_SAFE_INTEGER : (num_parameters) >>> 0, !isLikeNone(alpha), isLikeNone(alpha) ? 0 : alpha);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @returns {WasmActivation}
     */
    static newRelu() {
        const ret = wasm.wasmactivation_newRelu();
        return WasmActivation.__wrap(ret);
    }
    /**
     * @returns {WasmActivation}
     */
    static newSigmoid() {
        const ret = wasm.wasmactivation_newSigmoid();
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number} dim
     * @returns {WasmActivation}
     */
    static newSoftmax(dim) {
        const ret = wasm.wasmactivation_newSoftmax(dim);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number | null} [beta]
     * @returns {WasmActivation}
     */
    static newSoftplus(beta) {
        const ret = wasm.wasmactivation_newSoftplus(!isLikeNone(beta), isLikeNone(beta) ? 0 : beta);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @param {number} d_input
     * @param {number} d_output
     * @param {boolean | null} [bias]
     * @returns {WasmActivation}
     */
    static newSwiGlu(d_input, d_output, bias) {
        const ret = wasm.wasmactivation_newSwiGlu(d_input, d_output, isLikeNone(bias) ? 0xFFFFFF : bias ? 1 : 0);
        return WasmActivation.__wrap(ret);
    }
    /**
     * @returns {WasmActivation}
     */
    static newTanh() {
        const ret = wasm.wasmactivation_newTanh();
        return WasmActivation.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmactivation_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) WasmActivation.prototype[Symbol.dispose] = WasmActivation.prototype.free;

export class WasmBinary {
    static __wrap(ptr) {
        const obj = Object.create(WasmBinary.prototype);
        obj.__wbg_ptr = ptr;
        WasmBinaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBinaryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmbinary_free(ptr, 0);
    }
    /**
     * Dua input. Shape-mismatch -> thrown string (bukan trap).
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    forwardBinary(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmbinary_forwardBinary(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @returns {WasmBinary}
     */
    static newAdd() {
        const ret = wasm.wasmbinary_newAdd();
        return WasmBinary.__wrap(ret);
    }
    /**
     * @param {number} dim
     * @returns {WasmBinary}
     */
    static newConcat(dim) {
        const ret = wasm.wasmbinary_newConcat(dim);
        return WasmBinary.__wrap(ret);
    }
    /**
     * @returns {WasmBinary}
     */
    static newMatmul() {
        const ret = wasm.wasmbinary_newMatmul();
        return WasmBinary.__wrap(ret);
    }
    /**
     * @returns {WasmBinary}
     */
    static newMul() {
        const ret = wasm.wasmbinary_newMul();
        return WasmBinary.__wrap(ret);
    }
    /**
     * @returns {WasmBinary}
     */
    static newSub() {
        const ret = wasm.wasmbinary_newSub();
        return WasmBinary.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmbinary_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) WasmBinary.prototype[Symbol.dispose] = WasmBinary.prototype.free;

export class WasmComparison {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmComparisonFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmcomparison_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} lhs
     * @param {WasmTensor} rhs
     * @returns {WasmTensor}
     */
    lessEqual01(lhs, rhs) {
        _assertClass(lhs, WasmTensor);
        _assertClass(rhs, WasmTensor);
        const ret = wasm.wasmcomparison_lessEqual01(this.__wbg_ptr, lhs.__wbg_ptr, rhs.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.wasmcomparison_new();
        this.__wbg_ptr = ret;
        WasmComparisonFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) WasmComparison.prototype[Symbol.dispose] = WasmComparison.prototype.free;

export class WasmConv {
    static __wrap(ptr) {
        const obj = Object.create(WasmConv.prototype);
        obj.__wbg_ptr = ptr;
        WasmConvFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmConvFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmconv_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmconv_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     * @returns {Float32Array}
     */
    getWeightsFlat() {
        const ret = wasm.wasmconv_getWeightsFlat(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get_state() {
        const ret = wasm.wasmconv_get_state(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} data
     */
    load_state(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmconv_load_state(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_size
     * @param {number | null} [stride]
     * @param {number | null} [padding]
     * @returns {WasmConv}
     */
    static newConv1d(in_channels, out_channels, kernel_size, stride, padding) {
        const ret = wasm.wasmconv_newConv1d(in_channels, out_channels, kernel_size, isLikeNone(stride) ? Number.MAX_SAFE_INTEGER : (stride) >>> 0, isLikeNone(padding) ? Number.MAX_SAFE_INTEGER : (padding) >>> 0);
        return WasmConv.__wrap(ret);
    }
    /**
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_size_h
     * @param {number} kernel_size_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {WasmConv}
     */
    static newConv2d(in_channels, out_channels, kernel_size_h, kernel_size_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.wasmconv_newConv2d(in_channels, out_channels, kernel_size_h, kernel_size_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        return WasmConv.__wrap(ret);
    }
    /**
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_size_h
     * @param {number} kernel_size_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {WasmConv}
     */
    static newConvTranspose2d(in_channels, out_channels, kernel_size_h, kernel_size_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.wasmconv_newConvTranspose2d(in_channels, out_channels, kernel_size_h, kernel_size_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        return WasmConv.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmconv_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Float32Array} data
     */
    setWeightsFlat(data) {
        const ptr0 = passArrayF32ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmconv_setWeightsFlat(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmConv.prototype[Symbol.dispose] = WasmConv.prototype.free;

export class WasmEmbedding {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmEmbeddingFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmembedding_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmembedding_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     * @returns {Float32Array}
     */
    getWeightsFlat() {
        const ret = wasm.wasmembedding_getWeightsFlat(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get_state() {
        const ret = wasm.wasmembedding_get_state(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} data
     */
    load_state(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmembedding_load_state(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} vocab_size
     * @param {number} d_model
     */
    constructor(vocab_size, d_model) {
        const ret = wasm.wasmembedding_new(vocab_size, d_model);
        this.__wbg_ptr = ret;
        WasmEmbeddingFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmembedding_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Float32Array} data
     */
    setWeightsFlat(data) {
        const ptr0 = passArrayF32ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmembedding_setWeightsFlat(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {Uint32Array}
     */
    weightDims() {
        const ret = wasm.wasmembedding_weightDims(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) WasmEmbedding.prototype[Symbol.dispose] = WasmEmbedding.prototype.free;

export class WasmFeatureNorm {
    static __wrap(ptr) {
        const obj = Object.create(WasmFeatureNorm.prototype);
        obj.__wbg_ptr = ptr;
        WasmFeatureNormFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmFeatureNormFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmfeaturenorm_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmfeaturenorm_forward(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {number | null} [epsilon]
     * @returns {WasmFeatureNorm}
     */
    static newFeatureNorm(epsilon) {
        const ret = wasm.wasmfeaturenorm_newFeatureNorm(!isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmFeatureNorm.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmfeaturenorm_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) WasmFeatureNorm.prototype[Symbol.dispose] = WasmFeatureNorm.prototype.free;

export class WasmGhostModule {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmGhostModuleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmghostmodule_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmghostmodule_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * @returns {Uint8Array}
     */
    get_state() {
        const ret = wasm.wasmghostmodule_get_state(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} data
     */
    load_state(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmghostmodule_load_state(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmghostmodule_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Fallible constructor (complaint #14): invalid configs are a per-call
     * `Err`, never a panic/`throw_str`, so corrupt bundle bytes cannot wedge
     * the in-process WASM runtime.
     * @param {number} in_channels
     * @param {number} out_channels
     * @param {number} kernel_size_h
     * @param {number} kernel_size_w
     * @param {number | null} [ratio]
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     */
    constructor(in_channels, out_channels, kernel_size_h, kernel_size_w, ratio, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.wasmghostmodule_try_new(in_channels, out_channels, kernel_size_h, kernel_size_w, isLikeNone(ratio) ? Number.MAX_SAFE_INTEGER : (ratio) >>> 0, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmGhostModuleFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) WasmGhostModule.prototype[Symbol.dispose] = WasmGhostModule.prototype.free;

export class WasmIndexSource {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmIndexSourceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmindexsource_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} reference
     * @param {number} axis
     * @returns {WasmTensor}
     */
    indicesLike(reference, axis) {
        _assertClass(reference, WasmTensor);
        const ret = wasm.wasmindexsource_indicesLike(this.__wbg_ptr, reference.__wbg_ptr, axis);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.wasmindexsource_new();
        this.__wbg_ptr = ret;
        WasmIndexSourceFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) WasmIndexSource.prototype[Symbol.dispose] = WasmIndexSource.prototype.free;

export class WasmIntTensor {
    static __wrap(ptr) {
        const obj = Object.create(WasmIntTensor.prototype);
        obj.__wbg_ptr = ptr;
        WasmIntTensorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmIntTensorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasminttensor_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    byte_length() {
        const ret = wasm.wasminttensor_byte_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Ergonomic constructor from plain JS numbers (Float64Array).
     *
     * Every element must be a *safe integer*: finite, integral, and
     * |v| <= 2^53 - 1 (the exact-integer range of f64). Anything else
     * is a clean `Err` naming the offending index — never a silent
     * rounding. For magnitudes beyond 2^53, use `new(BigInt64Array)`
     * instead, which carries the full i64 range exactly.
     * @param {Float64Array} data
     * @param {Uint32Array} shape
     * @returns {WasmIntTensor}
     */
    static fromNumbers(data, shape) {
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasminttensor_fromNumbers(ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmIntTensor.__wrap(ret[0]);
    }
    /**
     * @param {BigInt64Array} data
     * @param {Uint32Array} shape
     */
    constructor(data, shape) {
        const ptr0 = passArray64ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasminttensor_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret;
        WasmIntTensorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Uint32Array}
     */
    shape() {
        const ret = wasm.wasminttensor_shape(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {BigInt64Array}
     */
    to_array() {
        const ret = wasm.wasminttensor_to_array(this.__wbg_ptr);
        var v1 = getArrayI64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
}
if (Symbol.dispose) WasmIntTensor.prototype[Symbol.dispose] = WasmIntTensor.prototype.free;

export class WasmLinear {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmLinearFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmlinear_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmlinear_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     * @returns {Float32Array}
     */
    getWeightsFlat() {
        const ret = wasm.wasmlinear_getWeightsFlat(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get_state() {
        const ret = wasm.wasmlinear_get_state(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} data
     */
    load_state(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmlinear_load_state(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} in_dim
     * @param {number} out_dim
     * @param {boolean} bias
     */
    constructor(in_dim, out_dim, bias) {
        const ret = wasm.wasmlinear_new(in_dim, out_dim, bias);
        this.__wbg_ptr = ret;
        WasmLinearFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmlinear_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Float32Array} data
     */
    setWeightsFlat(data) {
        const ptr0 = passArrayF32ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmlinear_setWeightsFlat(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * [in_dim, out_dim] — supaya JS tahu cara memotong vektor flat.
     * @returns {Uint32Array}
     */
    weightDims() {
        const ret = wasm.wasmlinear_weightDims(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) WasmLinear.prototype[Symbol.dispose] = WasmLinear.prototype.free;

/**
 * Stateless Burn-backed linear algebra surface for the canonical rank-4 bridge.
 *
 * Vector operations use `[B,F,1,1]`. Matrix multiplication follows Burn's rank-4
 * batched semantics `[B,G,M,K] @ [B,G,K,N] -> [B,G,M,N]`.
 */
export class WasmLinearAlgebra {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmLinearAlgebraFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmlinearalgebra_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {number | null} [epsilon]
     * @returns {WasmTensor}
     */
    cosineSimilarity(a, b, epsilon) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmlinearalgebra_cosineSimilarity(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    dot(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmlinearalgebra_dot(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    l2Distance(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmlinearalgebra_l2Distance(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    l2Norm(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmlinearalgebra_l2Norm(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    matmul(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmlinearalgebra_matmul(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.wasmlinearalgebra_new();
        this.__wbg_ptr = ret;
        WasmLinearAlgebraFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) WasmLinearAlgebra.prototype[Symbol.dispose] = WasmLinearAlgebra.prototype.free;

export class WasmMathProgram {
    static __wrap(ptr) {
        const obj = Object.create(WasmMathProgram.prototype);
        obj.__wbg_ptr = ptr;
        WasmMathProgramFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogram_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {WasmMathProgram}
     */
    static fromPlan(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogram_fromPlan(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgram.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogram_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogram_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogram_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.wasmmathprogram_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmathprogram_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.wasmmathprogram_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    run1(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmmathprogram_run1(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    run2(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmmathprogram_run2(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmMathProgram.prototype[Symbol.dispose] = WasmMathProgram.prototype.free;

export class WasmMathProgramBuilder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogrambuilder_free(ptr, 0);
    }
    /**
     * @param {number} op
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addBinary(op, lhs, rhs, output) {
        const ret = wasm.wasmmathprogrambuilder_addBinary(this.__wbg_ptr, op, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} min
     * @param {number} max
     */
    addClamp(input, output, min, max) {
        const ret = wasm.wasmmathprogrambuilder_addClamp(this.__wbg_ptr, input, output, min, max);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     * @param {number} epsilon
     */
    addCosineSimilarity(lhs, rhs, output, epsilon) {
        const ret = wasm.wasmmathprogrambuilder_addCosineSimilarity(this.__wbg_ptr, lhs, rhs, output, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} axes
     */
    addPermute(input, output, axes) {
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogrambuilder_addPermute(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} shape
     */
    addReshape(input, output, shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogrambuilder_addReshape(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     */
    addSlice(input, output, starts, ends) {
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogrambuilder_addSlice(this.__wbg_ptr, input, output, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} op
     * @param {number} input
     * @param {number} output
     */
    addUnary(op, input, output) {
        const ret = wasm.wasmmathprogrambuilder_addUnary(this.__wbg_ptr, op, input, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmMathProgram}
     */
    compile() {
        const ret = wasm.wasmmathprogrambuilder_compile(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgram.__wrap(ret[0]);
    }
    /**
     * @param {number} num_inputs
     * @param {number} num_slots
     */
    constructor(num_inputs, num_slots) {
        const ret = wasm.wasmmathprogrambuilder_new(num_inputs, num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmMathProgramBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogrambuilder_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogrambuilder_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogrambuilder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     */
    setOutput(slot) {
        const ret = wasm.wasmmathprogrambuilder_setOutput(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmMathProgramBuilder.prototype[Symbol.dispose] = WasmMathProgramBuilder.prototype.free;

export class WasmMathProgramV4 {
    static __wrap(ptr) {
        const obj = Object.create(WasmMathProgramV4.prototype);
        obj.__wbg_ptr = ptr;
        WasmMathProgramV4Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV4Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv4_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {WasmMathProgramV4}
     */
    static fromPlan(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv4_fromPlan(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV4.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv4_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv4_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv4_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.wasmmathprogramv4_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmathprogramv4_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.wasmmathprogramv4_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    run1(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmmathprogramv4_run1(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    run2(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmmathprogramv4_run2(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmMathProgramV4.prototype[Symbol.dispose] = WasmMathProgramV4.prototype.free;

export class WasmMathProgramV4Builder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV4BuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv4builder_free(ptr, 0);
    }
    /**
     * @param {number} op
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addBinary(op, lhs, rhs, output) {
        const ret = wasm.wasmmathprogramv4builder_addBinary(this.__wbg_ptr, op, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} min
     * @param {number} max
     */
    addClamp(input, output, min, max) {
        const ret = wasm.wasmmathprogramv4builder_addClamp(this.__wbg_ptr, input, output, min, max);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     * @param {number} epsilon
     */
    addCosineSimilarity(lhs, rhs, output, epsilon) {
        const ret = wasm.wasmmathprogramv4builder_addCosineSimilarity(this.__wbg_ptr, lhs, rhs, output, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} axes
     */
    addPermute(input, output, axes) {
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv4builder_addPermute(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} shape
     */
    addReshape(input, output, shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv4builder_addReshape(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     * @param {Uint32Array} indices
     */
    addSelectAxis(input, output, axis, indices) {
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv4builder_addSelectAxis(this.__wbg_ptr, input, output, axis, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     */
    addSlice(input, output, starts, ends) {
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv4builder_addSlice(this.__wbg_ptr, input, output, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} op
     * @param {number} input
     * @param {number} output
     */
    addUnary(op, input, output) {
        const ret = wasm.wasmmathprogramv4builder_addUnary(this.__wbg_ptr, op, input, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmMathProgramV4}
     */
    compile() {
        const ret = wasm.wasmmathprogramv4builder_compile(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV4.__wrap(ret[0]);
    }
    /**
     * @param {number} num_inputs
     * @param {number} num_slots
     */
    constructor(num_inputs, num_slots) {
        const ret = wasm.wasmmathprogramv4builder_new(num_inputs, num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmMathProgramV4BuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv4builder_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv4builder_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv4builder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     */
    setOutput(slot) {
        const ret = wasm.wasmmathprogramv4builder_setOutput(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmMathProgramV4Builder.prototype[Symbol.dispose] = WasmMathProgramV4Builder.prototype.free;

export class WasmMathProgramV5 {
    static __wrap(ptr) {
        const obj = Object.create(WasmMathProgramV5.prototype);
        obj.__wbg_ptr = ptr;
        WasmMathProgramV5Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV5Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv5_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {WasmMathProgramV5}
     */
    static fromPlan(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv5_fromPlan(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV5.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv5_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv5_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv5_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.wasmmathprogramv5_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmathprogramv5_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.wasmmathprogramv5_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @returns {WasmTensor}
     */
    run3(a, b, c) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        const ret = wasm.wasmmathprogramv5_run3(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @returns {WasmTensor}
     */
    run4(a, b, c, d) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        const ret = wasm.wasmmathprogramv5_run4(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @returns {WasmTensor}
     */
    run5(a, b, c, d, e) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        const ret = wasm.wasmmathprogramv5_run5(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @returns {WasmTensor}
     */
    run6(a, b, c, d, e, f) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        const ret = wasm.wasmmathprogramv5_run6(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @returns {WasmTensor}
     */
    run7(a, b, c, d, e, f, g) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        const ret = wasm.wasmmathprogramv5_run7(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @param {WasmTensor} h
     * @returns {WasmTensor}
     */
    run8(a, b, c, d, e, f, g, h) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        _assertClass(h, WasmTensor);
        const ret = wasm.wasmmathprogramv5_run8(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr, h.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmMathProgramV5.prototype[Symbol.dispose] = WasmMathProgramV5.prototype.free;

export class WasmMathProgramV5Builder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV5BuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv5builder_free(ptr, 0);
    }
    /**
     * @param {number} op
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addBinary(op, lhs, rhs, output) {
        const ret = wasm.wasmmathprogramv5builder_addBinary(this.__wbg_ptr, op, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} min
     * @param {number} max
     */
    addClamp(input, output, min, max) {
        const ret = wasm.wasmmathprogramv5builder_addClamp(this.__wbg_ptr, input, output, min, max);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     * @param {number} epsilon
     */
    addCosineSimilarity(lhs, rhs, output, epsilon) {
        const ret = wasm.wasmmathprogramv5builder_addCosineSimilarity(this.__wbg_ptr, lhs, rhs, output, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} axes
     */
    addPermute(input, output, axes) {
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv5builder_addPermute(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} shape
     */
    addReshape(input, output, shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv5builder_addReshape(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     * @param {Uint32Array} indices
     */
    addSelectAxis(input, output, axis, indices) {
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv5builder_addSelectAxis(this.__wbg_ptr, input, output, axis, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     */
    addSlice(input, output, starts, ends) {
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv5builder_addSlice(this.__wbg_ptr, input, output, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} op
     * @param {number} input
     * @param {number} output
     */
    addUnary(op, input, output) {
        const ret = wasm.wasmmathprogramv5builder_addUnary(this.__wbg_ptr, op, input, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmMathProgramV5}
     */
    compile() {
        const ret = wasm.wasmmathprogramv5builder_compile(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV5.__wrap(ret[0]);
    }
    /**
     * @param {number} num_inputs
     * @param {number} num_slots
     */
    constructor(num_inputs, num_slots) {
        const ret = wasm.wasmmathprogramv5builder_new(num_inputs, num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmMathProgramV5BuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv5builder_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv5builder_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv5builder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     */
    setOutput(slot) {
        const ret = wasm.wasmmathprogramv5builder_setOutput(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmMathProgramV5Builder.prototype[Symbol.dispose] = WasmMathProgramV5Builder.prototype.free;

export class WasmMathProgramV6 {
    static __wrap(ptr) {
        const obj = Object.create(WasmMathProgramV6.prototype);
        obj.__wbg_ptr = ptr;
        WasmMathProgramV6Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV6Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv6_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {WasmMathProgramV6}
     */
    static fromPlan(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv6_fromPlan(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV6.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv6_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv6_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv6_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.wasmmathprogramv6_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmathprogramv6_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.wasmmathprogramv6_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {WasmTensor} a
     * @returns {WasmTensor}
     */
    run1(a) {
        _assertClass(a, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run1(this.__wbg_ptr, a.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    run2(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run2(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @returns {WasmTensor}
     */
    run3(a, b, c) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run3(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @returns {WasmTensor}
     */
    run4(a, b, c, d) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run4(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @returns {WasmTensor}
     */
    run5(a, b, c, d, e) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run5(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @returns {WasmTensor}
     */
    run6(a, b, c, d, e, f) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run6(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @returns {WasmTensor}
     */
    run7(a, b, c, d, e, f, g) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run7(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @param {WasmTensor} h
     * @returns {WasmTensor}
     */
    run8(a, b, c, d, e, f, g, h) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        _assertClass(h, WasmTensor);
        const ret = wasm.wasmmathprogramv6_run8(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr, h.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmMathProgramV6.prototype[Symbol.dispose] = WasmMathProgramV6.prototype.free;

export class WasmMathProgramV6Builder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV6BuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv6builder_free(ptr, 0);
    }
    /**
     * @param {number} op
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addBinary(op, lhs, rhs, output) {
        const ret = wasm.wasmmathprogramv6builder_addBinary(this.__wbg_ptr, op, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} min
     * @param {number} max
     */
    addClamp(input, output, min, max) {
        const ret = wasm.wasmmathprogramv6builder_addClamp(this.__wbg_ptr, input, output, min, max);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     * @param {number} epsilon
     */
    addCosineSimilarity(lhs, rhs, output, epsilon) {
        const ret = wasm.wasmmathprogramv6builder_addCosineSimilarity(this.__wbg_ptr, lhs, rhs, output, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} reference
     * @param {number} output
     * @param {number} scalar
     */
    addFillLike(reference, output, scalar) {
        const ret = wasm.wasmmathprogramv6builder_addFillLike(this.__wbg_ptr, reference, output, scalar);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} axes
     */
    addPermute(input, output, axes) {
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv6builder_addPermute(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} shape
     */
    addReshape(input, output, shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv6builder_addReshape(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     * @param {Uint32Array} indices
     */
    addSelectAxis(input, output, axis, indices) {
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv6builder_addSelectAxis(this.__wbg_ptr, input, output, axis, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     */
    addSlice(input, output, starts, ends) {
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv6builder_addSlice(this.__wbg_ptr, input, output, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} op
     * @param {number} input
     * @param {number} output
     */
    addUnary(op, input, output) {
        const ret = wasm.wasmmathprogramv6builder_addUnary(this.__wbg_ptr, op, input, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmMathProgramV6}
     */
    compile() {
        const ret = wasm.wasmmathprogramv6builder_compile(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV6.__wrap(ret[0]);
    }
    /**
     * @param {number} num_inputs
     * @param {number} num_slots
     */
    constructor(num_inputs, num_slots) {
        const ret = wasm.wasmmathprogramv6builder_new(num_inputs, num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmMathProgramV6BuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv6builder_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv6builder_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv6builder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     */
    setOutput(slot) {
        const ret = wasm.wasmmathprogramv6builder_setOutput(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmMathProgramV6Builder.prototype[Symbol.dispose] = WasmMathProgramV6Builder.prototype.free;

export class WasmMathProgramV7 {
    static __wrap(ptr) {
        const obj = Object.create(WasmMathProgramV7.prototype);
        obj.__wbg_ptr = ptr;
        WasmMathProgramV7Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV7Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv7_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {WasmMathProgramV7}
     */
    static fromPlan(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv7_fromPlan(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV7.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv7_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv7_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv7_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.wasmmathprogramv7_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmathprogramv7_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.wasmmathprogramv7_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {WasmTensor} a
     * @returns {WasmTensor}
     */
    run1(a) {
        _assertClass(a, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run1(this.__wbg_ptr, a.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    run2(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run2(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @returns {WasmTensor}
     */
    run3(a, b, c) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run3(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @returns {WasmTensor}
     */
    run4(a, b, c, d) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run4(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @returns {WasmTensor}
     */
    run5(a, b, c, d, e) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run5(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @returns {WasmTensor}
     */
    run6(a, b, c, d, e, f) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run6(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @returns {WasmTensor}
     */
    run7(a, b, c, d, e, f, g) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run7(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @param {WasmTensor} h
     * @returns {WasmTensor}
     */
    run8(a, b, c, d, e, f, g, h) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        _assertClass(h, WasmTensor);
        const ret = wasm.wasmmathprogramv7_run8(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr, h.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmMathProgramV7.prototype[Symbol.dispose] = WasmMathProgramV7.prototype.free;

export class WasmMathProgramV7Builder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV7BuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv7builder_free(ptr, 0);
    }
    /**
     * @param {number} op
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addBinary(op, lhs, rhs, output) {
        const ret = wasm.wasmmathprogramv7builder_addBinary(this.__wbg_ptr, op, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} min
     * @param {number} max
     */
    addClamp(input, output, min, max) {
        const ret = wasm.wasmmathprogramv7builder_addClamp(this.__wbg_ptr, input, output, min, max);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     * @param {number} epsilon
     */
    addCosineSimilarity(lhs, rhs, output, epsilon) {
        const ret = wasm.wasmmathprogramv7builder_addCosineSimilarity(this.__wbg_ptr, lhs, rhs, output, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} source
     * @param {number} reference
     * @param {number} output
     */
    addExpandLike(source, reference, output) {
        const ret = wasm.wasmmathprogramv7builder_addExpandLike(this.__wbg_ptr, source, reference, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} reference
     * @param {number} output
     * @param {number} scalar
     */
    addFillLike(reference, output, scalar) {
        const ret = wasm.wasmmathprogramv7builder_addFillLike(this.__wbg_ptr, reference, output, scalar);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} axes
     */
    addPermute(input, output, axes) {
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv7builder_addPermute(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} shape
     */
    addReshape(input, output, shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv7builder_addReshape(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     * @param {Uint32Array} indices
     */
    addSelectAxis(input, output, axis, indices) {
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv7builder_addSelectAxis(this.__wbg_ptr, input, output, axis, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     */
    addSlice(input, output, starts, ends) {
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv7builder_addSlice(this.__wbg_ptr, input, output, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} op
     * @param {number} input
     * @param {number} output
     */
    addUnary(op, input, output) {
        const ret = wasm.wasmmathprogramv7builder_addUnary(this.__wbg_ptr, op, input, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmMathProgramV7}
     */
    compile() {
        const ret = wasm.wasmmathprogramv7builder_compile(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV7.__wrap(ret[0]);
    }
    /**
     * @param {number} num_inputs
     * @param {number} num_slots
     */
    constructor(num_inputs, num_slots) {
        const ret = wasm.wasmmathprogramv7builder_new(num_inputs, num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmMathProgramV7BuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv7builder_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv7builder_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv7builder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     */
    setOutput(slot) {
        const ret = wasm.wasmmathprogramv7builder_setOutput(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmMathProgramV7Builder.prototype[Symbol.dispose] = WasmMathProgramV7Builder.prototype.free;

export class WasmMathProgramV8 {
    static __wrap(ptr) {
        const obj = Object.create(WasmMathProgramV8.prototype);
        obj.__wbg_ptr = ptr;
        WasmMathProgramV8Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV8Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv8_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {WasmMathProgramV8}
     */
    static fromPlan(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv8_fromPlan(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV8.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv8_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv8_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv8_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.wasmmathprogramv8_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmathprogramv8_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.wasmmathprogramv8_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {WasmTensor} a
     * @returns {WasmTensor}
     */
    run1(a) {
        _assertClass(a, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run1(this.__wbg_ptr, a.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    run2(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run2(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @returns {WasmTensor}
     */
    run3(a, b, c) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run3(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @returns {WasmTensor}
     */
    run4(a, b, c, d) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run4(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @returns {WasmTensor}
     */
    run5(a, b, c, d, e) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run5(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @returns {WasmTensor}
     */
    run6(a, b, c, d, e, f) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run6(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @returns {WasmTensor}
     */
    run7(a, b, c, d, e, f, g) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run7(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @param {WasmTensor} h
     * @returns {WasmTensor}
     */
    run8(a, b, c, d, e, f, g, h) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        _assertClass(h, WasmTensor);
        const ret = wasm.wasmmathprogramv8_run8(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr, h.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmMathProgramV8.prototype[Symbol.dispose] = WasmMathProgramV8.prototype.free;

export class WasmMathProgramV8Builder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV8BuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv8builder_free(ptr, 0);
    }
    /**
     * @param {number} op
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addBinary(op, lhs, rhs, output) {
        const ret = wasm.wasmmathprogramv8builder_addBinary(this.__wbg_ptr, op, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} min
     * @param {number} max
     */
    addClamp(input, output, min, max) {
        const ret = wasm.wasmmathprogramv8builder_addClamp(this.__wbg_ptr, input, output, min, max);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     * @param {number} epsilon
     */
    addCosineSimilarity(lhs, rhs, output, epsilon) {
        const ret = wasm.wasmmathprogramv8builder_addCosineSimilarity(this.__wbg_ptr, lhs, rhs, output, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} source
     * @param {number} reference
     * @param {number} output
     */
    addExpandLike(source, reference, output) {
        const ret = wasm.wasmmathprogramv8builder_addExpandLike(this.__wbg_ptr, source, reference, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} reference
     * @param {number} output
     * @param {number} scalar
     */
    addFillLike(reference, output, scalar) {
        const ret = wasm.wasmmathprogramv8builder_addFillLike(this.__wbg_ptr, reference, output, scalar);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addMaxAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv8builder_addMaxAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addMeanAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv8builder_addMeanAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addMinAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv8builder_addMinAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} axes
     */
    addPermute(input, output, axes) {
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv8builder_addPermute(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} shape
     */
    addReshape(input, output, shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv8builder_addReshape(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     * @param {Uint32Array} indices
     */
    addSelectAxis(input, output, axis, indices) {
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv8builder_addSelectAxis(this.__wbg_ptr, input, output, axis, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     */
    addSlice(input, output, starts, ends) {
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv8builder_addSlice(this.__wbg_ptr, input, output, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addSumAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv8builder_addSumAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} op
     * @param {number} input
     * @param {number} output
     */
    addUnary(op, input, output) {
        const ret = wasm.wasmmathprogramv8builder_addUnary(this.__wbg_ptr, op, input, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmMathProgramV8}
     */
    compile() {
        const ret = wasm.wasmmathprogramv8builder_compile(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV8.__wrap(ret[0]);
    }
    /**
     * @param {number} num_inputs
     * @param {number} num_slots
     */
    constructor(num_inputs, num_slots) {
        const ret = wasm.wasmmathprogramv8builder_new(num_inputs, num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmMathProgramV8BuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv8builder_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv8builder_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv8builder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     */
    setOutput(slot) {
        const ret = wasm.wasmmathprogramv8builder_setOutput(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmMathProgramV8Builder.prototype[Symbol.dispose] = WasmMathProgramV8Builder.prototype.free;

export class WasmMathProgramV9 {
    static __wrap(ptr) {
        const obj = Object.create(WasmMathProgramV9.prototype);
        obj.__wbg_ptr = ptr;
        WasmMathProgramV9Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV9Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv9_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} plan
     * @returns {WasmMathProgramV9}
     */
    static fromPlan(plan) {
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv9_fromPlan(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV9.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv9_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv9_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv9_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    outSlot() {
        const ret = wasm.wasmmathprogramv9_outSlot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    programIdentity() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmathprogramv9_programIdentity(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    programPlan() {
        const ret = wasm.wasmmathprogramv9_programPlan(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {WasmTensor} a
     * @returns {WasmTensor}
     */
    run1(a) {
        _assertClass(a, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run1(this.__wbg_ptr, a.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    run2(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run2(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @returns {WasmTensor}
     */
    run3(a, b, c) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run3(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @returns {WasmTensor}
     */
    run4(a, b, c, d) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run4(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @returns {WasmTensor}
     */
    run5(a, b, c, d, e) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run5(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @returns {WasmTensor}
     */
    run6(a, b, c, d, e, f) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run6(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @returns {WasmTensor}
     */
    run7(a, b, c, d, e, f, g) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run7(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @param {WasmTensor} c
     * @param {WasmTensor} d
     * @param {WasmTensor} e
     * @param {WasmTensor} f
     * @param {WasmTensor} g
     * @param {WasmTensor} h
     * @returns {WasmTensor}
     */
    run8(a, b, c, d, e, f, g, h) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        _assertClass(c, WasmTensor);
        _assertClass(d, WasmTensor);
        _assertClass(e, WasmTensor);
        _assertClass(f, WasmTensor);
        _assertClass(g, WasmTensor);
        _assertClass(h, WasmTensor);
        const ret = wasm.wasmmathprogramv9_run8(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr, c.__wbg_ptr, d.__wbg_ptr, e.__wbg_ptr, f.__wbg_ptr, g.__wbg_ptr, h.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmMathProgramV9.prototype[Symbol.dispose] = WasmMathProgramV9.prototype.free;

export class WasmMathProgramV9Builder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMathProgramV9BuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmathprogramv9builder_free(ptr, 0);
    }
    /**
     * @param {number} op
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addBinary(op, lhs, rhs, output) {
        const ret = wasm.wasmmathprogramv9builder_addBinary(this.__wbg_ptr, op, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} min
     * @param {number} max
     */
    addClamp(input, output, min, max) {
        const ret = wasm.wasmmathprogramv9builder_addClamp(this.__wbg_ptr, input, output, min, max);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     * @param {number} epsilon
     */
    addCosineSimilarity(lhs, rhs, output, epsilon) {
        const ret = wasm.wasmmathprogramv9builder_addCosineSimilarity(this.__wbg_ptr, lhs, rhs, output, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} source
     * @param {number} reference
     * @param {number} output
     */
    addExpandLike(source, reference, output) {
        const ret = wasm.wasmmathprogramv9builder_addExpandLike(this.__wbg_ptr, source, reference, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} reference
     * @param {number} output
     * @param {number} scalar
     */
    addFillLike(reference, output, scalar) {
        const ret = wasm.wasmmathprogramv9builder_addFillLike(this.__wbg_ptr, reference, output, scalar);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} reference
     * @param {number} output
     * @param {number} axis
     */
    addIndicesLike(reference, output, axis) {
        const ret = wasm.wasmmathprogramv9builder_addIndicesLike(this.__wbg_ptr, reference, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} lhs
     * @param {number} rhs
     * @param {number} output
     */
    addLessEqual01(lhs, rhs, output) {
        const ret = wasm.wasmmathprogramv9builder_addLessEqual01(this.__wbg_ptr, lhs, rhs, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addMaxAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv9builder_addMaxAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addMeanAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv9builder_addMeanAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addMinAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv9builder_addMinAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} axes
     */
    addPermute(input, output, axes) {
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv9builder_addPermute(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} shape
     */
    addReshape(input, output, shape) {
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv9builder_addReshape(this.__wbg_ptr, input, output, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     * @param {Uint32Array} indices
     */
    addSelectAxis(input, output, axis, indices) {
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv9builder_addSelectAxis(this.__wbg_ptr, input, output, axis, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     */
    addSlice(input, output, starts, ends) {
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmathprogramv9builder_addSlice(this.__wbg_ptr, input, output, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} input
     * @param {number} output
     * @param {number} axis
     */
    addSumAxis(input, output, axis) {
        const ret = wasm.wasmmathprogramv9builder_addSumAxis(this.__wbg_ptr, input, output, axis);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} op
     * @param {number} input
     * @param {number} output
     */
    addUnary(op, input, output) {
        const ret = wasm.wasmmathprogramv9builder_addUnary(this.__wbg_ptr, op, input, output);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {WasmMathProgramV9}
     */
    compile() {
        const ret = wasm.wasmmathprogramv9builder_compile(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMathProgramV9.__wrap(ret[0]);
    }
    /**
     * @param {number} num_inputs
     * @param {number} num_slots
     */
    constructor(num_inputs, num_slots) {
        const ret = wasm.wasmmathprogramv9builder_new(num_inputs, num_slots);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmMathProgramV9BuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    numInputs() {
        const ret = wasm.wasmmathprogramv9builder_numInputs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSlots() {
        const ret = wasm.wasmmathprogramv9builder_numSlots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    numSteps() {
        const ret = wasm.wasmmathprogramv9builder_numSteps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} slot
     */
    setOutput(slot) {
        const ret = wasm.wasmmathprogramv9builder_setOutput(this.__wbg_ptr, slot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmMathProgramV9Builder.prototype[Symbol.dispose] = WasmMathProgramV9Builder.prototype.free;

export class WasmNorm {
    static __wrap(ptr) {
        const obj = Object.create(WasmNorm.prototype);
        obj.__wbg_ptr = ptr;
        WasmNormFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmNormFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmnorm_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmnorm_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * WARNING — load-bearing invariant: the segment list and order here MUST
     * stay in sync with `weight_segs()` / `weights_len()` below.
     * `GraphParameterBinding::build()` derives binding offsets from
     * `weights_len()` alone, so drift here silently corrupts parameter
     * slicing in get/setGraphParametersFlat. If you change this function,
     * update `weight_segs()` and extend the
     * `weights_flat_len_is_length_aware_alias_of_flat_len` test.
     * @returns {Float32Array}
     */
    getWeightsFlat() {
        const ret = wasm.wasmnorm_getWeightsFlat(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get_state() {
        const ret = wasm.wasmnorm_get_state(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} data
     */
    load_state(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmnorm_load_state(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} num_features
     * @param {number | null} [epsilon]
     * @returns {WasmNorm}
     */
    static new_batch_norm(num_features, epsilon) {
        const ret = wasm.wasmnorm_new_batch_norm(num_features, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        return WasmNorm.__wrap(ret);
    }
    /**
     * @param {number} num_groups
     * @param {number} num_channels
     * @param {number | null} [epsilon]
     * @returns {WasmNorm}
     */
    static new_group_norm(num_groups, num_channels, epsilon) {
        const ret = wasm.wasmnorm_new_group_norm(num_groups, num_channels, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        return WasmNorm.__wrap(ret);
    }
    /**
     * @param {number} num_channels
     * @param {number | null} [epsilon]
     * @returns {WasmNorm}
     */
    static new_instance_norm(num_channels, epsilon) {
        const ret = wasm.wasmnorm_new_instance_norm(num_channels, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        return WasmNorm.__wrap(ret);
    }
    /**
     * @param {number} size
     * @param {number | null} [epsilon]
     * @returns {WasmNorm}
     */
    static new_layer_norm(size, epsilon) {
        const ret = wasm.wasmnorm_new_layer_norm(size, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        return WasmNorm.__wrap(ret);
    }
    /**
     * @param {number} size
     * @param {number | null} [epsilon]
     * @returns {WasmNorm}
     */
    static new_rms_norm(size, epsilon) {
        const ret = wasm.wasmnorm_new_rms_norm(size, !isLikeNone(epsilon), isLikeNone(epsilon) ? 0 : epsilon);
        return WasmNorm.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmnorm_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Float32Array} data
     */
    setWeightsFlat(data) {
        const ptr0 = passArrayF32ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmnorm_setWeightsFlat(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WasmNorm.prototype[Symbol.dispose] = WasmNorm.prototype.free;

/**
 * Stateless Burn-backed primitive math surface.
 *
 * Numeric Kernel v1 intentionally forbids implicit broadcasting and rejects invalid numerical
 * domains as controlled errors instead of silently producing NaN/Inf. It is a lower-level math
 * primitive, not a neural layer or graph policy.
 */
export class WasmNumericKernel {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmNumericKernelFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmnumerickernel_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    abs(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmnumerickernel_abs(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    add(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmnumerickernel_add(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {boolean}
     */
    allFinite(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmnumerickernel_allFinite(this.__wbg_ptr, input.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {WasmTensor} input
     * @param {number} min
     * @param {number} max
     * @returns {WasmTensor}
     */
    clamp(input, min, max) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmnumerickernel_clamp(this.__wbg_ptr, input.__wbg_ptr, min, max);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    div(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmnumerickernel_div(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    exp(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmnumerickernel_exp(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    log(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmnumerickernel_log(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    mul(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmnumerickernel_mul(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.wasmnumerickernel_new();
        this.__wbg_ptr = ret;
        WasmNumericKernelFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    sqrt(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmnumerickernel_sqrt(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} a
     * @param {WasmTensor} b
     * @returns {WasmTensor}
     */
    sub(a, b) {
        _assertClass(a, WasmTensor);
        _assertClass(b, WasmTensor);
        const ret = wasm.wasmnumerickernel_sub(this.__wbg_ptr, a.__wbg_ptr, b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmNumericKernel.prototype[Symbol.dispose] = WasmNumericKernel.prototype.free;

export class WasmPool {
    static __wrap(ptr) {
        const obj = Object.create(WasmPool.prototype);
        obj.__wbg_ptr = ptr;
        WasmPoolFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPoolFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpool_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmpool_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * @param {number} output_size_h
     * @param {number} output_size_w
     * @returns {WasmPool}
     */
    static newAdaptiveAvgPool2d(output_size_h, output_size_w) {
        const ret = wasm.wasmpool_newAdaptiveAvgPool2d(output_size_h, output_size_w);
        return WasmPool.__wrap(ret);
    }
    /**
     * @param {number} kernel_size
     * @param {number | null} [stride]
     * @param {number | null} [padding]
     * @returns {WasmPool}
     */
    static newAvgPool1d(kernel_size, stride, padding) {
        const ret = wasm.wasmpool_newAvgPool1d(kernel_size, isLikeNone(stride) ? Number.MAX_SAFE_INTEGER : (stride) >>> 0, isLikeNone(padding) ? Number.MAX_SAFE_INTEGER : (padding) >>> 0);
        return WasmPool.__wrap(ret);
    }
    /**
     * @param {number} kernel_size_h
     * @param {number} kernel_size_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {WasmPool}
     */
    static newAvgPool2d(kernel_size_h, kernel_size_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.wasmpool_newAvgPool2d(kernel_size_h, kernel_size_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        return WasmPool.__wrap(ret);
    }
    /**
     * @param {number} kernel_size
     * @param {number | null} [stride]
     * @param {number | null} [padding]
     * @returns {WasmPool}
     */
    static newMaxPool1d(kernel_size, stride, padding) {
        const ret = wasm.wasmpool_newMaxPool1d(kernel_size, isLikeNone(stride) ? Number.MAX_SAFE_INTEGER : (stride) >>> 0, isLikeNone(padding) ? Number.MAX_SAFE_INTEGER : (padding) >>> 0);
        return WasmPool.__wrap(ret);
    }
    /**
     * @param {number} kernel_size_h
     * @param {number} kernel_size_w
     * @param {number | null} [stride_h]
     * @param {number | null} [stride_w]
     * @param {number | null} [padding_h]
     * @param {number | null} [padding_w]
     * @returns {WasmPool}
     */
    static newMaxPool2d(kernel_size_h, kernel_size_w, stride_h, stride_w, padding_h, padding_w) {
        const ret = wasm.wasmpool_newMaxPool2d(kernel_size_h, kernel_size_w, isLikeNone(stride_h) ? Number.MAX_SAFE_INTEGER : (stride_h) >>> 0, isLikeNone(stride_w) ? Number.MAX_SAFE_INTEGER : (stride_w) >>> 0, isLikeNone(padding_h) ? Number.MAX_SAFE_INTEGER : (padding_h) >>> 0, isLikeNone(padding_w) ? Number.MAX_SAFE_INTEGER : (padding_w) >>> 0);
        return WasmPool.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmpool_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) WasmPool.prototype[Symbol.dispose] = WasmPool.prototype.free;

/**
 * Deterministic probability-distribution math over `[B,F,1,1]` tensors.
 *
 * Entropy, cross-entropy and KL require normalized distributions. Zero-probability
 * P entries contribute exactly zero. Q support must cover every positive P entry.
 */
export class WasmProbability {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmProbabilityFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmprobability_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} p
     * @param {WasmTensor} q
     * @returns {WasmTensor}
     */
    crossEntropy(p, q) {
        _assertClass(p, WasmTensor);
        _assertClass(q, WasmTensor);
        const ret = wasm.wasmprobability_crossEntropy(this.__wbg_ptr, p.__wbg_ptr, q.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} p
     * @returns {WasmTensor}
     */
    entropy(p) {
        _assertClass(p, WasmTensor);
        const ret = wasm.wasmprobability_entropy(this.__wbg_ptr, p.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} p
     * @param {WasmTensor} q
     * @returns {WasmTensor}
     */
    klDivergence(p, q) {
        _assertClass(p, WasmTensor);
        _assertClass(q, WasmTensor);
        const ret = wasm.wasmprobability_klDivergence(this.__wbg_ptr, p.__wbg_ptr, q.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.wasmprobability_new();
        this.__wbg_ptr = ret;
        WasmProbabilityFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    normalize(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmprobability_normalize(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmProbability.prototype[Symbol.dispose] = WasmProbability.prototype.free;

export class WasmReduction {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmReductionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmreduction_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @param {number} axis
     * @returns {WasmTensor}
     */
    maxAxis(input, axis) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmreduction_maxAxis(this.__wbg_ptr, input.__wbg_ptr, axis);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @param {number} axis
     * @returns {WasmTensor}
     */
    meanAxis(input, axis) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmreduction_meanAxis(this.__wbg_ptr, input.__wbg_ptr, axis);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @param {number} axis
     * @returns {WasmTensor}
     */
    minAxis(input, axis) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmreduction_minAxis(this.__wbg_ptr, input.__wbg_ptr, axis);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.wasmreduction_new();
        this.__wbg_ptr = ret;
        WasmReductionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmTensor} input
     * @param {number} axis
     * @returns {WasmTensor}
     */
    sumAxis(input, axis) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmreduction_sumAxis(this.__wbg_ptr, input.__wbg_ptr, axis);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmReduction.prototype[Symbol.dispose] = WasmReduction.prototype.free;

export class WasmSeBlock {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSeBlockFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmseblock_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmseblock_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * @returns {Uint8Array}
     */
    get_state() {
        const ret = wasm.wasmseblock_get_state(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} data
     */
    load_state(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmseblock_load_state(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmseblock_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Fallible constructor (complaint #14): invalid configs are a per-call
     * `Err`, never a panic/`throw_str`, so corrupt bundle bytes cannot wedge
     * the in-process WASM runtime.
     * @param {number} channels
     * @param {number | null} [reduction]
     */
    constructor(channels, reduction) {
        const ret = wasm.wasmseblock_try_new(channels, isLikeNone(reduction) ? Number.MAX_SAFE_INTEGER : (reduction) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        WasmSeBlockFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) WasmSeBlock.prototype[Symbol.dispose] = WasmSeBlock.prototype.free;

export class WasmShift {
    static __wrap(ptr) {
        const obj = Object.create(WasmShift.prototype);
        obj.__wbg_ptr = ptr;
        WasmShiftFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmShiftFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmshift_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    forward(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmshift_forward(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * @param {number} shift_size
     * @returns {WasmShift}
     */
    static newShiftDown(shift_size) {
        const ret = wasm.wasmshift_newShiftDown(shift_size);
        return WasmShift.__wrap(ret);
    }
    /**
     * @param {number} shift_size
     * @returns {WasmShift}
     */
    static newShiftLeft(shift_size) {
        const ret = wasm.wasmshift_newShiftLeft(shift_size);
        return WasmShift.__wrap(ret);
    }
    /**
     * @param {number} shift_size
     * @returns {WasmShift}
     */
    static newShiftRight(shift_size) {
        const ret = wasm.wasmshift_newShiftRight(shift_size);
        return WasmShift.__wrap(ret);
    }
    /**
     * @param {number} shift_size
     * @returns {WasmShift}
     */
    static newShiftUp(shift_size) {
        const ret = wasm.wasmshift_newShiftUp(shift_size);
        return WasmShift.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    num_params() {
        const ret = wasm.wasmshift_num_params(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) WasmShift.prototype[Symbol.dispose] = WasmShift.prototype.free;

/**
 * Stateless descriptive-statistics surface for canonical feature tensors `[B,F,1,1]`.
 *
 * All reducers operate across feature axis 1 and retain the canonical rank-4 bridge,
 * producing `[B,1,1,1]`. Variance and standard deviation use population semantics.
 */
export class WasmStatistics {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmStatisticsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmstatistics_free(ptr, 0);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    max(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmstatistics_max(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    mean(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmstatistics_mean(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    min(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmstatistics_min(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.wasmstatistics_new();
        this.__wbg_ptr = ret;
        WasmStatisticsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    stdPopulation(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmstatistics_stdPopulation(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    sum(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmstatistics_sum(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    variancePopulation(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmstatistics_variancePopulation(this.__wbg_ptr, input.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
}
if (Symbol.dispose) WasmStatistics.prototype[Symbol.dispose] = WasmStatistics.prototype.free;

export class WasmTensor {
    static __wrap(ptr) {
        const obj = Object.create(WasmTensor.prototype);
        obj.__wbg_ptr = ptr;
        WasmTensorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTensorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtensor_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    byte_length() {
        const ret = wasm.wasmtensor_byte_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {TensorView} view
     * @returns {WasmTensor}
     */
    static fromTensorView(view) {
        _assertClass(view, TensorView);
        const ret = wasm.wasmtensor_fromTensorView(view.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
    /**
     * @param {Float32Array} data
     * @param {Uint32Array} shape
     */
    constructor(data, shape) {
        const ptr0 = passArrayF32ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtensor_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret;
        WasmTensorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Uint32Array}
     */
    shape() {
        const ret = wasm.wasmtensor_shape(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {TensorView} view
     */
    toTensorView(view) {
        _assertClass(view, TensorView);
        const ret = wasm.wasmtensor_toTensorView(this.__wbg_ptr, view.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {Float32Array}
     */
    to_array() {
        const ret = wasm.wasmtensor_to_array(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) WasmTensor.prototype[Symbol.dispose] = WasmTensor.prototype.free;

/**
 * Stateless rank-4 tensor/layout transform surface.
 *
 * Every operation validates shape/axis/range/index metadata before calling Burn so malformed
 * requests fail as controlled errors rather than backend panics or unchecked indexing behavior.
 */
export class WasmTensorTransform {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTensorTransformFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtensortransform_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmtensortransform_new();
        this.__wbg_ptr = ret;
        WasmTensorTransformFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmTensor} input
     * @param {Uint32Array} axes
     * @returns {WasmTensor}
     */
    permute(input, axes) {
        _assertClass(input, WasmTensor);
        const ptr0 = passArray32ToWasm0(axes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtensortransform_permute(this.__wbg_ptr, input.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @param {Uint32Array} shape
     * @returns {WasmTensor}
     */
    reshape(input, shape) {
        _assertClass(input, WasmTensor);
        const ptr0 = passArray32ToWasm0(shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtensortransform_reshape(this.__wbg_ptr, input.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @param {number} axis
     * @param {Uint32Array} indices
     * @returns {WasmTensor}
     */
    selectAxis(input, axis, indices) {
        _assertClass(input, WasmTensor);
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtensortransform_selectAxis(this.__wbg_ptr, input.__wbg_ptr, axis, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @param {Uint32Array} starts
     * @param {Uint32Array} ends
     * @returns {WasmTensor}
     */
    slice(input, starts, ends) {
        _assertClass(input, WasmTensor);
        const ptr0 = passArray32ToWasm0(starts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(ends, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtensortransform_slice(this.__wbg_ptr, input.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTensor.__wrap(ret[0]);
    }
    /**
     * @param {WasmTensor} input
     * @returns {WasmTensor}
     */
    transpose(input) {
        _assertClass(input, WasmTensor);
        const ret = wasm.wasmtensortransform_transpose(this.__wbg_ptr, input.__wbg_ptr);
        return WasmTensor.__wrap(ret);
    }
}
if (Symbol.dispose) WasmTensorTransform.prototype[Symbol.dispose] = WasmTensorTransform.prototype.free;

/**
 * Return a compact, machine-readable description of the stable WASM capabilities.
 *
 * Agents should call this once before planning numerical work instead of inferring
 * features from generated JS glue or repeatedly probing exports.
 * @returns {string}
 */
export function agentCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.agentCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return the canonical machine-readable contract manifest used by agents and future fuzzers.
 * @returns {string}
 */
export function agentContractSchema() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.agentContractSchema();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return the contract schema version without requiring JSON parsing during capability discovery.
 * @returns {number}
 */
export function agentContractSchemaVersion() {
    const ret = wasm.agentContractSchemaVersion();
    return ret >>> 0;
}

/**
 * Return the complete typed AgentLayerSpec constructor catalog.
 *
 * The catalog is embedded from a versioned JSON contract so agents can discover
 * all advertised constructor signatures without reading generated JS/TS glue.
 * @returns {string}
 */
export function agentLayerCatalog() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.agentLayerCatalog();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Compare a producer's declared output layout with a consumer's declared input layout.
 * `unknown` is intentionally not an error: it means runtime Burn/shape validation is still needed.
 * @param {AgentLayerSpec} producer
 * @param {AgentLayerSpec} consumer
 * @returns {string}
 */
export function agentLayoutCompatibility(producer, consumer) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(producer, AgentLayerSpec);
        _assertClass(consumer, AgentLayerSpec);
        const ret = wasm.agentLayoutCompatibility(producer.__wbg_ptr, consumer.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return the companion tensor-layout contract. Burn tensor/module semantics remain authoritative;
 * this schema only defines how the rank-4 agent adapter interprets axes between layers.
 * @returns {string}
 */
export function agentLayoutContract() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.agentLayoutContract();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {number}
 */
export function agentLayoutContractVersion() {
    const ret = wasm.agentLayoutContractVersion();
    return ret >>> 0;
}

/**
 * Return the input/output layout profile for one typed layer spec.
 * @param {AgentLayerSpec} spec
 * @returns {string}
 */
export function agentSpecLayout(spec) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(spec, AgentLayerSpec);
        const ret = wasm.agentSpecLayout(spec.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {InputPortConsumerSpec} consumer
 * @param {number} step_index
 * @returns {boolean}
 */
export function bindInputPortConsumerEdge(workspace, builder, consumer, step_index) {
    _assertClass(workspace, AgentWorkspace);
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(consumer, InputPortConsumerSpec);
    const ret = wasm.bindInputPortConsumerEdge(workspace.__wbg_ptr, builder.__wbg_ptr, consumer.__wbg_ptr, step_index);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {SemanticTransitionSpec} spec
 * @param {number} step_index
 * @returns {boolean}
 */
export function bindSemanticLifecycleTransition(workspace, builder, spec, step_index) {
    _assertClass(workspace, AgentWorkspace);
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(spec, SemanticTransitionSpec);
    const ret = wasm.bindSemanticLifecycleTransition(workspace.__wbg_ptr, builder.__wbg_ptr, spec.__wbg_ptr, step_index);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * @returns {string}
 */
export function checkpointBranchCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.checkpointBranchCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function comparisonCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.comparisonCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

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
 * @param {Uint8Array} data
 * @returns {string}
 */
export function decodeGuardCheck(data) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.decodeGuardCheck(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Describe the semantic graph topology currently held by AgentGraphBuilder.
 *
 * Workspace metadata is used only when available to recover constructor/variant
 * labels. Missing metadata is reported as unknown rather than inferred.
 * LayerRegistry is used only to report live execution binding/provenance.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @returns {string}
 */
export function describeGraph(workspace, builder, registry) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.describeGraph(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Describe AgentWorkspace as semantic read-only state.
 *
 * LayerRegistry is supplied only to report whether initialized workspace metadata
 * is still bound to live execution state. Neither input is mutated.
 * @param {AgentWorkspace} workspace
 * @param {LayerRegistry} registry
 * @returns {string}
 */
export function describeWorkspace(workspace, registry) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.describeWorkspace(workspace.__wbg_ptr, registry.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Machine-readable ES contracts for agent planning.
 * @returns {string}
 */
export function esCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.esCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {CompiledMultiInputGraph} graph
 * @param {LayerRegistry} registry
 * @param {boolean} include_state
 * @returns {Uint8Array}
 */
export function exportMultiInputProgramBundle(graph, registry, include_state) {
    _assertClass(graph, CompiledMultiInputGraph);
    _assertClass(registry, LayerRegistry);
    const ret = wasm.exportMultiInputProgramBundle(graph.__wbg_ptr, registry.__wbg_ptr, include_state);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
}

/**
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @param {boolean} include_state
 * @returns {Uint8Array}
 */
export function exportProgramBundle(graph, registry, include_state) {
    _assertClass(graph, CompiledGraph);
    _assertClass(registry, LayerRegistry);
    const ret = wasm.exportProgramBundle(graph.__wbg_ptr, registry.__wbg_ptr, include_state);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
}

/**
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @returns {Float32Array}
 */
export function getGraphParametersFlat(graph, registry) {
    _assertClass(graph, CompiledGraph);
    _assertClass(registry, LayerRegistry);
    const ret = wasm.getGraphParametersFlat(graph.__wbg_ptr, registry.__wbg_ptr);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * @returns {string}
 */
export function graphParameterCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.graphParameterCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @returns {string}
 */
export function graphParameterIdentity(graph, registry) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(graph, CompiledGraph);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.graphParameterIdentity(graph.__wbg_ptr, registry.__wbg_ptr);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @returns {string}
 */
export function graphParameterLayout(graph, registry) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(graph, CompiledGraph);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.graphParameterLayout(graph.__wbg_ptr, registry.__wbg_ptr);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {LayerRegistry} registry
 * @param {Uint8Array} bundle
 * @returns {CompiledMultiInputGraph}
 */
export function importMultiInputProgramBundle(registry, bundle) {
    _assertClass(registry, LayerRegistry);
    const ptr0 = passArray8ToWasm0(bundle, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.importMultiInputProgramBundle(registry.__wbg_ptr, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return CompiledMultiInputGraph.__wrap(ret[0]);
}

/**
 * @param {LayerRegistry} registry
 * @param {Uint8Array} bundle
 * @returns {CompiledGraph}
 */
export function importProgramBundle(registry, bundle) {
    _assertClass(registry, LayerRegistry);
    const ptr0 = passArray8ToWasm0(bundle, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.importProgramBundle(registry.__wbg_ptr, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return CompiledGraph.__wrap(ret[0]);
}

/**
 * @returns {string}
 */
export function indexSourceCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.indexSourceCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return the embedded contract for optional external input metadata.
 * @returns {string}
 */
export function inputContractCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.inputContractCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Compare the current optional input contract against one typed consumer spec.
 *
 * Unbound and unknown are not failures. Incompatible means the declared
 * shape/layout proves the consumer cannot accept the external input without an
 * explicit transform.
 * @param {AgentWorkspace} workspace
 * @param {AgentLayerSpec} consumer
 * @returns {string}
 */
export function inputContractCompatibility(workspace, consumer) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(consumer, AgentLayerSpec);
        const ret = wasm.inputContractCompatibility(workspace.__wbg_ptr, consumer.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function inputPortCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.inputPortCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function inputPortConsumerCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.inputPortConsumerCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {InputPortConsumerSpec} consumer
 * @returns {string}
 */
export function inputPortConsumerCompatibility(workspace, consumer) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(consumer, InputPortConsumerSpec);
        const ret = wasm.inputPortConsumerCompatibility(workspace.__wbg_ptr, consumer.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {number} step_index
 * @returns {string}
 */
export function inputPortConsumerEdgeBinding(workspace, builder, step_index) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        const ret = wasm.inputPortConsumerEdgeBinding(workspace.__wbg_ptr, builder.__wbg_ptr, step_index);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {InputPortConsumerSpec} consumer
 * @param {number} step_index
 * @returns {string}
 */
export function inputPortConsumerEdgeCompatibility(workspace, builder, consumer, step_index) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(consumer, InputPortConsumerSpec);
        const ret = wasm.inputPortConsumerEdgeCompatibility(workspace.__wbg_ptr, builder.__wbg_ptr, consumer.__wbg_ptr, step_index);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @returns {string}
 */
export function inputPortEdgeBindingCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.inputPortEdgeBindingCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function inputPortRoutingCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.inputPortRoutingCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Describe the projection-only interaction surface layered above existing
 * workspace, builder, and registry authorities.
 * @returns {string}
 */
export function interactionCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.interactionCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {number} output_slot
 * @returns {string}
 */
export function interactionCheckCompile(builder, registry, output_slot) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.interactionCheckCompile(builder.__wbg_ptr, registry.__wbg_ptr, output_slot);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {AgentLayerSpec} spec
 * @param {number} left_slot
 * @param {number} right_slot
 * @param {string} label
 * @returns {string}
 */
export function interactionCheckInitBinary(workspace, builder, registry, spec, left_slot, right_slot, label) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(registry, LayerRegistry);
        _assertClass(spec, AgentLayerSpec);
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.interactionCheckInitBinary(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, spec.__wbg_ptr, left_slot, right_slot, ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {AgentLayerSpec} spec
 * @param {number} input_slot
 * @param {string} label
 * @returns {string}
 */
export function interactionCheckInitUnary(workspace, builder, registry, spec, input_slot, label) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(registry, LayerRegistry);
        _assertClass(spec, AgentLayerSpec);
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.interactionCheckInitUnary(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, spec.__wbg_ptr, input_slot, ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {number} slot
 * @returns {string}
 */
export function interactionCheckReleaseSlot(workspace, slot) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ret = wasm.interactionCheckReleaseSlot(workspace.__wbg_ptr, slot);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {string} owner
 * @returns {string}
 */
export function interactionCheckReserveSlot(workspace, owner) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passStringToWasm0(owner, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.interactionCheckReserveSlot(workspace.__wbg_ptr, ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Machine-readable description of the non-mutating action-preflight fault surface.
 * @returns {string}
 */
export function interactionFaultCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.interactionFaultCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Produce a compact point-in-time projection for agent planning.
 *
 * No new source of truth is introduced: every field is derived from the
 * supplied workspace, graph builder, and registry.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @returns {string}
 */
export function interactionSnapshot(workspace, builder, registry) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.interactionSnapshot(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Return the currently state-admissible canonical interaction families.
 *
 * This is a read-only projection. Availability means the current state admits
 * at least one valid argument assignment; operation-specific validation remains
 * authoritative at the actual call boundary.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @returns {string}
 */
export function interactionValidActions(workspace, builder, registry) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.interactionValidActions(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {InputPortConsumerSpec} consumer
 * @returns {string}
 */
export function interactionValidActionsForInputConsumer(workspace, builder, registry, consumer) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(registry, LayerRegistry);
        _assertClass(consumer, InputPortConsumerSpec);
        const ret = wasm.interactionValidActionsForInputConsumer(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, consumer.__wbg_ptr);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Return the semantic-introspection contract embedded in the WASM artifact.
 * @returns {string}
 */
export function introspectionCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.introspectionCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function layerRegistryInventoryCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.layerRegistryInventoryCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function layerRegistryOperationBindingCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.layerRegistryOperationBindingCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function linearAlgebraCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.linearAlgebraCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Validate only operation metadata that can be proven without reading tensor values.
 *
 * u32_params carries shape/axis/index metadata and f32_params carries scalar
 * operation parameters. Value-domain predicates remain explicitly deferred to the
 * authoritative direct/program execution surface.
 * @param {string} operation_id
 * @param {Uint32Array} lhs_shape
 * @param {Uint32Array} rhs_shape
 * @param {Uint32Array} u32_params
 * @param {Float32Array} f32_params
 * @returns {string}
 */
export function mathCheckOperation(operation_id, lhs_shape, rhs_shape, u32_params, f32_params) {
    let deferred7_0;
    let deferred7_1;
    try {
        const ptr0 = passStringToWasm0(operation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(lhs_shape, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray32ToWasm0(rhs_shape, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray32ToWasm0(u32_params, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF32ToWasm0(f32_params, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.mathCheckOperation(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        var ptr6 = ret[0];
        var len6 = ret[1];
        if (ret[3]) {
            ptr6 = 0; len6 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred7_0 = ptr6;
        deferred7_1 = len6;
        return getStringFromWasm0(ptr6, len6);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
}

/**
 * Describe one canonical operation without executing it or selecting it for the agent.
 * @param {string} operation_id
 * @returns {string}
 */
export function mathDescribeOperation(operation_id) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(operation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mathDescribeOperation(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Machine-readable authority and lifecycle description for the unified math vocabulary.
 *
 * This layer is discovery/projection only. It owns no tensor, program, execution,
 * verification, or Resolution state.
 * @returns {string}
 */
export function mathInteractionCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathInteractionCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return canonical math operation IDs and their bindings to existing direct/program surfaces.
 *
 * The catalog intentionally delegates detailed numerical/domain constraints to the existing
 * per-family capability contracts instead of becoming a second semantic authority.
 * @returns {string}
 */
export function mathOperationCatalog() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathOperationCatalog();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Translate a canonical operation into an explicit direct or MathProgram binding plan.
 *
 * The caller must choose target="direct" or target="program". This function validates
 * metadata through mathCheckOperation, but never calls the direct method, never mutates
 * a MathProgram builder, and never chooses a target or program generation.
 * @param {string} operation_id
 * @param {string} target
 * @param {Uint32Array} lhs_shape
 * @param {Uint32Array} rhs_shape
 * @param {Uint32Array} u32_params
 * @param {Float32Array} f32_params
 * @returns {string}
 */
export function mathPlanBinding(operation_id, target, lhs_shape, rhs_shape, u32_params, f32_params) {
    let deferred8_0;
    let deferred8_1;
    try {
        const ptr0 = passStringToWasm0(operation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(target, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray32ToWasm0(lhs_shape, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray32ToWasm0(rhs_shape, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArray32ToWasm0(u32_params, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passArrayF32ToWasm0(f32_params, wasm.__wbindgen_malloc);
        const len5 = WASM_VECTOR_LEN;
        const ret = wasm.mathPlanBinding(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        var ptr7 = ret[0];
        var len7 = ret[1];
        if (ret[3]) {
            ptr7 = 0; len7 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred8_0 = ptr7;
        deferred8_1 = len7;
        return getStringFromWasm0(ptr7, len7);
    } finally {
        wasm.__wbindgen_free(deferred8_0, deferred8_1, 1);
    }
}

/**
 * @returns {string}
 */
export function mathProgramCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProgramCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function mathProgramV4Capabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProgramV4Capabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function mathProgramV5Capabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProgramV5Capabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function mathProgramV6Capabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProgramV6Capabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function mathProgramV7Capabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProgramV7Capabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function mathProgramV8Capabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProgramV8Capabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function mathProgramV9Capabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProgramV9Capabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return the MathProgram proof/correlation authority contract.
 * @returns {string}
 */
export function mathProofCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.mathProofCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Project all canonical math operations against available operand-shape metadata.
 *
 * This is a candidate filter, not a chooser. Unary operations are evaluated against
 * lhs independently even when rhs is available. Binary operations require rhs.
 * Operations needing operation-specific parameters are retained as candidates with
 * status requires_parameters rather than being falsely rejected for missing params.
 * @param {Uint32Array} lhs_shape
 * @param {Uint32Array} rhs_shape
 * @returns {string}
 */
export function mathValidOperations(lhs_shape, rhs_shape) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passArray32ToWasm0(lhs_shape, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(rhs_shape, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.mathValidOperations(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Compare an external implementation result with a trusted numerical reference.
 *
 * This is intentionally dependency-free and returns compact JSON so an agent can
 * consume the proof result without coupling the produced artifact to this WASM runtime.
 * @param {Float32Array} reference
 * @param {Float32Array} candidate
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @returns {string}
 */
export function mathVerifyVectors(reference, candidate, abs_tol, rel_tol) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passArrayF32ToWasm0(reference, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.mathVerifyVectors(ptr0, len0, ptr1, len1, abs_tol, rel_tol);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @returns {string}
 */
export function multiInputGraphCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.multiInputGraphCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function multiInputProgramBundleCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.multiInputProgramBundleCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function numericKernelCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.numericKernelCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function probabilityCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.probabilityCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function programBundleCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.programBundleCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function programCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.programCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return the embedded proof-provenance contract.
 * @returns {string}
 */
export function proofProvenanceCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.proofProvenanceCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function reductionCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.reductionCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function resolutionRuntimeBridgeCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.resolutionRuntimeBridgeCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function runtimeResolutionEvidenceCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.runtimeResolutionEvidenceCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentGraphBuilder} builder
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @returns {string}
 */
export function semanticExecutionContext(builder, graph, registry) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(graph, CompiledGraph);
        _assertClass(registry, LayerRegistry);
        const ret = wasm.semanticExecutionContext(builder.__wbg_ptr, graph.__wbg_ptr, registry.__wbg_ptr);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @returns {string}
 */
export function semanticExecutionContextCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.semanticExecutionContextCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentGraphBuilder} builder
 * @returns {string}
 */
export function semanticGraphIdentity(builder) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(builder, AgentGraphBuilder);
        const ret = wasm.semanticGraphIdentity(builder.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function semanticIngressManifestCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.semanticIngressManifestCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {SemanticIngressManifest} manifest
 * @returns {string}
 */
export function semanticIngressManifestStatus(workspace, manifest) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(manifest, SemanticIngressManifest);
        const ret = wasm.semanticIngressManifestStatus(workspace.__wbg_ptr, manifest.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function semanticIngressManifestV2Capabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.semanticIngressManifestV2Capabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function semanticLifecycleCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.semanticLifecycleCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentGraphBuilder} builder
 * @returns {string}
 */
export function semanticLifecycleIdentity(builder) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(builder, AgentGraphBuilder);
        const ret = wasm.semanticLifecycleIdentity(builder.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentGraphBuilder} builder
 * @returns {string}
 */
export function semanticLifecycleProjection(builder) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(builder, AgentGraphBuilder);
        const ret = wasm.semanticLifecycleProjection(builder.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentGraphBuilder} builder
 * @param {number} step_index
 * @returns {string}
 */
export function semanticLifecycleTransition(builder, step_index) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(builder, AgentGraphBuilder);
        const ret = wasm.semanticLifecycleTransition(builder.__wbg_ptr, step_index);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @param {Float32Array} candidate
 */
export function setGraphParametersFlat(graph, registry, candidate) {
    _assertClass(graph, CompiledGraph);
    _assertClass(registry, LayerRegistry);
    const ptr0 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.setGraphParametersFlat(graph.__wbg_ptr, registry.__wbg_ptr, ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @returns {string}
 */
export function statisticsCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.statisticsCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {string}
 */
export function tensorTransformCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.tensorTransformCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Reject only known semantic layout mismatches. No implicit transpose/reshape is inserted.
 * @param {AgentLayerSpec} producer
 * @param {AgentLayerSpec} consumer
 */
export function validateAgentLayoutEdge(producer, consumer) {
    _assertClass(producer, AgentLayerSpec);
    _assertClass(consumer, AgentLayerSpec);
    const ret = wasm.validateAgentLayoutEdge(producer.__wbg_ptr, consumer.__wbg_ptr);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Bind optional shape/layout metadata to the canonical external input slot 0.
 *
 * This mutates AgentWorkspace metadata only. It does not allocate tensors,
 * initialize layers, alter the graph plan, or mutate LayerRegistry.
 * @param {AgentWorkspace} workspace
 * @param {number} dim0
 * @param {number} dim1
 * @param {number} dim2
 * @param {number} dim3
 * @param {string} layout
 * @param {string} semantics
 */
export function workspaceBindInputContract(workspace, dim0, dim1, dim2, dim3, layout, semantics) {
    _assertClass(workspace, AgentWorkspace);
    const ptr0 = passStringToWasm0(layout, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(semantics, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.workspaceBindInputContract(workspace.__wbg_ptr, dim0, dim1, dim2, dim3, ptr0, len0, ptr1, len1);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {string} role
 * @param {string} source
 * @param {bigint} revision
 * @param {string} fingerprint
 * @returns {boolean}
 */
export function workspaceBindInputPortMetadata(workspace, role, source, revision, fingerprint) {
    _assertClass(workspace, AgentWorkspace);
    const ptr0 = passStringToWasm0(role, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(fingerprint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.workspaceBindInputPortMetadata(workspace.__wbg_ptr, ptr0, len0, ptr1, len1, revision, ptr2, len2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * Bind the canonical one-step MathProgramV9 reference identity for a direct math operation.
 *
 * This does not execute the direct operation. It validates metadata through mathCheckOperation,
 * builds the verifier-owned V9 reference program, and binds only that exact replayable identity
 * to the already-bound runtime subject.
 * @param {AgentWorkspace} workspace
 * @param {string} operation_id
 * @param {Uint32Array} lhs_shape
 * @param {Uint32Array} rhs_shape
 * @param {Uint32Array} u32_params
 * @param {Float32Array} f32_params
 * @returns {string}
 */
export function workspaceBindRuntimeDirectMathOperation(workspace, operation_id, lhs_shape, rhs_shape, u32_params, f32_params) {
    let deferred7_0;
    let deferred7_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passStringToWasm0(operation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(lhs_shape, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray32ToWasm0(rhs_shape, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray32ToWasm0(u32_params, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF32ToWasm0(f32_params, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceBindRuntimeDirectMathOperation(workspace.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        var ptr6 = ret[0];
        var len6 = ret[1];
        if (ret[3]) {
            ptr6 = 0; len6 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred7_0 = ptr6;
        deferred7_1 = len6;
        return getStringFromWasm0(ptr6, len6);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
}

/**
 * Bind a replay-derived MathProgram programIdentity to an already-bound runtime subject.
 *
 * Callers supply canonical plan bytes, never a free-form identity string. Replay validation
 * derives the authoritative exact programIdentity before any binding mutation occurs.
 * @param {AgentWorkspace} workspace
 * @param {Uint8Array} plan
 * @returns {string}
 */
export function workspaceBindRuntimeMathProgramPlan(workspace, plan) {
    let deferred3_0;
    let deferred3_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceBindRuntimeMathProgramPlan(workspace.__wbg_ptr, ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {string} intent_id
 * @param {bigint} workflow_revision
 * @param {string} approval_id
 * @param {string} subject_kind
 * @param {string} subject_identity
 * @param {string} authorization_policy_id
 * @param {bigint} authorization_policy_revision
 * @param {boolean} authorization_is_revision
 * @returns {boolean}
 */
export function workspaceBindRuntimeSubject(workspace, intent_id, workflow_revision, approval_id, subject_kind, subject_identity, authorization_policy_id, authorization_policy_revision, authorization_is_revision) {
    _assertClass(workspace, AgentWorkspace);
    const ptr0 = passStringToWasm0(intent_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(approval_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(subject_kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(subject_identity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passStringToWasm0(authorization_policy_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len4 = WASM_VECTOR_LEN;
    const ret = wasm.workspaceBindRuntimeSubject(workspace.__wbg_ptr, ptr0, len0, workflow_revision, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, authorization_policy_revision, authorization_is_revision);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * Discover the canonical agent-facing workspace/control-plane API.
 * @returns {string}
 */
export function workspaceCapabilities() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.workspaceCapabilities();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Clear optional external input metadata. Runtime execution behavior is unchanged.
 * @param {AgentWorkspace} workspace
 * @returns {boolean}
 */
export function workspaceClearInputContract(workspace) {
    _assertClass(workspace, AgentWorkspace);
    const ret = wasm.workspaceClearInputContract(workspace.__wbg_ptr);
    return ret !== 0;
}

/**
 * @param {AgentWorkspace} workspace
 * @returns {boolean}
 */
export function workspaceClearInputPortMetadata(workspace) {
    _assertClass(workspace, AgentWorkspace);
    const ret = wasm.workspaceClearInputPortMetadata(workspace.__wbg_ptr);
    return ret !== 0;
}

/**
 * Compile using a temporary output selection without mutating builder state.
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {number} output_slot
 * @returns {CompiledGraph}
 */
export function workspaceCompile(builder, registry, output_slot) {
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(registry, LayerRegistry);
    const ret = wasm.workspaceCompile(builder.__wbg_ptr, registry.__wbg_ptr, output_slot);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return CompiledGraph.__wrap(ret[0]);
}

/**
 * Compile and bind the exact CompiledGraph.programIdentity to the immutable runtime subject.
 *
 * This is the canonical compile path for subject-bound verification. The historical
 * workspaceCompile surface remains available as an explicit unbound/legacy escape hatch.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {number} output_slot
 * @returns {CompiledGraph}
 */
export function workspaceCompileForRuntimeSubject(workspace, builder, registry, output_slot) {
    _assertClass(workspace, AgentWorkspace);
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(registry, LayerRegistry);
    const ret = wasm.workspaceCompileForRuntimeSubject(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, output_slot);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return CompiledGraph.__wrap(ret[0]);
}

/**
 * Initialize a reserved binary layer and wire it into the graph.
 * A workspace checkpoint protects the entire control state until graph commit succeeds.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {AgentLayerSpec} spec
 * @param {number} left_slot
 * @param {number} right_slot
 * @param {string} label
 * @returns {number}
 */
export function workspaceInitBinary(workspace, builder, registry, spec, left_slot, right_slot, label) {
    _assertClass(workspace, AgentWorkspace);
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(registry, LayerRegistry);
    _assertClass(spec, AgentLayerSpec);
    const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.workspaceInitBinary(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, spec.__wbg_ptr, left_slot, right_slot, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Initialize a reserved unary layer and wire it into the graph.
 * A workspace checkpoint protects the entire control state until graph commit succeeds.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {AgentLayerSpec} spec
 * @param {number} input_slot
 * @param {string} label
 * @returns {number}
 */
export function workspaceInitUnary(workspace, builder, registry, spec, input_slot, label) {
    _assertClass(workspace, AgentWorkspace);
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(registry, LayerRegistry);
    _assertClass(spec, AgentLayerSpec);
    const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.workspaceInitUnary(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, spec.__wbg_ptr, input_slot, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Return the current input contract or an explicit unbound marker.
 * @param {AgentWorkspace} workspace
 * @returns {string}
 */
export function workspaceInputContract(workspace) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ret = wasm.workspaceInputContract(workspace.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @returns {string}
 */
export function workspaceInputPortMetadata(workspace) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ret = wasm.workspaceInputPortMetadata(workspace.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return proof-related workspace collections without merging their authority classes.
 * @param {AgentWorkspace} workspace
 * @returns {string}
 */
export function workspaceProofLedger(workspace) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ret = wasm.workspaceProofLedger(workspace.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Record an explicit caller claim. This never upgrades into verifier authority.
 * @param {AgentWorkspace} workspace
 * @param {string} label
 * @param {boolean} claimed_passed
 * @param {string} detail
 * @returns {string}
 */
export function workspaceRecordAttestation(workspace, label, claimed_passed, detail) {
    let deferred4_0;
    let deferred4_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(detail, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceRecordAttestation(workspace.__wbg_ptr, ptr0, len0, claimed_passed, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @param {CompiledGraph} graph
 * @returns {string}
 */
export function workspaceRuntimeProgramBinding(workspace, graph) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(graph, CompiledGraph);
        const ret = wasm.workspaceRuntimeProgramBinding(workspace.__wbg_ptr, graph.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {AgentWorkspace} workspace
 * @returns {string}
 */
export function workspaceRuntimeSubject(workspace) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ret = wasm.workspaceRuntimeSubject(workspace.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Execute a canonical unary direct math operation and compare it to a verifier-owned V9 reference.
 * @param {AgentWorkspace} workspace
 * @param {string} operation_id
 * @param {WasmTensor} input
 * @param {Uint32Array} u32_params
 * @param {Float32Array} f32_params
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @param {string} label
 * @returns {string}
 */
export function workspaceVerifyDirectMath1Receipt(workspace, operation_id, input, u32_params, f32_params, abs_tol, rel_tol, label) {
    let deferred6_0;
    let deferred6_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passStringToWasm0(operation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(input, WasmTensor);
        const ptr1 = passArray32ToWasm0(u32_params, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF32ToWasm0(f32_params, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceVerifyDirectMath1Receipt(workspace.__wbg_ptr, ptr0, len0, input.__wbg_ptr, ptr1, len1, ptr2, len2, abs_tol, rel_tol, ptr3, len3);
        var ptr5 = ret[0];
        var len5 = ret[1];
        if (ret[3]) {
            ptr5 = 0; len5 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred6_0 = ptr5;
        deferred6_1 = len5;
        return getStringFromWasm0(ptr5, len5);
    } finally {
        wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
    }
}

/**
 * Execute a canonical binary direct math operation and compare it to a verifier-owned V9 reference.
 * @param {AgentWorkspace} workspace
 * @param {string} operation_id
 * @param {WasmTensor} lhs
 * @param {WasmTensor} rhs
 * @param {Uint32Array} u32_params
 * @param {Float32Array} f32_params
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @param {string} label
 * @returns {string}
 */
export function workspaceVerifyDirectMath2Receipt(workspace, operation_id, lhs, rhs, u32_params, f32_params, abs_tol, rel_tol, label) {
    let deferred6_0;
    let deferred6_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passStringToWasm0(operation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(lhs, WasmTensor);
        _assertClass(rhs, WasmTensor);
        const ptr1 = passArray32ToWasm0(u32_params, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF32ToWasm0(f32_params, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceVerifyDirectMath2Receipt(workspace.__wbg_ptr, ptr0, len0, lhs.__wbg_ptr, rhs.__wbg_ptr, ptr1, len1, ptr2, len2, abs_tol, rel_tol, ptr3, len3);
        var ptr5 = ret[0];
        var len5 = ret[1];
        if (ret[3]) {
            ptr5 = 0; len5 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred6_0 = ptr5;
        deferred6_1 = len5;
        return getStringFromWasm0(ptr5, len5);
    } finally {
        wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
    }
}

/**
 * Execute the compiled Burn graph as reference, compare the candidate, and record the receipt.
 *
 * The returned receipt includes the exact programIdentity object. The workspace ledger stores a
 * compact receipt keyed by the deterministic program-identity fingerprint.
 * @param {AgentWorkspace} workspace
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @param {WasmTensor} input
 * @param {Float32Array} candidate
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @param {string} label
 * @returns {string}
 */
export function workspaceVerifyGraphReceipt(workspace, graph, registry, input, candidate, abs_tol, rel_tol, label) {
    let deferred4_0;
    let deferred4_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(graph, CompiledGraph);
        _assertClass(registry, LayerRegistry);
        _assertClass(input, WasmTensor);
        const ptr0 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceVerifyGraphReceipt(workspace.__wbg_ptr, graph.__wbg_ptr, registry.__wbg_ptr, input.__wbg_ptr, ptr0, len0, abs_tol, rel_tol, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Replay a canonical 1-input MathProgram as the independent numerical reference.
 * @param {AgentWorkspace} workspace
 * @param {Uint8Array} plan
 * @param {WasmTensor} input
 * @param {Float32Array} candidate
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @param {string} label
 * @returns {string}
 */
export function workspaceVerifyMathProgram1Receipt(workspace, plan, input, candidate, abs_tol, rel_tol, label) {
    let deferred5_0;
    let deferred5_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(input, WasmTensor);
        const ptr1 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceVerifyMathProgram1Receipt(workspace.__wbg_ptr, ptr0, len0, input.__wbg_ptr, ptr1, len1, abs_tol, rel_tol, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Replay a canonical 2-input MathProgram as the independent numerical reference.
 * @param {AgentWorkspace} workspace
 * @param {Uint8Array} plan
 * @param {WasmTensor} lhs
 * @param {WasmTensor} rhs
 * @param {Float32Array} candidate
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @param {string} label
 * @returns {string}
 */
export function workspaceVerifyMathProgram2Receipt(workspace, plan, lhs, rhs, candidate, abs_tol, rel_tol, label) {
    let deferred5_0;
    let deferred5_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passArray8ToWasm0(plan, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(lhs, WasmTensor);
        _assertClass(rhs, WasmTensor);
        const ptr1 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceVerifyMathProgram2Receipt(workspace.__wbg_ptr, ptr0, len0, lhs.__wbg_ptr, rhs.__wbg_ptr, ptr1, len1, abs_tol, rel_tol, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Verify a Burn graph while binding the current semantic graph/lifecycle identities
 * into the returned proof context. Numerical authority remains CompiledGraph.verifyFlat.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {CompiledGraph} graph
 * @param {LayerRegistry} registry
 * @param {WasmTensor} input
 * @param {Float32Array} candidate
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @param {string} label
 * @returns {string}
 */
export function workspaceVerifySemanticGraphReceipt(workspace, builder, graph, registry, input, candidate, abs_tol, rel_tol, label) {
    let deferred4_0;
    let deferred4_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        _assertClass(builder, AgentGraphBuilder);
        _assertClass(graph, CompiledGraph);
        _assertClass(registry, LayerRegistry);
        _assertClass(input, WasmTensor);
        const ptr0 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceVerifySemanticGraphReceipt(workspace.__wbg_ptr, builder.__wbg_ptr, graph.__wbg_ptr, registry.__wbg_ptr, input.__wbg_ptr, ptr0, len0, abs_tol, rel_tol, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Verify against a caller-supplied reference and record a lower-authority comparator receipt.
 * @param {AgentWorkspace} workspace
 * @param {Float32Array} reference
 * @param {Float32Array} candidate
 * @param {number} abs_tol
 * @param {number} rel_tol
 * @param {string} label
 * @returns {string}
 */
export function workspaceVerifyVectorReceipt(workspace, reference, candidate, abs_tol, rel_tol, label) {
    let deferred5_0;
    let deferred5_1;
    try {
        _assertClass(workspace, AgentWorkspace);
        const ptr0 = passArrayF32ToWasm0(reference, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(candidate, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.workspaceVerifyVectorReceipt(workspace.__wbg_ptr, ptr0, len0, ptr1, len1, abs_tol, rel_tol, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Reconcile an already initialized binary layer into workspace metadata and graph wiring.
 * The supplied spec must exactly match the live registry layer's validated init identity.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {AgentLayerSpec} spec
 * @param {number} left_slot
 * @param {number} right_slot
 * @param {string} label
 * @returns {number}
 */
export function workspaceWireBinary(workspace, builder, registry, spec, left_slot, right_slot, label) {
    _assertClass(workspace, AgentWorkspace);
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(registry, LayerRegistry);
    _assertClass(spec, AgentLayerSpec);
    const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.workspaceWireBinary(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, spec.__wbg_ptr, left_slot, right_slot, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Reconcile an already initialized unary layer into workspace metadata and graph wiring.
 * The supplied spec must exactly match the live registry layer's validated init identity.
 * @param {AgentWorkspace} workspace
 * @param {AgentGraphBuilder} builder
 * @param {LayerRegistry} registry
 * @param {AgentLayerSpec} spec
 * @param {number} input_slot
 * @param {string} label
 * @returns {number}
 */
export function workspaceWireUnary(workspace, builder, registry, spec, input_slot, label) {
    _assertClass(workspace, AgentWorkspace);
    _assertClass(builder, AgentGraphBuilder);
    _assertClass(registry, LayerRegistry);
    _assertClass(spec, AgentLayerSpec);
    const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.workspaceWireUnary(workspace.__wbg_ptr, builder.__wbg_ptr, registry.__wbg_ptr, spec.__wbg_ptr, input_slot, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_copy_to_typed_array_88899a52af046901: function(arg0, arg1, arg2) {
            new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
        },
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_getRandomValues_a608c4436c19407a: function() { return handleError(function (arg0, arg1) {
            globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
        }, arguments); },
        __wbg_length_58572db4c38f3c3e: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_new_63c4c65d2534e5d3: function(arg0) {
            const ret = new Float32Array(arg0);
            return ret;
        },
        __wbg_new_bafc43b7f02a9754: function(arg0) {
            const ret = new SharedArrayBuffer(arg0 >>> 0);
            return ret;
        },
        __wbg_prototypesetcall_8b03c01e2c0f8066: function(arg0, arg1, arg2) {
            Float32Array.prototype.set.call(getArrayF32FromWasm0(arg0, arg1), arg2);
        },
        __wbg_set_070bd465f1c195a4: function(arg0, arg1, arg2) {
            arg0.set(getArrayF32FromWasm0(arg1, arg2));
        },
        __wbindgen_generic_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./burn_research_bg.js": import0,
    };
}

const AgentGraphBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_agentgraphbuilder_free(ptr, 1));
const AgentLayerSpecFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_agentlayerspec_free(ptr, 1));
const AgentWorkspaceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_agentworkspace_free(ptr, 1));
const CheckpointBranchSetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_checkpointbranchset_free(ptr, 1));
const CompiledGraphFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_compiledgraph_free(ptr, 1));
const CompiledMultiInputGraphFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_compiledmultiinputgraph_free(ptr, 1));
const EsOptimizerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_esoptimizer_free(ptr, 1));
const GraphMutationTransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_graphmutationtransaction_free(ptr, 1));
const InputPortConsumerSpecFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inputportconsumerspec_free(ptr, 1));
const LayerRegistryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_layerregistry_free(ptr, 1));
const MultiInputGraphPlanFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_multiinputgraphplan_free(ptr, 1));
const MultiInputInputBundleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_multiinputinputbundle_free(ptr, 1));
const MultiInputVerificationCasesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_multiinputverificationcases_free(ptr, 1));
const PacketHeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_packetheader_free(ptr, 1));
const SemanticIngressManifestFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_semanticingressmanifest_free(ptr, 1));
const SemanticIngressManifestV2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_semanticingressmanifestv2_free(ptr, 1));
const SemanticTransitionSpecFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_semantictransitionspec_free(ptr, 1));
const TensorViewFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tensorview_free(ptr, 1));
const TracedMultiInputRunFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tracedmultiinputrun_free(ptr, 1));
const WasmActivationFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmactivation_free(ptr, 1));
const WasmBinaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmbinary_free(ptr, 1));
const WasmComparisonFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcomparison_free(ptr, 1));
const WasmConvFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmconv_free(ptr, 1));
const WasmEmbeddingFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmembedding_free(ptr, 1));
const WasmFeatureNormFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmfeaturenorm_free(ptr, 1));
const WasmGhostModuleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmghostmodule_free(ptr, 1));
const WasmIndexSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmindexsource_free(ptr, 1));
const WasmIntTensorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasminttensor_free(ptr, 1));
const WasmLinearFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmlinear_free(ptr, 1));
const WasmLinearAlgebraFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmlinearalgebra_free(ptr, 1));
const WasmMathProgramFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogram_free(ptr, 1));
const WasmMathProgramBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogrambuilder_free(ptr, 1));
const WasmMathProgramV4Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv4_free(ptr, 1));
const WasmMathProgramV4BuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv4builder_free(ptr, 1));
const WasmMathProgramV5Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv5_free(ptr, 1));
const WasmMathProgramV5BuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv5builder_free(ptr, 1));
const WasmMathProgramV6Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv6_free(ptr, 1));
const WasmMathProgramV6BuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv6builder_free(ptr, 1));
const WasmMathProgramV7Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv7_free(ptr, 1));
const WasmMathProgramV7BuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv7builder_free(ptr, 1));
const WasmMathProgramV8Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv8_free(ptr, 1));
const WasmMathProgramV8BuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv8builder_free(ptr, 1));
const WasmMathProgramV9Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv9_free(ptr, 1));
const WasmMathProgramV9BuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmathprogramv9builder_free(ptr, 1));
const WasmNormFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmnorm_free(ptr, 1));
const WasmNumericKernelFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmnumerickernel_free(ptr, 1));
const WasmPoolFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpool_free(ptr, 1));
const WasmProbabilityFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmprobability_free(ptr, 1));
const WasmReductionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmreduction_free(ptr, 1));
const WasmSeBlockFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmseblock_free(ptr, 1));
const WasmShiftFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmshift_free(ptr, 1));
const WasmStatisticsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmstatistics_free(ptr, 1));
const WasmTensorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtensor_free(ptr, 1));
const WasmTensorTransformFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtensortransform_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayI64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigInt64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedBigInt64ArrayMemory0 = null;
function getBigInt64ArrayMemory0() {
    if (cachedBigInt64ArrayMemory0 === null || cachedBigInt64ArrayMemory0.byteLength === 0) {
        cachedBigInt64ArrayMemory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64ArrayMemory0;
}

let cachedBigUint64ArrayMemory0 = null;
function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.byteLength === 0) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getBigUint64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedBigInt64ArrayMemory0 = null;
    cachedBigUint64ArrayMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('burn_research_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
