import { useShallow } from "zustand/react/shallow";
import { RIFFS, type Riff } from "@/constants";
import { useFormStore } from "@/store";

const NO_RIFFS: Riff[] = [];

// Riffs available for the current scale plus the active selection. A stale
// persisted id (e.g. after switching scales) simply resolves to "off", the
// same guard pattern useScalePositions uses.
export const useRiffs = (): { riffs: Riff[]; activeRiff: Riff | null } => {
  const { scale, selectedRiffId } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    selectedRiffId: state.selectedRiffId,
  })));

  const riffs = RIFFS[scale] ?? NO_RIFFS;
  const activeRiff =
    selectedRiffId != null ? riffs.find((riff) => riff.id === selectedRiffId) ?? null : null;

  return { riffs, activeRiff };
};
