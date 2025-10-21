import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SoundType } from "@/audio";
import { TuningName, tunings } from "@/constants";
import { setFormState, useFormStore, type FormState } from "@/store";
import FormNumber from "./FormNumber";
import FormToggle from "./FormToggle";

type InstrumentControlsProps = {
  stopAllPlayback: () => void;
};

const instrumentSounds: Array<{ type: SoundType; icon: string; name: string }> = [
  { type: "marimba", icon: "🎵", name: "Marimba" },
  { type: "sine", icon: "〜", name: "Sine" },
  { type: "organ", icon: "🎹", name: "Organ" },
  { type: "piano", icon: "🎹", name: "Piano" },
  { type: "square", icon: "⬜", name: "Square" },
  { type: "saw", icon: "🔺", name: "Saw" },
  { type: "guitar-clean", icon: "🎸", name: "Guitar Clean" },
  { type: "guitar-distorted", icon: "🎸⚡", name: "Guitar Distorted" },
  { type: "bass", icon: "🎸📻", name: "Bass" },
  { type: "synth-lead", icon: "🎛️⚡", name: "Synth Lead" },
  { type: "synth-pad", icon: "🎛️☁️", name: "Synth Pad" },
  { type: "bells", icon: "🔔", name: "Bells" },
  { type: "strings", icon: "🎻", name: "Strings" },
  { type: "flute", icon: "🪈", name: "Flute" },
  { type: "brass", icon: "🎺", name: "Brass" },
];

const InstrumentControls: React.FC<InstrumentControlsProps> = ({ stopAllPlayback }) => {
  const { tuningName, strings, frets, soundType, lowAtBottom } = useFormStore((state) => ({
    tuningName: state.tuningName,
    strings: state.strings,
    frets: state.frets,
    soundType: state.soundType,
    lowAtBottom: state.lowAtBottom,
  }));

  const applyFormState = useCallback(
    (partial: Partial<FormState>) => {
      stopAllPlayback();
      setFormState(partial);
    },
    [stopAllPlayback]
  );

  const handleTuningChange = useCallback(
    (value: string) => applyFormState({ tuningName: value as TuningName }),
    [applyFormState]
  );

  const handleSoundChange = useCallback(
    (value: string) => applyFormState({ soundType: value as SoundType }),
    [applyFormState]
  );

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <header className="flex items-center gap-2 text-lg font-semibold">
        <span className="text-2xl" aria-hidden>
          🎸
        </span>
        <span>Instrument</span>
      </header>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label className="text-base text-white">Tuning</Label>
          <Select value={tuningName} onValueChange={handleTuningChange}>
            <SelectTrigger className="h-10 bg-white text-base text-black">
              <SelectValue placeholder="Select tuning" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {Object.keys(tunings).map((tuning) => (
                <SelectItem key={tuning} value={tuning}>
                  {tuning}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormNumber
            id="strings"
            label="Strings"
            value={strings}
            min={1}
            max={100}
            stopAllPlayback={stopAllPlayback}
            onChange={(value) => setFormState({ strings: value })}
          />
          <FormNumber
            id="frets"
            label="Frets"
            value={frets}
            min={1}
            max={100}
            stopAllPlayback={stopAllPlayback}
            onChange={(value) => setFormState({ frets: value })}
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-base text-white">Sound</Label>
          <Select value={soundType} onValueChange={handleSoundChange}>
            <SelectTrigger className="h-10 bg-white text-base text-black">
              <SelectValue placeholder="Select sound" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {instrumentSounds.map((sound) => (
                <SelectItem key={sound.type} value={sound.type}>
                  {sound.icon} {sound.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-white/10 pt-3">
        <FormToggle
          id="lowAtBottom"
          label="Low string at bottom"
          checked={lowAtBottom}
          stopAllPlayback={stopAllPlayback}
          onChange={(checked) => setFormState({ lowAtBottom: checked })}
        />
      </div>
    </section>
  );
};

export default InstrumentControls;
