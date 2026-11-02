import { describe, it, expect, beforeEach } from 'vitest';
import { WorldMergeResolver } from '../../app/rag/world-merge-resolver';
import { MultiWorldHologram } from '../../app/rag/multi-world';

describe('WorldMergeResolver', () => {
    let resolver: WorldMergeResolver;
    let multiWorld: MultiWorldHologram;
    const dim = 768; // changed to 768 as requested
    const numDocs = 100;
    const numWorlds = 3;
    const historyDepth = 64;
    const docVectors = new Float32Array(numDocs * dim);

    beforeEach(() => {
        multiWorld = new MultiWorldHologram(numWorlds, dim, numDocs, historyDepth, docVectors);
        resolver = new WorldMergeResolver(multiWorld, dim, numDocs, docVectors);
    });

    it('should initialize correctly', () => {
        expect(resolver.dim).toBe(dim);
        expect(resolver.multiWorld).toBe(multiWorld);
    });

    it('should resolve between worlds', () => {
        multiWorld.active[0] = 1;
        multiWorld.active[1] = 1;
        
        const res = resolver.resolve(1, 0);
        expect(res).toBeDefined();
        expect(res.success).toBeDefined();
        expect(res.mergedWorld).toBe(0);
        expect(Array.isArray(res.conflicts)).toBe(true);
    });

    it('should resolve all to trunk', () => {
        const res = resolver.resolveAllToTrunk();
        expect(Array.isArray(res)).toBe(true);
    });
});
