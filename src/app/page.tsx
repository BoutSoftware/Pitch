"use client";

import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { m } from "framer-motion";
import { u } from "framer-motion/client";
import React, { useEffect, useRef, useState } from "react";

type Mode = "whites" | "blacks" | "chromatic";

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
];

// Generate frequencies for octave 4 (MIDI 60..71) using A4 = MIDI 69 -> 440Hz
const NOTES = NOTE_NAMES.map((name, i) => {
  const midi = 60 + i; // C4..B4
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const isBlack = name.includes("#");
  return { name, freq, isBlack };
});

function sampleIndices(count: number, pool: number[]) {
  const copy = [...pool];
  const out: number[] = [];
  for (let i = 0; i < count && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export default function Home() {
  const [level, setLevel] = useState<number>(1); // 1..4
  const [mode, setMode] = useState<Mode>("whites");
  const [currentChord, setCurrentChord] = useState<number[]>([]);
  const [userSelections, setUserSelections] = useState<number[]>([]);
  const [status, setStatus] = useState<string>("Press Play to start");

  const availableIndices = React.useMemo(() => {
    if (mode === "chromatic") return NOTES.map((_, i) => i);
    if (mode === "whites") return NOTES.map((n, i) => (!n.isBlack ? i : -1)).filter((i) => i >= 0);
    return NOTES.map((n, i) => (n.isBlack ? i : -1)).filter((i) => i >= 0);
  }, [mode]);

  function generateChord() {
    const count = Math.max(1, Math.min(4, level));
    const chord = sampleIndices(count, availableIndices);
    setCurrentChord(chord);
    setUserSelections([]);
    setStatus(`Chord generated: ${count} note${count > 1 ? "s" : ""}. Press Play.`);
  }

  function playChord() {
    if (!currentChord.length) {
      setStatus("Generate a chord first");
      return;
    }

    const audioContext = new window.AudioContext();

    // play all notes simultaneously for 900ms
    const now = audioContext.currentTime;
    const duration = 0.9;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.12;
    gainNode.connect(audioContext.destination);

    const oscillators: OscillatorNode[] = [];
    try {
      currentChord.forEach((idx) => {
        const oscillatorNode = audioContext.createOscillator();
        oscillatorNode.type = "sine";
        oscillatorNode.frequency.value = NOTES[idx].freq;
        oscillatorNode.connect(gainNode);
        oscillatorNode.start(now);
        oscillatorNode.stop(now + duration);
        oscillators.push(oscillatorNode);
      });
    } catch (e) {
      console.warn("Audio error", e);
    }

    setStatus("Playing...");
    setTimeout(() => {
      setStatus("Now pick the notes you heard");
    }, duration * 1000 + 100);
  }

  function toggleSelect(idx: number) {
    if (!currentChord.length) return;
    // allow toggling until user selected same number as chord length (we still allow deselect)
    setUserSelections((prev) => {
      const has = prev.includes(idx);
      let next = has ? prev.filter((p) => p !== idx) : [...prev, idx];
      // prevent more than chord length selected
      if (next.length > currentChord.length) next = next.slice(0, currentChord.length);
      // check for evaluation
      if (next.length === currentChord.length) {
        evaluate(next);
      }
      return next;
    });
  }

  function arraysEqualAsSets(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    return b.every((v) => sa.has(v));
  }

  function evaluate(selection: number[]) {
    if (arraysEqualAsSets(selection, currentChord)) {
      setStatus("Correct");
      setTimeout(() => {
        // generate a new chord automatically for the new level
        setTimeout(generateChord, 150)
      }, 400);
    } else {
      setStatus("Wrong! Try again or press Play to hear it again.");
    }
  }

  // helper for rendering note buttons
  function isSelected(idx: number) {
    return userSelections.includes(idx);
  }

  useEffect(() => {
    generateChord();
  }, [mode, level]);

  return (
    <main style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text w-fit">
          Pitch Guess
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hear a chord and pick the notes. Train your ear — whites, blacks or chromatic.
        </p>
      </div>

      <div className="flex items-center my-4 gap-4">
        <Select
          label="Mode"
          fullWidth={false}
          selectedKeys={[mode]}
          selectionMode="single"
          onSelectionChange={(keys) => setMode(Array.from(keys)[0] as Mode)}
        >
          <SelectItem key={"whites"}>Whites</SelectItem>
          <SelectItem key={"blacks"}>Blacks</SelectItem>
          <SelectItem key={"chromatic"}>Chromatic</SelectItem>
        </Select>

        <Select
          label="Level"
          fullWidth={false}
          selectedKeys={[String(level)]}
          selectionMode="single"
          onSelectionChange={(keys) => setLevel(Number(Array.from(keys)[0]))}
        >
          <SelectItem key={"1"}>1</SelectItem>
          <SelectItem key={"2"}>2</SelectItem>
          <SelectItem key={"3"}>3</SelectItem>
          <SelectItem key={"4"}>4</SelectItem>
        </Select>

        <Button
          onPress={generateChord}
          className="gap-1"
          startContent={<span className="material-symbols-outlined">autorenew</span>}
        >
          Generate
        </Button>
        <Button
          onPress={playChord}
          className="gap-1"
          startContent={<span className="material-symbols-outlined">play_arrow</span>}
        >
          Play
        </Button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong> {status}
      </div>

      <div className="flex gap-2 flex-wrap mt-8">
        {NOTES.map((note, index) => {
          const disabled = !availableIndices.includes(index);
          return (
            <Button
              key={note.name}
              onPress={() => toggleSelect(index)}
              disabled={disabled}
              isIconOnly
              className={`py-4! h-auto
              ${isSelected(index) ? "border-3 border-primary" : "border border-gray-200"}
              ${note.isBlack ? "bg-black text-white transform -translate-y-2" : "bg-white text-black"}
              `}
              isDisabled={disabled}
            >
              {note.name}
            </Button>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <div>
          <strong>Your picks:</strong> {userSelections.length ? userSelections.map((i) => NOTES[i].name).join(", ") : "—"}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <RevealAnswer answer={currentChord} />
      </div>
    </main>
  );
}

function RevealAnswer({ answer }: { answer: number[] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
  }, [answer]);

  return (
    <div>
      <Button
        onPress={() => setShow((s) => !s)}
        className="mb-2"
        startContent={
          <span className="material-symbols-outlined">
            {show ? "visibility_off" : "visibility"}
          </span>
        }
      >
        {show ? "Hide Answer" : "Show Answer"}
      </Button>
      {show && (
        <div>
          Answer: {answer.map((i) => NOTES[i].name).join(", ")}
        </div>
      )}
    </div>
  );
}