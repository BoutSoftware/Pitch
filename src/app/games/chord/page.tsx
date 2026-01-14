"use client";

import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import type { Mode } from "@/types/types";
import { NOTES, getAvailableIndices } from "@/types/types";
import {
  playNote,
  playChordWithOctave,
} from "@/services/audio";
import { sampleIndices, arraysEqualAsSets } from "@/utils/notes";

export default function Home() {
  const [level, setLevel] = useState<number>(1); // 1..4
  const [mode, setMode] = useState<Mode>("whites");
  const [currentChord, setCurrentChord] = useState<{ index: number; octave: -1 | 0 | 1 }[]>([]);
  const [userSelections, setUserSelections] = useState<number[]>([]);
  const [status, setStatus] = useState<string>("Press Play to start");
  const [playNotes, setPlayNotes] = useState<boolean>(false);
  const [differentOctaves, setDifferentOctaves] = useState<boolean>(true);

  const availableIndices = React.useMemo(() => {
    return getAvailableIndices(mode);
  }, [mode]);

  function generateChord() {
    const count = Math.max(1, Math.min(4, level));
    const indices = sampleIndices(count, availableIndices);

    const chord = indices.map((index) => {
      const octave = ([-1, 0, 1] as const)[Math.floor(Math.random() * 3)];
      return { index, octave } as const;
    });

    setCurrentChord(chord);
    setUserSelections([]);
    setStatus(`Chord generated: ${count} note${count > 1 ? "s" : ""}. Press Play.`);
  }

  function playCurrentChord() {
    if (!currentChord.length) {
      setStatus("Generate a chord first");
      return;
    }

    playChordWithOctave(currentChord, 0.9, differentOctaves);

    setStatus("Playing...");
    setTimeout(() => {
      setStatus("Now pick the notes you heard");
    }, 900 + 100);
  }

  function playNote(noteIndex: number) {
    if (playNotes) {
      import("@/services/audio").then(({ playNote: play }) => {
        play(noteIndex);
      });
    }
  }

  function toggleSelect(selectionIndex: number) {
    if (!currentChord.length) return;

    // allow toggling until user selected same number as chord length (we still allow deselect)
    setUserSelections((prev) => {
      const isPresent = prev.includes(selectionIndex);

      // deselect if already selected
      if (isPresent) {
        return prev.filter((p) => p !== selectionIndex);
      }

      // play note sound if enabled
      if (playNotes) {
        playNote(selectionIndex);
      }

      let next = [...prev, selectionIndex];

      // prevent more than chord length selected
      if (next.length > currentChord.length) next = next.slice(0, currentChord.length);

      // check for evaluation
      if (next.length === currentChord.length) {
        next = evaluate(next);
      }

      return next;
    });
  }

  function evaluate(selection: number[]) {
    const chordIndices = currentChord.map((c) => c.index);
    if (arraysEqualAsSets(selection, chordIndices)) {
      setStatus("Correct");
      setTimeout(generateChord, 500);
    } else {
      setStatus("Wrong! Try again or press Play to hear it again.");
      // remove wrong selections (ignore octave when checking correctness)
      selection = selection.filter((i) => chordIndices.includes(i));
    }

    return selection;
  }

  // helper for rendering note buttons
  function isSelected(idx: number) {
    return userSelections.includes(idx);
  }

  useEffect(() => {
    generateChord();
  }, [mode, level]);

  return (
    <main className="p-6">
      <div className="mb-8">
        <div className="flex items-center mb-2 gap-3">
          <Image
            src="/logo.png"
            alt="Pitch Logo"
            width={48}
            height={48}
            className="inline-block align-middle h-8 w-auto"
          />
          <h1 className="text-3xl font-extrabold bg-linear-to-r from-primary via-purple-500 to-pink-500 text-transparent bg-clip-text w-fit">
            Pitch Guess
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Hear a chord and pick the notes. Train your ear — whites, blacks or chromatic.
        </p>
      </div>

      <div className="flex flex-wrap items-center my-4 gap-4">
        <div className="flex gap-4">
          <Select
            label="Mode"
            className="min-w-40 w-1/2"
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
            className="min-w-40 w-1/2"
            selectedKeys={[String(level)]}
            selectionMode="single"
            onSelectionChange={(keys) => setLevel(Number(Array.from(keys)[0]))}
          >
            <SelectItem key={"1"}>1</SelectItem>
            <SelectItem key={"2"}>2</SelectItem>
            <SelectItem key={"3"}>3</SelectItem>
            <SelectItem key={"4"}>4</SelectItem>
          </Select>
        </div>

        <Switch
          isSelected={playNotes}
          onValueChange={setPlayNotes}
        >
          Play Notes
        </Switch>
        <Switch
          isSelected={differentOctaves}
          onValueChange={setDifferentOctaves}
        >
          Different Octaves
        </Switch>

        <div className="flex items-center gap-2">
          <Button
            onPress={generateChord}
            color="default"
            variant="bordered"
            className="gap-1"
            startContent={<span className="material-symbols-outlined">autorenew</span>}
          >
            Generate
          </Button>
          <Button
            onPress={playCurrentChord}
            className="gap-1"
            color="primary"
            variant="shadow"
            startContent={<span className="material-symbols-outlined">play_arrow</span>}
          >
            Play
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong> {status}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 gap-x-2 mt-8 w-fit">
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

function RevealAnswer({ answer }: { answer: { index: number; octave: -1 | 0 | 1 }[] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
  }, [answer]);

  const format = (noteInfo: { index: number; octave: -1 | 0 | 1 }) => {
    const noteName = NOTES[noteInfo.index].name;
    // show octave offset only when not 0
    if (noteInfo.octave === 0) return noteName;
    return `${noteName}${noteInfo.octave > 0 ? `+${noteInfo.octave}` : `${noteInfo.octave}`}`;
  };

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
          Answer: {answer.map(format).join(", ")}
        </div>
      )}
    </div>
  );
}