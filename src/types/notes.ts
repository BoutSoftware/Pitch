export type Mode = "whites" | "blacks" | "chromatic";

export interface Note {
    id: number;
    name: string;
    freq: number;
    isBlack: boolean;
}

const NOTE_NAMES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
] as const;

// Generate frequencies for octave 4 (MIDI 60..71) using A4 = MIDI 69 -> 440Hz
export const NOTES: Note[] = NOTE_NAMES.map((name, i) => {
    const midi = 60 + i; // C4..B4
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const isBlack = name.includes("#");
    return { id: i, name, freq, isBlack };
});

export function getAvailableIndices(mode: Mode): number[] {
    if (mode === "chromatic") return NOTES.map((_, i) => i);
    if (mode === "whites") return NOTES.map((n, i) => (!n.isBlack ? i : -1)).filter((i) => i >= 0);
    return NOTES.map((n, i) => (n.isBlack ? i : -1)).filter((i) => i >= 0);
}
