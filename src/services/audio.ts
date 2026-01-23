import { NOTES } from "@/types/types";


const GAIN_VALUE = 0.2;
const NOTE_DURATION = 0.5;

export function playNote(noteIndex: number): void {
    const audioContext = new window.AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = GAIN_VALUE;
    gainNode.connect(audioContext.destination);

    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.type = "sine";
    oscillatorNode.frequency.value = NOTES[noteIndex].freq;
    oscillatorNode.connect(gainNode);
    oscillatorNode.start();
    oscillatorNode.stop(audioContext.currentTime + NOTE_DURATION);

    oscillatorNode.onended = () => {
        audioContext.close();
    };
}

export function playMelody(
    chords: number[][],
    chordDuration: number = 0.6,
    timeBetweenChords: number = 0.2
): number {
    const audioContext = new window.AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = GAIN_VALUE;
    gainNode.connect(audioContext.destination);

    let currentTime = audioContext.currentTime;

    try {
        chords.forEach((chordIndices) => {
            chordIndices.forEach((index) => {
                const oscillatorNode = audioContext.createOscillator();
                oscillatorNode.type = "sine";
                oscillatorNode.frequency.value = NOTES[index].freq;
                oscillatorNode.connect(gainNode);
                oscillatorNode.start(currentTime);
                oscillatorNode.stop(currentTime + chordDuration);
            });
            currentTime += chordDuration + timeBetweenChords;
        });
    } catch (e) {
        console.warn("Audio error", e);
    }

    const totalDuration = (chordDuration + timeBetweenChords) * chords.length;
    setTimeout(() => {
        audioContext.close();
    }, totalDuration * 1000 + 200);

    return totalDuration;
}

export function playChord(
    noteIndices: Array<{ index: number; octave?: -1 | 0 | 1 }>,
    duration: number = 0.9,
    applyOctave: boolean = true
): void {
    const audioContext = new window.AudioContext();
    const now = audioContext.currentTime;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = GAIN_VALUE;
    gainNode.connect(audioContext.destination);

    const oscillators: OscillatorNode[] = [];

    try {
        noteIndices.forEach(({ index, octave }) => {
            const oscillatorNode = audioContext.createOscillator();
            oscillatorNode.type = "sine";
            oscillatorNode.frequency.value = NOTES[index].freq * Math.pow(2, applyOctave && octave ? octave : 0);
            oscillatorNode.connect(gainNode);
            oscillatorNode.start(now);
            oscillatorNode.stop(now + duration);
            oscillators.push(oscillatorNode);

            oscillatorNode.onended = () => {
                const idx = oscillators.indexOf(oscillatorNode);
                if (idx >= 0) oscillators.splice(idx, 1);
                if (oscillators.length === 0) {
                    audioContext.close();
                }
            };
        });
    } catch (e) {
        console.warn("Audio error", e);
    }
}
