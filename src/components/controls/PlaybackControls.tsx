import React, { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { setFormState, useFormStore, type FormState } from "@/store";
import FormNumber from "./FormNumber";
import FormToggle from "./FormToggle";

type PlaybackControlsProps = {
  stopAllPlayback: () => void;
};

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ stopAllPlayback }) => {
  const { bpm, trailLength, scheduleHorizon, swing, reduceAnimations } = useFormStore((state) => ({
    bpm: state.bpm,
    trailLength: state.trailLength,
    scheduleHorizon: state.scheduleHorizon,
    swing: state.swing,
    reduceAnimations: state.reduceAnimations,
  }));

  const applyFormState = useCallback(
    (partial: Partial<FormState>) => {
      stopAllPlayback();
      setFormState(partial);
    },
    [stopAllPlayback]
  );

  const handleScheduleChange = useCallback((value: number) => {
    const clamped = Math.min(5000, Math.max(200, value));
    setFormState({ scheduleHorizon: clamped });
  }, []);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <header className="flex items-center gap-2 text-lg font-semibold">
        <span className="text-2xl" aria-hidden>
          ▶
        </span>
        <span>Playback</span>
      </header>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label htmlFor="bpm" className="text-base text-white">
            BPM: {bpm}
          </Label>
          <Slider
            id="bpm"
            min={30}
            max={700}
            step={5}
            value={bpm}
            onChange={(value) => applyFormState({ bpm: value })}
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="trailLength" className="text-base text-white">
            Trail: {trailLength}ms
          </Label>
          <Slider
            id="trailLength"
            min={100}
            max={4000}
            step={50}
            value={trailLength}
            onChange={(value) => applyFormState({ trailLength: value })}
          />
        </div>

        <FormNumber
          id="scheduleHorizon"
          label="Schedule horizon (ms)"
          value={scheduleHorizon}
          min={200}
          max={5000}
          step={100}
          stopAllPlayback={stopAllPlayback}
          onChange={handleScheduleChange}
        />
      </div>

      <div className="grid gap-2 border-t border-white/10 pt-3">
        <FormToggle
          id="swing"
          label="Swing"
          checked={swing}
          stopAllPlayback={stopAllPlayback}
          onChange={(checked) => setFormState({ swing: checked })}
        />
        <FormToggle
          id="reduceAnimations"
          label="Reduce animations"
          checked={reduceAnimations}
          stopAllPlayback={stopAllPlayback}
          onChange={(checked) => setFormState({ reduceAnimations: checked })}
        />
      </div>
    </section>
  );
};

export default PlaybackControls;
