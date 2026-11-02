import { describe, it, expect, beforeEach } from 'vitest';
import { HybridVectorRetriever } from '../../app/rag/vector-retriever';

describe('VectorRetriever (SimHash & LSH)', () => {
    const dim = 768;
    const numDocs = 10;
    let docs: Float32Array;

    beforeEach(() => {
        docs = new Float32Array(numDocs * dim);
        for (let i = 0; i < numDocs * dim; i++) {
            docs[i] = Math.random() - 0.5;
        }
    });

    it('should initialize and run SIMD retrieval without crash', () => {
        const retriever = new HybridVectorRetriever(docs, numDocs, dim, 5);
        const query = new Float32Array(dim);
        query.fill(0.1);

        const outIndices = new Int32Array(5);
        const outScores = new Float32Array(5);
        
        retriever.retrieve(query, outIndices, outScores);
        
        expect(outIndices.length).toBe(5);
        expect(outScores.length).toBe(5);
        // Ensure scores are sorted descending
        for (let i = 1; i < 5; i++) {
            if (outScores[i] !== -Infinity && outScores[i-1] !== -Infinity) {
                expect(outScores[i-1]).toBeGreaterThanOrEqual(outScores[i]!);
            }
        }
    });
});
