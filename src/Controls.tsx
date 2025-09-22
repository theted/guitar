import React from "react";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  PhraseMode,
  ScaleName,
  TuningName,
  Tone,
  scales,
  tunings,
  tones,
} from "./constants";
import { ucFirst } from "./helpers";
import { SoundType } from "./audio";
import { useFormStore, setFormState } from "./store";

const Controls: React.FC = () => {
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
      <div className="fixed top-0 left-0 right-0 z-50 w-full bg-black/70 backdrop-blur-sm px-4 py-3 border-b border-white/10 shadow-lg text-base md:text-lg text-white flex flex-col gap-2">
        <div className="w-full overflow-x-auto">
          <div className="flex flex-nowrap items-end gap-3 min-w-max">
            {/* 1. Scale */}
            <div className="flex flex-col gap-1 w-44">
              <Label className="text-base text-white">Scale</Label>
              <Select
                value={scale}
                onValueChange={(v) => setFormState({ scale: v as ScaleName })}
              >
                <SelectTrigger className="text-base h-10 text-black bg-white">
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
            </div>
            {/* 2. Phrase */}
            <div className="flex flex-col gap-1 w-64">
              <Label className="text-base text-white">Phrase</Label>
              <Select
                value={phraseMode}
                onValueChange={(v) =>
                  setFormState({ phraseMode: v as PhraseMode })
                }
              >
                <SelectTrigger className="text-base h-10 text-black bg-white">
                  <SelectValue placeholder="Select phrase" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {/* Basic Patterns */}
                  <SelectItem value="full-scale">📈 Full Scale</SelectItem>
                  <SelectItem value="snake">🐍 Snake Pattern</SelectItem>
                  <SelectItem value="snake-complex">🐍 Snake Complex</SelectItem>
                  <SelectItem value="motif-1232">🎵 1-2-3-2 Motif</SelectItem>
                  
                  {/* Interval Patterns */}
                  <SelectItem value="thirds">🎼 Thirds</SelectItem>
                  <SelectItem value="fourths">🎼 Fourths</SelectItem>
                  <SelectItem value="sixths">🎼 Sixths</SelectItem>
                  <SelectItem value="four-note-groups">🎼 Four Note Groups</SelectItem>
                  
                  {/* Chord Patterns */}
                  <SelectItem value="triads">🎹 Triads</SelectItem>
                  <SelectItem value="sevenths">🎹 Sevenths</SelectItem>
                  
                  {/* Rock/Metal Techniques */}
                  <SelectItem value="alternate-picking">🎸 Alternate Picking</SelectItem>
                  <SelectItem value="pedal-tone">🎸 Pedal Tone</SelectItem>
                  <SelectItem value="sequence-asc">🎸 Sequence Up</SelectItem>
                  <SelectItem value="sequence-desc">🎸 Sequence Down</SelectItem>
                  <SelectItem value="skip-pattern">🎸 Skip Pattern</SelectItem>
                  <SelectItem value="sweep-arp">🎸 Sweep Arpeggio</SelectItem>
                  <SelectItem value="neo-classical">🎸 Neo-Classical</SelectItem>
                  <SelectItem value="power-chord">🎸 Power Chord</SelectItem>
                  
                  {/* Djent/Modern Metal */}
                  <SelectItem value="djent-palm">🤘 Djent Palm Mute</SelectItem>
                  <SelectItem value="polyrhythm">🤘 Polyrhythm 7/4</SelectItem>
                  <SelectItem value="breakdown-chug">🤘 Breakdown Chug</SelectItem>
                  <SelectItem value="tremolo">🤘 Tremolo Picking</SelectItem>
                  <SelectItem value="legato-cascade">🤘 Legato Cascade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* 3. Key */}
            <div className="flex flex-col gap-1 w-36">
              <Label className="text-base text-white">Key</Label>
              <Select
                value={tone}
                onValueChange={(v) => setFormState({ tone: v as Tone })}
              >
                <SelectTrigger className="text-base h-10 text-black bg-white">
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
            </div>
            {/* 4. Tuning */}
            <div className="flex flex-col gap-1 w-44">
              <Label className="text-base text-white">Tuning</Label>
              <Select
                value={tuningName}
                onValueChange={(v) =>
                  setFormState({ tuningName: v as TuningName })
                }
              >
                <SelectTrigger className="text-base h-10 text-black bg-white">
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
            </div>
            {/* 5. BPM */}
            <div className="flex flex-col gap-1 w-28">
              <Label htmlFor="bpm" className="text-base text-white">
                BPM
              </Label>
              <Input
                id="bpm"
                type="number"
                min={30}
                max={700}
                step={1}
                value={String(bpm)}
                onChange={(e) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!Number.isNaN(v))
                    setFormState({ bpm: Math.min(700, Math.max(30, v)) });
                }}
                className="h-10 w-28 text-base"
              />
            </div>
            {/* 6. Octaves */}
            <div className="flex flex-col gap-1 w-28">
              <Label className="text-base text-white">Octaves</Label>
              <Select
                value={String(phraseOctaves)}
                onValueChange={(v) =>
                  setFormState({ phraseOctaves: parseInt(v, 10) })
                }
              >
                <SelectTrigger className="text-base h-10 text-black bg-white">
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
            </div>
            {/* 7. Strings */}
            <div className="flex flex-col gap-1 w-28">
              <Label htmlFor="strings" className="text-base text-white">
                Strings
              </Label>
              <Input
                id="strings"
                onChange={(e) =>
                  setFormState({
                    strings:
                      parseInt((e.target as HTMLInputElement).value, 10) || 0,
                  })
                }
                value={String(strings)}
                type="number"
                min={1}
                max={100}
                className="text-base h-10"
              />
            </div>
            {/* 8. Frets */}
            <div className="flex flex-col gap-1 w-28">
              <Label htmlFor="frets" className="text-base text-white">
                Frets
              </Label>
              <Input
                id="frets"
                onChange={(e) =>
                  setFormState({
                    frets:
                      parseInt((e.target as HTMLInputElement).value, 10) || 0,
                  })
                }
                value={String(frets)}
                type="number"
                min={1}
                max={100}
                className="text-base h-10"
              />
            </div>
            {/* 9. Sound */}
            <div className="flex flex-col gap-1 w-44">
              <Label className="text-base text-white">Sound</Label>
              <Select
                value={soundType}
                onValueChange={(v) =>
                  setFormState({ soundType: v as SoundType })
                }
              >
                <SelectTrigger className="text-base h-10 text-black bg-white">
                  <SelectValue placeholder="Select sound" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {(
                    [
                      "marimba",
                      "sine",
                      "organ",
                      "piano",
                      "square",
                      "saw",
                    ] as SoundType[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {ucFirst(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* 10. Trail */}
            <div className="flex flex-col gap-1 w-32">
              <Label htmlFor="trailLength" className="text-base text-white">
                Trail (ms)
              </Label>
              <Input
                id="trailLength"
                type="number"
                min={100}
                max={4000}
                step={50}
                value={String(trailLength)}
                onChange={(e) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!Number.isNaN(v))
                    setFormState({
                      trailLength: Math.min(4000, Math.max(100, v)),
                    });
                }}
                className="h-10 w-32 text-base"
              />
            </div>
            {/* 11. Schedule */}
            <div className="flex flex-col gap-1 w-36">
              <Label htmlFor="scheduleHorizon" className="text-base text-white">
                Schedule (ms)
              </Label>
              <Input
                id="scheduleHorizon"
                type="number"
                min={200}
                max={5000}
                step={100}
                value={String(scheduleHorizon)}
                onChange={(e) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!Number.isNaN(v))
                    setFormState({
                      scheduleHorizon: Math.min(5000, Math.max(200, v)),
                    });
                }}
                className="h-10 w-28 text-base"
              />
            </div>
            {/* 12. Start octave */}
            <div className="flex flex-col gap-1 w-36">
              <Label className="text-base text-white">Start octave</Label>
              <Select
                value={String(startOctave)}
                onValueChange={(v) =>
                  setFormState({ startOctave: parseInt(v, 10) })
                }
              >
                <SelectTrigger className="text-base h-10 text-black bg-white">
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
            </div>
          </div>
        </div>
        <div className="w-full flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 h-10">
            <input
              id="lowAtBottom"
              type="checkbox"
              checked={lowAtBottom}
              onChange={(e) =>
                setFormState({
                  lowAtBottom: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="lowAtBottom" className="text-base text-white">
              Low string at bottom
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="highlightEnabled"
              type="checkbox"
              checked={highlightEnabled}
              onChange={(e) =>
                setFormState({
                  highlightEnabled: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="highlightEnabled" className="text-base text-white">
              Highlight notes
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="legendOnly"
              type="checkbox"
              checked={legendOnly}
              onChange={(e) =>
                setFormState({
                  legendOnly: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="legendOnly" className="text-base text-white">
              Legend only
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="octaveHighlight"
              type="checkbox"
              checked={octaveHighlight}
              onChange={(e) =>
                setFormState({
                  octaveHighlight: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="octaveHighlight" className="text-base text-white">
              Octave highlight
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="minimalHighlight"
              type="checkbox"
              checked={minimalHighlight}
              onChange={(e) =>
                setFormState({
                  minimalHighlight: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="minimalHighlight" className="text-base text-white">
              Minimal highlight
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="reduceAnimations"
              type="checkbox"
              checked={reduceAnimations}
              onChange={(e) =>
                setFormState({
                  reduceAnimations: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="reduceAnimations" className="text-base text-white">
              Reduce animations
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="oncePerTone"
              type="checkbox"
              checked={oncePerTone}
              onChange={(e) =>
                setFormState({
                  oncePerTone: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="oncePerTone" className="text-base text-white">
              Once per tone
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="swing2"
              type="checkbox"
              checked={swing}
              onChange={(e) =>
                setFormState({ swing: (e.target as HTMLInputElement).checked })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="swing2" className="text-base text-white">
              Swing
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="descend"
              type="checkbox"
              checked={phraseDescend}
              onChange={(e) =>
                setFormState({
                  phraseDescend: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="descend" className="text-base text-white">
              Descend
            </Label>
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              id="loop"
              type="checkbox"
              checked={phraseLoop}
              onChange={(e) =>
                setFormState({
                  phraseLoop: (e.target as HTMLInputElement).checked,
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="loop" className="text-base text-white">
              Loop
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
