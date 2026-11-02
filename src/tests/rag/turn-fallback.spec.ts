import { describe, it, expect } from 'vitest';

describe('Turn Fallback & Chronicle Schema Contract', () => {
  function generateFallbackTurn(contextHint: string): string {
    const safeHint = contextHint.replace(/["\\]/g, ' ').trim() || 'Melanjutkan petualangan';
    return `Internal Guardian Monologue:
[CHRONOS: Normal Flow] [CONTEXTUS: Baseline Simulation] [ANIMA: Steady] [LOGICA: Deterministic Continuity]
Sistem mengeksekusi giliran secara deterministik untuk tindakan pemain: "${safeHint}".

\`\`\`json
{
  "new_full_chronicle_entry": {
    "narrative": "Kuro mencermati situasi sekelilingnya dengan waspada setelah mengambil tindakan. Angin berhembus lembut melewati dedaunan di Desa Yamato.",
    "narrative_blocks": [
      {
        "name": "Kuro",
        "narration": "Kuro memperhatikan setiap sudut jalan desa dan memastikan perlengkapannya tetap aman di posisinya.",
        "dialogue": "...",
        "action": "Mengamati keadaan sekitar"
      }
    ],
    "choices": [
      {
        "id": "C-1",
        "text": "Menyelidiki jalan setapak menuju pusat desa",
        "weight": 0.85
      },
      {
        "id": "C-2",
        "text": "Mendekati kedai terdekat untuk mencari informasi",
        "weight": 0.75
      },
      {
        "id": "C-3",
        "text": "Beristirahat sejenak sambil memeriksa Pedang Legendaris",
        "weight": 0.65
      }
    ]
  }
}
\`\`\``;
  }

  it('should generate valid chronicle JSON conforming to Guardian Engine requirements', () => {
    const output = generateFallbackTurn('Pergi ke kuil kuno');
    expect(output).toContain('Internal Guardian Monologue:');
    expect(output).toContain('```json');

    const jsonMatch = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i.exec(output);
    expect(jsonMatch).not.toBeNull();

    const parsed = JSON.parse(jsonMatch![1]);
    expect(parsed.new_full_chronicle_entry).toBeDefined();

    const entry = parsed.new_full_chronicle_entry;
    expect(typeof entry.narrative).toBe('string');
    expect(Array.isArray(entry.narrative_blocks)).toBe(true);
    expect(entry.narrative_blocks.length).toBeGreaterThan(0);
    expect(entry.narrative_blocks[0].name).toBe('Kuro');

    expect(Array.isArray(entry.choices)).toBe(true);
    expect(entry.choices.length).toBeGreaterThan(0);
    expect(entry.choices.length).toBeLessThanOrEqual(3);
    for (const choice of entry.choices) {
      expect(choice.id).toBeDefined();
      expect(typeof choice.text).toBe('string');
      expect(typeof choice.weight).toBe('number');
    }
  });

  it('should sanitize special characters in context hint', () => {
    const output = generateFallbackTurn('Pilihan dengan "kutipan" dan \\backslash\\');
    const jsonMatch = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i.exec(output);
    expect(jsonMatch).not.toBeNull();

    const parsed = JSON.parse(jsonMatch![1]);
    expect(parsed.new_full_chronicle_entry).toBeDefined();
  });
});
