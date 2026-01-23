export function sampleIndices(count: number, pool: number[]): number[] {
    const copy = [...pool];
    const out: number[] = [];
    for (let i = 0; i < count && copy.length; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}

export function arraysEqualAsSets(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    return b.every((v) => sa.has(v));
}
