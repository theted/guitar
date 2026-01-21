import React from "react";
import ControlsLayout from "@/components/controls/ControlsLayout";
import ScaleControls from "@/components/controls/ScaleControls";
import InstrumentControls from "@/components/controls/InstrumentControls";
import PlaybackControls from "@/components/controls/PlaybackControls";

interface ControlsProps {
  stopAllPlayback: () => void;
}

const Controls: React.FC<ControlsProps> = ({ stopAllPlayback }) => {
  return (
    <ControlsLayout>
      <ScaleControls stopAllPlayback={stopAllPlayback} />
      <InstrumentControls stopAllPlayback={stopAllPlayback} />
      <PlaybackControls stopAllPlayback={stopAllPlayback} />
    </ControlsLayout>
  );
};

export default Controls;
