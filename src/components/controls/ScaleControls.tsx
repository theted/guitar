import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PhraseMode, ScaleName, Tone, scales, tones } from "@/constants";
import { ucFirst } from "@/helpers";
import { setFormState, useFormStore, type FormState } from "@/store";
import FormToggle from "./FormToggle";

type ScaleControlsProps = {
  stopAllPlayback: () => void;
};

const ScaleControls: React.FC<ScaleControlsProps> = ({ stopAllPlayback }) => {
  const {
    scale,
    tone,
    startOctave,
    phraseMode,
    phraseOctaves,
    phraseDescend,
    phraseLoop,
    oncePerTone,
    highlightEnabled,
    legendOnly,
    octaveHighlight,
    minimalHighlight,
  } = useFormStore((state) => ({
    scale: state.scale,
    tone: state.tone,
    startOctave: state.startOctave,
    phraseMode: state.phraseMode,
    phraseOctaves: state.phraseOctaves,
    phraseDescend: state.phraseDescend,
    phraseLoop: state.phraseLoop,
    oncePerTone: state.oncePerTone,
    highlightEnabled: state.highlightEnabled,
    legendOnly: state.legendOnly,
    octaveHighlight: state.octaveHighlight,
    minimalHighlight: state.minimalHighlight,
  }));

  const applyFormState = useCallback(
    (partial: Partial<FormState>) => {
      stopAllPlayback();
      setFormState(partial);
    },
    [stopAllPlayback]
  );

  const handleScaleChange = useCallback(
    (value: string) => applyFormState({ scale: value as ScaleName }),
    [applyFormState]
  );

  const handleToneChange = useCallback(
    (value: string) => applyFormState({ tone: value as Tone }),
    [applyFormState]
  );

  const handleOctaveChange = useCallback(
    (value: string) => applyFormState({ startOctave: parseInt(value, 10) }),
    [applyFormState]
  );

  const handlePhraseChange = useCallback(
    (value: string) => applyFormState({ phraseMode: value as PhraseMode }),
    [applyFormState]
  );

  const handleOctaveCountChange = useCallback(
    (value: string) => applyFormState({ phraseOctaves: parseInt(value, 10) }),
    [applyFormState]
  );

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <header className="flex items-center gap-2 text-lg font-semibold">
        <span className="text-2xl" aria-hidden>
          🎵
        </span>
        <span>Scale</span>
      </header>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label className="text-base text-white">Scale</Label>
          <Select value={scale} onValueChange={handleScaleChange}>
            <SelectTrigger className="h-10 bg-white text-base text-black">
              <SelectValue placeholder="Select scale" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {Object.keys(scales).map((scaleName) => (
                <SelectItem key={scaleName} value={scaleName}>
                  {ucFirst(scaleName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label className="text-base text-white">Key</Label>
            <Select value={tone} onValueChange={handleToneChange}>
              <SelectTrigger className="h-10 bg-white text-base text-black">
                <SelectValue placeholder="Select key" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {tones.map((toneName) => (
                  <SelectItem key={toneName} value={toneName}>
                    {toneName.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label className="text-base text-white">Start octave</Label>
            <Select value={String(startOctave)} onValueChange={handleOctaveChange}>
              <SelectTrigger className="h-10 bg-white text-base text-black">
                <SelectValue placeholder="Octave" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((octave) => (
                  <SelectItem key={octave} value={String(octave)}>
                    {octave}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1">
          <Label className="text-base text-white">Phrase</Label>
          <Select value={phraseMode} onValueChange={handlePhraseChange}>
            <SelectTrigger className="h-10 bg-white text-base text-black">
              <SelectValue placeholder="Select phrase" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              <SelectItem value="full-scale">📈 Full Scale</SelectItem>
              <SelectItem value="snake">🐍 Snake Pattern</SelectItem>
              <SelectItem value="snake-complex">🐍 Snake Complex</SelectItem>
              <SelectItem value="motif-1232">🎵 1-2-3-2 Motif</SelectItem>
              <SelectItem value="thirds">🎼 Thirds</SelectItem>
              <SelectItem value="fourths">🎼 Fourths</SelectItem>
              <SelectItem value="sixths">🎼 Sixths</SelectItem>
              <SelectItem value="four-note-groups">🎼 Four Note Groups</SelectItem>
              <SelectItem value="triads">🎹 Triads</SelectItem>
              <SelectItem value="sevenths">🎹 Sevenths</SelectItem>
              <SelectItem value="alternate-picking">🎸 Alternate Picking</SelectItem>
              <SelectItem value="pedal-tone">🎸 Pedal Tone</SelectItem>
              <SelectItem value="sequence-asc">🎸 Sequence Up</SelectItem>
              <SelectItem value="sequence-desc">🎸 Sequence Down</SelectItem>
              <SelectItem value="skip-pattern">🎸 Skip Pattern</SelectItem>
              <SelectItem value="sweep-arp">🎸 Sweep Arpeggio</SelectItem>
              <SelectItem value="neo-classical">🎸 Neo-Classical</SelectItem>
              <SelectItem value="power-chord">🎸 Power Chord</SelectItem>
              <SelectItem value="djent-palm">🤘 Djent Palm Mute</SelectItem>
              <SelectItem value="polyrhythm">🤘 Polyrhythm 7/4</SelectItem>
              <SelectItem value="breakdown-chug">🤘 Breakdown Chug</SelectItem>
              <SelectItem value="tremolo">🤘 Tremolo Picking</SelectItem>
              <SelectItem value="legato-cascade">🤘 Legato Cascade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label className="text-base text-white">Octaves</Label>
            <Select
              value={String(phraseOctaves)}
              onValueChange={handleOctaveCountChange}
            >
              <SelectTrigger className="h-10 bg-white text-base text-black">
                <SelectValue placeholder="Octaves" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {[1, 2, 3, 4, 5].map((octave) => (
                  <SelectItem key={octave} value={String(octave)}>
                    {octave}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <FormToggle
              id="phraseDescend"
              label="Descend"
              checked={phraseDescend}
              stopAllPlayback={stopAllPlayback}
              onChange={(checked) => setFormState({ phraseDescend: checked })}
            />
            <FormToggle
              id="phraseLoop"
              label="Loop"
              checked={phraseLoop}
              stopAllPlayback={stopAllPlayback}
              onChange={(checked) => setFormState({ phraseLoop: checked })}
            />
            <FormToggle
              id="oncePerTone"
              label="Once per tone"
              checked={oncePerTone}
              stopAllPlayback={stopAllPlayback}
              onChange={(checked) => setFormState({ oncePerTone: checked })}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-t border-white/10 pt-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
          Highlights
        </span>
        <FormToggle
          id="highlightEnabled"
          label="Highlight notes"
          checked={highlightEnabled}
          stopAllPlayback={stopAllPlayback}
          onChange={(checked) => setFormState({ highlightEnabled: checked })}
        />
        <FormToggle
          id="legendOnly"
          label="Legend only"
          checked={legendOnly}
          stopAllPlayback={stopAllPlayback}
          onChange={(checked) => setFormState({ legendOnly: checked })}
        />
        <FormToggle
          id="octaveHighlight"
          label="Octave highlight"
          checked={octaveHighlight}
          stopAllPlayback={stopAllPlayback}
          onChange={(checked) => setFormState({ octaveHighlight: checked })}
        />
        <FormToggle
          id="minimalHighlight"
          label="Minimal highlight"
          checked={minimalHighlight}
          stopAllPlayback={stopAllPlayback}
          onChange={(checked) => setFormState({ minimalHighlight: checked })}
        />
      </div>
    </section>
  );
};

export default ScaleControls;
