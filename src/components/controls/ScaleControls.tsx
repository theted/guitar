import React, { useCallback } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PhraseMode, ScaleName, Tone, scales, tones } from '@/constants';
import { ucFirst } from '@/lib/utils';
import { setFormState, useFormStore, type FormState } from '@/store';
import FormToggle from './FormToggle';

type ScaleControlsProps = { stopAllPlayback: () => void };

// Dark select classes reused across controls
const selectTriggerCls = "h-8 border-white/[0.08] bg-white/[0.05] text-white/80 text-xs focus:ring-cyan-500/50 hover:bg-white/[0.08] transition-colors";
const selectContentCls = "bg-[#0f0f1a] border border-white/[0.08] text-white/80";

const ScaleControls: React.FC<ScaleControlsProps> = ({ stopAllPlayback }) => {
  const {
    scale, tone, startOctave, phraseMode, phraseOctaves, phraseDescend, phraseLoop,
    oncePerTone, highlightEnabled, legendOnly, octaveHighlight, minimalHighlight,
  } = useFormStore((state) => ({
    scale: state.scale, tone: state.tone, startOctave: state.startOctave,
    phraseMode: state.phraseMode, phraseOctaves: state.phraseOctaves,
    phraseDescend: state.phraseDescend, phraseLoop: state.phraseLoop,
    oncePerTone: state.oncePerTone, highlightEnabled: state.highlightEnabled,
    legendOnly: state.legendOnly, octaveHighlight: state.octaveHighlight,
    minimalHighlight: state.minimalHighlight,
  }));

  const apply = useCallback((partial: Partial<FormState>) => {
    stopAllPlayback();
    setFormState(partial);
  }, [stopAllPlayback]);

  return (
    <div className="flex flex-col gap-4">
      {/* Scale + Key */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Scale</label>
          <Select value={scale} onValueChange={(v) => apply({ scale: v as ScaleName })}>
            <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {Object.keys(scales).map((s) => (
                <SelectItem key={s} value={s} className="text-xs focus:bg-white/[0.08] focus:text-white">{ucFirst(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Key</label>
            <Select value={tone} onValueChange={(v) => apply({ tone: v as Tone })}>
              <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {tones.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs focus:bg-white/[0.08] focus:text-white">{t.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Octave</label>
            <Select value={String(startOctave)} onValueChange={(v) => apply({ startOctave: parseInt(v, 10) })}>
              <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {[0,1,2,3,4,5,6,7,8,9].map((o) => (
                  <SelectItem key={o} value={String(o)} className="text-xs focus:bg-white/[0.08] focus:text-white">{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Phrase */}
      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
        <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Phrase</label>
        <Select value={phraseMode} onValueChange={(v) => apply({ phraseMode: v as PhraseMode })}>
          <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="full-scale" className="text-xs focus:bg-white/[0.08] focus:text-white">📈 Full Scale</SelectItem>
            <SelectItem value="snake" className="text-xs focus:bg-white/[0.08] focus:text-white">🐍 Snake Pattern</SelectItem>
            <SelectItem value="snake-complex" className="text-xs focus:bg-white/[0.08] focus:text-white">🐍 Snake Complex</SelectItem>
            <SelectItem value="motif-1232" className="text-xs focus:bg-white/[0.08] focus:text-white">🎵 1-2-3-2 Motif</SelectItem>
            <SelectItem value="thirds" className="text-xs focus:bg-white/[0.08] focus:text-white">🎼 Thirds</SelectItem>
            <SelectItem value="fourths" className="text-xs focus:bg-white/[0.08] focus:text-white">🎼 Fourths</SelectItem>
            <SelectItem value="sixths" className="text-xs focus:bg-white/[0.08] focus:text-white">🎼 Sixths</SelectItem>
            <SelectItem value="four-note-groups" className="text-xs focus:bg-white/[0.08] focus:text-white">🎼 Four Note Groups</SelectItem>
            <SelectItem value="triads" className="text-xs focus:bg-white/[0.08] focus:text-white">🎹 Triads</SelectItem>
            <SelectItem value="sevenths" className="text-xs focus:bg-white/[0.08] focus:text-white">🎹 Sevenths</SelectItem>
            <SelectItem value="alternate-picking" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Alternate Picking</SelectItem>
            <SelectItem value="pedal-tone" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Pedal Tone</SelectItem>
            <SelectItem value="sequence-asc" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Sequence Up</SelectItem>
            <SelectItem value="sequence-desc" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Sequence Down</SelectItem>
            <SelectItem value="skip-pattern" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Skip Pattern</SelectItem>
            <SelectItem value="sweep-arp" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Sweep Arpeggio</SelectItem>
            <SelectItem value="neo-classical" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Neo-Classical</SelectItem>
            <SelectItem value="power-chord" className="text-xs focus:bg-white/[0.08] focus:text-white">🎸 Power Chord</SelectItem>
            <SelectItem value="djent-palm" className="text-xs focus:bg-white/[0.08] focus:text-white">🤘 Djent Palm Mute</SelectItem>
            <SelectItem value="polyrhythm" className="text-xs focus:bg-white/[0.08] focus:text-white">🤘 Polyrhythm 7/4</SelectItem>
            <SelectItem value="breakdown-chug" className="text-xs focus:bg-white/[0.08] focus:text-white">🤘 Breakdown Chug</SelectItem>
            <SelectItem value="tremolo" className="text-xs focus:bg-white/[0.08] focus:text-white">🤘 Tremolo Picking</SelectItem>
            <SelectItem value="legato-cascade" className="text-xs focus:bg-white/[0.08] focus:text-white">🤘 Legato Cascade</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Octaves</label>
          <Select value={String(phraseOctaves)} onValueChange={(v) => apply({ phraseOctaves: parseInt(v, 10) })}>
            <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {[1,2,3,4,5].map((o) => (
                <SelectItem key={o} value={String(o)} className="text-xs focus:bg-white/[0.08] focus:text-white">{o} octave{o > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2.5">
          <FormToggle id="phraseDescend" label="Descend" checked={phraseDescend} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ phraseDescend: v })} />
          <FormToggle id="phraseLoop" label="Loop" checked={phraseLoop} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ phraseLoop: v })} />
          <FormToggle id="oncePerTone" label="Once per tone" checked={oncePerTone} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ oncePerTone: v })} />
        </div>
      </div>

      {/* Highlights */}
      <div className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-4">
        <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Highlights</label>
        <FormToggle id="highlightEnabled" label="Highlight notes" checked={highlightEnabled} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ highlightEnabled: v })} />
        <FormToggle id="legendOnly" label="Legend only" checked={legendOnly} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ legendOnly: v })} />
        <FormToggle id="octaveHighlight" label="Octave highlight" checked={octaveHighlight} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ octaveHighlight: v })} />
        <FormToggle id="minimalHighlight" label="Minimal highlight" checked={minimalHighlight} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ minimalHighlight: v })} />
      </div>
    </div>
  );
};

export default ScaleControls;
