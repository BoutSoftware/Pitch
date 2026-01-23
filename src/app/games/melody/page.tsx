"use client";

import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { getAvailableIndices, NOTES, type Mode } from "@/types/types";
import { playNote, playMelody } from "@/services/audio";
import { sampleIndices, arraysEqualAsSets as arraysEqual } from "@/utils/notes";

export default function MelodyGamePage() {
  const [options, setOptions] = useState({
    chordComplexity: 1, // notes per chord
    length: 2, // number of chords
    mode: "whites" as Mode, // mode of notes
    playNotes: false // play note sounds when selecting (sample mode)
  });
  const [currentMelody, setCurrentMelody] = useState<number[][]>([]); // Current generated melody
  const [userSelections, setUserSelections] = useState<number[][]>([]); // Total user selections chord by chord
  const [status, setStatus] = useState<string>("Press Play to start");

  const { chordComplexity, length, mode, playNotes } = options;

  const availableNoteIndexes = React.useMemo(() => {
    return getAvailableIndices(mode);
  }, [mode]);

  function generateMelody() {
    const melody: number[][] = [];
    for (let c = 0; c < length; c++) {
      const chordIndices = sampleIndices(chordComplexity, availableNoteIndexes);
      melody.push(chordIndices);
    }
    setCurrentMelody(melody);
    setUserSelections([]);
    setStatus(`Melody generated: ${length} chord${length > 1 ? "s" : ""} with ${chordComplexity} note${chordComplexity > 1 ? "s" : ""} each. Press Play.`);
  }

  function playCurrentMelody() {
    if (!currentMelody.length) {
      setStatus("Generate a melody first");
      return;
    }

    const totalDuration = playMelody(currentMelody, 0.6, 0.2);

    setStatus("Playing...");
    setTimeout(() => {
      setStatus("Now pick the notes you heard (chord by chord)");
    }, totalDuration * 1000 + 100);
  }

  function toggleNoteSelect(selectionIndex: number) {
    if (!currentMelody.length) return;

    setUserSelections((prev) => {
      const newUserSelections = [...prev];

      // Initialize current chord if needed
      if (newUserSelections.length === 0) {
        newUserSelections.push([]);
      }

      const currentChordIndex = newUserSelections.length - 1;
      const currentChordSelections = newUserSelections[currentChordIndex];

      // Deselect if already selected
      if (currentChordSelections.includes(selectionIndex)) {
        newUserSelections[currentChordIndex] = currentChordSelections.filter((i) => i !== selectionIndex);
        return newUserSelections;
      }

      // Play note sound if enabled
      if (playNotes) {
        playNote(selectionIndex);
      }

      // Add selection
      currentChordSelections.push(selectionIndex);
      newUserSelections[currentChordIndex] = currentChordSelections;
      const currentChord = currentMelody[currentChordIndex];

      // Check if current chord is complete
      if (currentChordSelections.length === chordComplexity) {
        // Evaluate current chord
        const isChordCorrect = arraysEqualAsSets(currentChordSelections, currentChord);
        if (isChordCorrect) {
          // Move to next chord if there are more
          if (newUserSelections.length === currentMelody.length) {
            setStatus("Correct! All chords matched!");
            setTimeout(generateMelody, 500);
            return newUserSelections;
          } else {
            setStatus(`Chord ${newUserSelections.length} correct! Now pick chord ${newUserSelections.length + 1}.`);
            // Start new chord
            newUserSelections.push([]);
            return newUserSelections;
          }
        } else {
          setStatus(`Chord ${newUserSelections.length} wrong! Try again.`);
          // Remove wrong selections and keep only correct ones
          newUserSelections[currentChordIndex] = currentChordSelections.filter((i) => currentChord.includes(i));
          return newUserSelections;
        }
      }

      return newUserSelections;
    });
  }

  function arraysEqualAsSets(a: number[], b: number[]) {
    return arraysEqual(a, b);
  }

  function isSelected(idx: number) {
    const currentChord = userSelections[userSelections.length - 1] || [];
    return currentChord.includes(idx);
  }

  useEffect(() => {
    generateMelody();
  }, [mode, chordComplexity, length]);

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
            Pitch Melody
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Hear a melody and reproduce it chord by chord. Train your ear — whites, blacks or chromatic.
        </p>
      </div>

      <div className="flex flex-wrap items-center my-4 gap-4">
        <div className="flex gap-4">
          <Select
            label="Mode"
            className="min-w-40 w-1/2"
            selectedKeys={[mode]}
            selectionMode="single"
            onSelectionChange={(keys) => setOptions({ ...options, mode: Array.from(keys)[0] as Mode })}
          >
            <SelectItem key={"whites"}>Whites</SelectItem>
            <SelectItem key={"blacks"}>Blacks</SelectItem>
            <SelectItem key={"chromatic"}>Chromatic</SelectItem>
          </Select>

          <Select
            label="Complexity"
            className="min-w-40 w-1/2"
            selectedKeys={[String(chordComplexity)]}
            selectionMode="single"
            onSelectionChange={(keys) => setOptions({ ...options, chordComplexity: Number(Array.from(keys)[0]) })}
          >
            <SelectItem key={"1"}>1 note</SelectItem>
            <SelectItem key={"2"}>2 notes</SelectItem>
            <SelectItem key={"3"}>3 notes</SelectItem>
            <SelectItem key={"4"}>4 notes</SelectItem>
          </Select>

          <Select
            label="Length"
            className="min-w-40 w-1/2"
            selectedKeys={[String(length)]}
            selectionMode="single"
            onSelectionChange={(keys) => setOptions({ ...options, length: Number(Array.from(keys)[0]) })}
          >
            <SelectItem key={"2"}>2 chords</SelectItem>
            <SelectItem key={"3"}>3 chords</SelectItem>
            <SelectItem key={"4"}>4 chords</SelectItem>
            <SelectItem key={"5"}>5 chords</SelectItem>
          </Select>
        </div>

        <Switch
          isSelected={playNotes}
          onValueChange={(value) => setOptions({ ...options, playNotes: value })}
        >
          Play Notes
        </Switch>

        <div className="flex items-center gap-2">
          <Button
            onPress={generateMelody}
            color="default"
            variant="bordered"
            className="gap-1"
            startContent={<span className="material-symbols-outlined">autorenew</span>}
          >
            Generate
          </Button>
          <Button
            onPress={playCurrentMelody}
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
          const disabled = !availableNoteIndexes.includes(index);
          return (
            <Button
              key={note.name}
              onPress={() => toggleNoteSelect(index)}
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
          <strong>Current chord picks:</strong>{" "}
          {userSelections.length > 0 && userSelections[userSelections.length - 1].length > 0
            ? userSelections[userSelections.length - 1].map((i) => NOTES[i].name).join(", ")
            : "—"}
        </div>
        <div>
          <strong>Your picks so far:</strong>{" "}
          {userSelections.length > 0
            ? userSelections
              .map((chord, idx) => `Chord ${idx + 1}: ${chord.map((i) => NOTES[i].name).join(", ")}`)
              .join(" | ")
            : "—"}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <RevealAnswer answer={currentMelody} />
      </div>

      {/* FAB for Home */}
      <Button
        href="/games"
        className="fixed bottom-6 right-6"
        radius="full"
        aria-label="Go to Games Home"
        variant="faded"
        as="a"
      >
        <span className="material-symbols-outlined text-2xl text-foreground">
          home
        </span>
        Home
      </Button>
    </main>
  );
}

function RevealAnswer({ answer }: { answer: number[][] }) {
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
          <strong>Melody:</strong>
          {answer.map((chord, idx) => (
            <div key={idx}>
              Chord {idx + 1}: {chord.map((i) => NOTES[i].name).join(", ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
