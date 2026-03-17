import React from 'react';

type ControlsLayoutProps = {
  children: React.ReactNode;
};

// ControlsLayout is superseded by ControlsPanel — kept for compatibility
const ControlsLayout: React.FC<ControlsLayoutProps> = ({ children }) => (
  <>{children}</>
);

export default ControlsLayout;
