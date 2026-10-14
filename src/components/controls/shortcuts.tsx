import React from 'react';

// The keyboard shortcuts, listed in Settings and on the help page. The keys
// themselves are handled in useKeyboardShortcuts and neckNavigation.
export const SHORTCUTS: Array<[string, string]> = [
  ['Space', 'Play or pause'],
  ['Esc', 'Stop'],
  ['↑ ↓', 'Tempo up or down'],
  ['← →', 'Previous or next key'],
  ['?', 'Help'],
];

// Once Tab has moved focus onto the neck
export const NECK_SHORTCUTS: Array<[string, string]> = [
  ['Arrows', 'Move between frets and strings'],
  ['Enter', 'Play the note'],
  ['⇧ Arrow', 'Move and play'],
  ['Home End', 'Open string, last fret'],
];

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="rounded-md bg-surface px-2 py-0.5 font-sans text-xs font-semibold text-ink ring-1 ring-inset ring-line">
    {children}
  </kbd>
);

// A fixed key column, so consecutive lists line up
export const ShortcutList: React.FC<{ items: Array<[string, string]> }> = ({ items }) => (
  <dl className="grid grid-cols-[5.5rem_1fr] items-center gap-x-4 gap-y-2 text-sm">
    {items.map(([keys, action]) => (
      <React.Fragment key={keys}>
        <dt><Kbd>{keys}</Kbd></dt>
        <dd className="text-ink-2">{action}</dd>
      </React.Fragment>
    ))}
  </dl>
);
