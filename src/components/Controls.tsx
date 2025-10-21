import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PhraseMode,
  ScaleName,
  TuningName,
  Tone,
  scales,
  tunings,
  tones,
} from "@/constants";
import { ucFirst } from "@/helpers";
import { SoundType } from "@/audio";
import { useFormStore, setFormState } from "@/store";

interface ControlsProps {
  stopAllPlayback: () => void;
}

const CheckboxControl: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) =>
        onChange((e.target as HTMLInputElement).checked)
      }
      className="h-4 w-4"
    />
    <Label htmlFor={id} className="text-base text-white">
      {label}
    </Label>
  </div>
);

const FieldRow: React.FC<{
  label: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  alignTop?: boolean;
}> = ({ label, htmlFor, children, className = "", alignTop = false }) => (
  <div
    className={`flex flex-col gap-2 sm:flex-row sm:gap-4 ${
      alignTop ? "sm:items-start" : "sm:items-center"
    } ${className}`}
  >
    {htmlFor ? (
      <Label htmlFor={htmlFor} className="text-base text-white sm:w-40">
        {label}
      </Label>
    ) : (
      <span className="text-base text-white sm:w-40">{label}</span>
    )}
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const Controls: React.FC<ControlsProps> = ({ stopAllPlayback }) => {
  const {
    scale,
    frets,
    strings,
    tuningName,
    tone,
    lowAtBottom,
    highlightEnabled,
    legendOnly,
    octaveHighlight,
    phraseMode,
    bpm,
    swing,
    phraseOctaves,
    phraseDescend,
    phraseLoop,
    reduceAnimations,
    trailLength,
    minimalHighlight,
    scheduleHorizon,
    soundType,
    startOctave,
    oncePerTone,
  } = useFormStore((s) => s);

  return (
    <div className="controls">
      <div className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/70 px-4 py-4 text-base text-white shadow-lg backdrop-blur-md">
        <div className="w-full overflow-x-auto pb-1">
          <div className="min-w-[900px] md:min-w-0 grid gap-4 md:grid-cols-3">
            {/* Scale & phrase grouping */}
            <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <header className="flex items-center gap-2 text-lg font-semibold">
                <span className="text-2xl" aria-hidden>
                  🎵
                </span>
                <span>Scale</span>
              </header>
              <div className="flex flex-col gap-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <FieldRow label="Scale" className="md:col-span-2 xl:col-span-1">
                    <Select
                      value={scale}
                      onValueChange={(v) => {
                        stopAllPlayback();
                        setFormState({ scale: v as ScaleName });
                      }}
                    >
                      <SelectTrigger className="h-10 w-full bg-white text-base text-black">
                        <SelectValue placeholder="Select scale" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        {Object.keys(scales).map((s) => (
                          <SelectItem key={s} value={s}>
                            {ucFirst(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Key">
                    <Select
                      value={tone}
                      onValueChange={(v) => {
                        stopAllPlayback();
                        setFormState({ tone: v as Tone });
                      }}
                    >
                      <SelectTrigger className="h-10 w-full bg-white text-base text-black">
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        {tones.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Start octave">
                    <Select
                      value={String(startOctave)}
                      onValueChange={(v) => {
                        stopAllPlayback();
                        setFormState({ startOctave: parseInt(v, 10) });
                      }}
                    >
                      <SelectTrigger className="h-10 w-full bg-white text-base text-black">
                        <SelectValue placeholder="Octave" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {String(n)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Phrase" className="md:col-span-2 xl:col-span-1">
                    <Select
                      value={phraseMode}
                      onValueChange={(v) => {
                        stopAllPlayback();
                        setFormState({ phraseMode: v as PhraseMode });
                      }}
                    >
                      <SelectTrigger className="h-10 w-full bg-white text-base text-black">
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
                  </FieldRow>
                  <FieldRow label="Octaves">
                    <Select
                      value={String(phraseOctaves)}
                      onValueChange={(v) => {
                        stopAllPlayback();
                        setFormState({ phraseOctaves: parseInt(v, 10) });
                      }}
                    >
                      <SelectTrigger className="h-10 w-full bg-white text-base text-black">
                        <SelectValue placeholder="Octaves" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {String(n)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow
                    label="Phrase options"
                    className="md:col-span-2"
                    alignTop
                  >
                    <div className="flex flex-wrap gap-4">
                      <CheckboxControl
                        id="phraseDescend"
                        label="Descend"
                        checked={phraseDescend}
                        onChange={(checked) => {
                          stopAllPlayback();
                          setFormState({ phraseDescend: checked });
                        }}
                      />
                      <CheckboxControl
                        id="phraseLoop"
                        label="Loop"
                        checked={phraseLoop}
                        onChange={(checked) => {
                          stopAllPlayback();
                          setFormState({ phraseLoop: checked });
                        }}
                      />
                      <CheckboxControl
                        id="oncePerTone"
                        label="Once per tone"
                        checked={oncePerTone}
                        onChange={(checked) => {
                          stopAllPlayback();
                          setFormState({ oncePerTone: checked });
                        }}
                      />
                    </div>
                  </FieldRow>
                </div>
                <div className="grid gap-2 border-t border-white/10 pt-3">
                  <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
                    Highlights
                  </span>
                  <div className="flex flex-wrap gap-4">
                    <CheckboxControl
                      id="highlightEnabled"
                      label="Highlight notes"
                      checked={highlightEnabled}
                      onChange={(checked) => {
                        stopAllPlayback();
                        setFormState({ highlightEnabled: checked });
                      }}
                    />
                    <CheckboxControl
                      id="legendOnly"
                      label="Legend only"
                      checked={legendOnly}
                      onChange={(checked) => {
                        stopAllPlayback();
                        setFormState({ legendOnly: checked });
                      }}
                    />
                    <CheckboxControl
                      id="octaveHighlight"
                      label="Octave highlight"
                      checked={octaveHighlight}
                      onChange={(checked) => {
                        stopAllPlayback();
                        setFormState({ octaveHighlight: checked });
                      }}
                    />
                    <CheckboxControl
                      id="minimalHighlight"
                      label="Minimal highlight"
                      checked={minimalHighlight}
                      onChange={(checked) => {
                        stopAllPlayback();
                        setFormState({ minimalHighlight: checked });
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Instrument grouping */}
            <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <header className="flex items-center gap-2 text-lg font-semibold">
                <span className="text-2xl" aria-hidden>
                  🎸
                </span>
                <span>Instrument</span>
              </header>
              <div className="flex flex-col gap-4">
                <FieldRow label="Tuning">
                  <Select
                    value={tuningName}
                    onValueChange={(v) => {
                      stopAllPlayback();
                      setFormState({ tuningName: v as TuningName });
                    }}
                  >
                    <SelectTrigger className="h-10 w-full bg-white text-base text-black">
                      <SelectValue placeholder="Select tuning" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      {Object.keys(tunings).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldRow label="Strings" htmlFor="strings">
                    <Input
                      id="strings"
                      onChange={(e) => {
                        stopAllPlayback();
                        setFormState({
                          strings:
                            parseInt((e.target as HTMLInputElement).value, 10) || 0,
                        });
                      }}
                      value={String(strings)}
                      type="number"
                      min={1}
                      max={100}
                      className="h-10 w-full text-base"
                    />
                  </FieldRow>
                  <FieldRow label="Frets" htmlFor="frets">
                    <Input
                      id="frets"
                      onChange={(e) => {
                        stopAllPlayback();
                        setFormState({
                          frets:
                            parseInt((e.target as HTMLInputElement).value, 10) || 0,
                        });
                      }}
                      value={String(frets)}
                      type="number"
                      min={1}
                      max={100}
                      className="h-10 w-full text-base"
                    />
                  </FieldRow>
                </div>
                <FieldRow label="Sound">
                  <Select
                    value={soundType}
                    onValueChange={(v) => {
                      stopAllPlayback();
                      setFormState({ soundType: v as SoundType });
                    }}
                  >
                    <SelectTrigger className="h-10 w-full bg-white text-base text-black">
                      <SelectValue placeholder="Select sound" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      {(
                        [
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
                        ] as { type: SoundType; icon: string; name: string }[]
                      ).map((s) => (
                        <SelectItem key={s.type} value={s.type}>
                          {s.icon} {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex flex-wrap gap-4">
                  <CheckboxControl
                    id="lowAtBottom"
                    label="Low string at bottom"
                    checked={lowAtBottom}
                    onChange={(checked) => {
                      stopAllPlayback();
                      setFormState({ lowAtBottom: checked });
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Playback grouping */}
            <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <header className="flex items-center gap-2 text-lg font-semibold">
                <span className="text-2xl" aria-hidden>
                  ▶
                </span>
                <span>Playback</span>
              </header>

              <div className="flex flex-col gap-4">
                <FieldRow label={`BPM: ${bpm}`} htmlFor="bpm">
                  <Slider
                    id="bpm"
                    min={30}
                    max={700}
                    step={5}
                    value={bpm}
                    onChange={(v) => {
                      stopAllPlayback();
                      setFormState({ bpm: v });
                    }}
                    className="mt-1"
                  />
                </FieldRow>
                <FieldRow label={`Trail: ${trailLength}ms`} htmlFor="trailLength">
                  <Slider
                    id="trailLength"
                    min={100}
                    max={4000}
                    step={50}
                    value={trailLength}
                    onChange={(v) => {
                      stopAllPlayback();
                      setFormState({ trailLength: v });
                    }}
                    className="mt-1"
                  />
                </FieldRow>
                <FieldRow label="Schedule horizon (ms)" htmlFor="scheduleHorizon">
                  <Input
                    id="scheduleHorizon"
                    type="number"
                    min={200}
                    max={5000}
                    step={100}
                    value={String(scheduleHorizon)}
                    onChange={(e) => {
                      const v = parseInt((e.target as HTMLInputElement).value, 10);
                      if (!Number.isNaN(v)) {
                        stopAllPlayback();
                        setFormState({
                          scheduleHorizon: Math.min(5000, Math.max(200, v)),
                        });
                      }
                    }}
                    className="h-10 w-full text-base"
                  />
                </FieldRow>
              </div>

              <div className="flex flex-wrap gap-4 border-t border-white/10 pt-3">
                <CheckboxControl
                  id="swing"
                  label="Swing"
                  checked={swing}
                  onChange={(checked) => {
                    stopAllPlayback();
                    setFormState({ swing: checked });
                  }}
                />
                <CheckboxControl
                  id="reduceAnimations"
                  label="Reduce animations"
                  checked={reduceAnimations}
                  onChange={(checked) => {
                    stopAllPlayback();
                    setFormState({ reduceAnimations: checked });
                  }}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
