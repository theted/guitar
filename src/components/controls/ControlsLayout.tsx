import React from "react";

type ControlsLayoutProps = {
  children: React.ReactNode;
};

const ControlsLayout: React.FC<ControlsLayoutProps> = ({ children }) => {
  return (
    <div className="controls">
      <div className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/70 px-4 py-4 text-base text-white shadow-lg backdrop-blur-md">
        <div className="w-full overflow-x-auto pb-1">
          <div className="min-w-[900px] md:min-w-0 grid gap-4 md:grid-cols-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlsLayout;
