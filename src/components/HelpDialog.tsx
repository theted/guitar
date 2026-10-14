import React from 'react';
import cx from 'classnames';
import { X } from 'lucide-react';
import {
  ARP_SHAPES, GLOW_COLORS, PHRASE_MODE_GROUPS, SCALE_GROUPS, TEMPO, TUNING_GROUPS,
} from '@/constants';
import { SOUND_GROUPS } from '@/components/controls/options';
import { Kbd, NECK_SHORTCUTS, SHORTCUTS, ShortcutList } from '@/components/controls/shortcuts';
import { useModalDialog } from '@/hooks/useModalDialog';

type HelpDialogProps = {
  open: boolean;
  onClose: () => void;
};

// Counts and names come from the catalogs, so the page stays true as they grow
const and = (items: readonly string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
const lower = (items: readonly string[]) => items.map((item) => item.toLowerCase());

const SCALE_COUNT = SCALE_GROUPS.reduce((n, group) => n + group.scales.length, 0);
const PATTERN_COUNT = PHRASE_MODE_GROUPS.reduce((n, group) => n + group.modes.length, 0);
const SOUND_COUNT = SOUND_GROUPS.reduce((n, group) => n + group.options.length, 0);
const TUNING_COUNT = TUNING_GROUPS.reduce((n, group) => n + group.tunings.length, 0);

const SECTIONS = [
  { id: 'help-scale', title: 'Key and scale' },
  { id: 'help-neck', title: 'The neck' },
  { id: 'help-play', title: 'Playing' },
  { id: 'help-follow', title: 'Following along' },
  { id: 'help-positions', title: 'Positions' },
  { id: 'help-chords', title: 'Chords' },
  { id: 'help-settings', title: 'Settings' },
  { id: 'help-keys', title: 'Keyboard' },
  { id: 'help-share', title: 'Saving and sharing' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const Section: React.FC<{ id: SectionId; children: React.ReactNode }> = ({ id, children }) => (
  <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-4 flex-col gap-3 border-t border-line pt-6">
    <h3 id={`${id}-title`} className="type-wide text-base font-bold text-ink">
      {SECTIONS.find((section) => section.id === id)?.title}
    </h3>
    {children}
  </section>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm leading-relaxed text-ink-2">{children}</p>
);

// A named control and what it does, as a two-column list on wider screens
const Terms: React.FC<{ items: Array<[React.ReactNode, React.ReactNode]> }> = ({ items }) => (
  <dl className="grid gap-x-5 gap-y-2.5 text-sm leading-relaxed sm:grid-cols-[8.5rem_1fr]">
    {items.map(([term, description], index) => (
      <React.Fragment key={index}>
        <dt className="font-semibold text-ink max-sm:-mb-2">{term}</dt>
        <dd className="text-ink-2">{description}</dd>
      </React.Fragment>
    ))}
  </dl>
);

// The neck's colours, drawn like its dots
const Dot: React.FC<{ fill: string; ink: string; hollow?: boolean; children?: React.ReactNode }> = ({
  fill, ink, hollow, children,
}) => (
  <span
    aria-hidden
    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.72rem] font-semibold"
    style={hollow
      ? { border: `2px solid ${fill}`, color: 'var(--ink-2)' }
      : { background: fill, color: ink }}
  >
    {children}
  </span>
);

const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="font-semibold text-ink">{children}</strong>
);

/**
 * What the app does and how to get around it. A dialog, like Settings: the
 * app is one screen, and help should open over it without losing your place.
 */
const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
  const dialogRef = React.useRef<HTMLElement | null>(null);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  useModalDialog(dialogRef, open, onClose);

  // The page is only built once it's first asked for, then kept, so closing
  // can still animate
  const [opened, setOpened] = React.useState(open);
  if (open && !opened) setOpened(true);

  // Scrolled directly: scrollIntoView could also move the page behind
  const goTo = (id: SectionId) => {
    const body = bodyRef.current;
    const section = document.getElementById(id);
    if (!body || !section) return;
    body.scrollTop = section.offsetTop - body.offsetTop - 16;
  };

  return (
    <>
      <div
        className={cx(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* A bottom sheet on phones, a centred page on wider screens */}
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        aria-hidden={!open}
        inert={!open}
        className={cx(
          'fixed z-50 flex flex-col bg-bg text-ink shadow-[0_0_60px_-10px_rgb(0_0_0/0.4)]',
          'transition-[opacity,translate,scale] duration-300 ease-out',
          'inset-x-0 bottom-0 h-[90dvh] rounded-t-2xl border-t border-line',
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[86dvh] sm:w-[min(760px,92vw)]',
          'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border',
          open
            ? 'translate-y-0 sm:scale-100 sm:opacity-100'
            : 'pointer-events-none translate-y-full sm:scale-[0.97] sm:opacity-0'
        )}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line px-5 sm:px-7">
          <h2 id="help-title" className="type-wide text-base font-bold">Help</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close help"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={bodyRef} className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-6 sm:px-7">
          {opened && <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <p className="type-title text-[1.6rem] leading-tight">Learn a scale by eye and by ear.</p>
              <P>
                Guitar Scale Finder puts any scale on a guitar or bass neck and plays it back in
                patterns you can follow, note by note. Practise it one position at a time, or
                arpeggiate the chords it makes. Whatever you change applies straight away, even
                while a phrase is playing.
              </P>
              <nav aria-label="Help topics" className="flex flex-wrap gap-1.5">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => goTo(section.id)}
                    className="h-8 rounded-lg px-2.5 text-sm text-ink-2 ring-1 ring-inset ring-line transition-colors hover:bg-surface hover:text-ink"
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>

            <Section id="help-scale">
              <Terms items={[
                ['Key', <>The row of twelve keys at the top. <Kbd>←</Kbd> and <Kbd>→</Kbd> step through them.</>],
                ['Scale', <>The big title is the scale picker: {SCALE_COUNT} scales, grouped as {and(SCALE_GROUPS.map((g) => g.label))}. The name is spelled the way the scale is usually written, so D♭ minor reads as C♯ minor.</>],
                ['Its notes', <>Alongside the title, each note of the scale with its degree. The tonic is underlined in amber. Each lights up as it plays.</>],
              ]} />
            </Section>

            <Section id="help-neck">
              <div className="flex flex-col gap-2.5 text-sm text-ink-2">
                <div className="flex items-center gap-3">
                  <Dot fill="var(--tonic)" ink="var(--tonic-ink)">E</Dot>
                  <span><B>Amber</B> is the tonic, the key's root, wherever it appears.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Dot fill="var(--chord)" ink="var(--chord-ink)">G</Dot>
                  <span><B>Teal</B> is a note of the selected chord.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Dot fill="var(--bone)" ink="var(--bone-ink)">A</Dot>
                  <span><B>Pale</B> is any other note of the scale.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Dot fill="var(--ink-3)" ink="var(--ink-2)" hollow>B</Dot>
                  <span><B>Hollow</B> notes are outside the selected position or chord: still there, stepped back.</span>
                </div>
              </div>
              <Terms items={[
                ['Labels', <>Above the neck on the right. <B>Notes</B> names each dot; <B>Degrees</B> gives its place in the scale (1, ♭3, 5); <B>Intervals</B> its distance from the tonic (P1, m3, P5). With a chord selected, <B>Chord</B> names notes from the chord's root.</>],
                ['Frets', <>Click any note to hear it. Fret numbers run under the neck.</>],
              ]} />
            </Section>

            <Section id="help-play">
              <Terms items={[
                ['Play', <>The round button at the bottom, or <Kbd>Space</Kbd>. <Kbd>Esc</Kbd> stops. A new key, pattern, tempo or sound carries on from the same step without stopping.</>],
                ['Pattern', <>{PATTERN_COUNT} ways through the scale, grouped as {and(PHRASE_MODE_GROUPS.map((g) => g.label))}. Each starts from the lowest tonic on the neck.</>],
                ['Octaves', <>How far the pattern climbs. Spans that don't fit on the neck are greyed out.</>],
                ['Descend, Loop, Swing', <>Come back down after going up; repeat until stopped; play the notes in long–short pairs.</>],
                ['Tempo', <>{TEMPO.MIN} to {TEMPO.MAX} bpm, one note per beat. <Kbd>↑</Kbd> and <Kbd>↓</Kbd> change it by {TEMPO.STEP}.</>],
                ['Sound', <>{SOUND_COUNT} instruments: {and(lower(SOUND_GROUPS.map((g) => g.label)))}. The speaker button mutes.</>],
              ]} />
              <P>On a phone, the arrow next to Pattern shows the rest of the controls.</P>
            </Section>

            <Section id="help-follow">
              <Terms items={[
                ['Phrase strip', <>Above the controls: every note of the phrase in order. It lights the note playing, outlines the next one and scrolls along.</>],
                ['On the neck', <>The note playing glows brightest, and the ones before it fade behind it as a trail. A ring closes in on the next note and lands as it plays, so you see where your hand goes next, and when.</>],
              ]} />
              <P>What lights up, how long it glows and its colour ({GLOW_COLORS.length} to choose from, or any other) are in Settings.</P>
            </Section>

            <Section id="help-positions">
              <P>
                The <B>Positions</B> row lists the scale's boxes: the notes under your hand in one
                place on the neck, with the frets each one covers. Pick one to show just that box, and
                Play walks through it note by note, up and (with Descend) back down. Pick it again, or
                the × that replaces Pattern, to go back. How many frets a box spans is in Settings.
              </P>
            </Section>

            <Section id="help-chords">
              <P>
                Seven-note scales get a <B>Chords</B> row: the chord built on each note of the scale
                (I, ii, iii …), as <B>Triads</B> or <B>7ths</B>. Hover one for its notes and formula.
              </P>
              <Terms items={[
                ['Pick a chord', <>It sounds, and its notes turn teal. Play then arpeggiates it in one of {ARP_SHAPES.length} shapes: {and(lower(ARP_SHAPES.map((s) => s.label)))}.</>],
                ['With a position', <>Play runs through the chord's notes in that box: its shape there.</>],
                ['Chord labels', <>Name notes from the chord's root: R, ♭3, 5, ♭7, and the rest of the scale as 9, 11 and 13.</>],
              ]} />
            </Section>

            <Section id="help-settings">
              <P>Open Settings with the button showing your tuning, at the top right.</P>
              <Terms items={[
                ['Instrument', <>{TUNING_COUNT} tunings for guitar, extended-range guitar and bass, 1 to 12 strings and up to 36 frets. Pitch sets the octave: 4 is real guitar pitch, 2 real bass. Left-handed mirrors the neck, and the low string can sit at the bottom, as in tab, or the top.</>],
                ['Sound', <>Room: how much reverb is heard around each note.</>],
                ['Positions', <>Hand span: 4, 5 or 6 frets per position.</>],
                ['Display', <>Hide the scale to test yourself on a bare neck, or show it on the lowest string only. Reduce motion, show the next note, and choose what lights up when a note plays (one fret, the same pitch, or every octave), for how long and in what colour.</>],
              ]} />
            </Section>

            <Section id="help-keys">
              <ShortcutList items={SHORTCUTS} />
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-ink-3">On the neck, after tabbing to it</p>
                <ShortcutList items={NECK_SHORTCUTS} />
              </div>
              <P>
                A control you clicked doesn't take Space or the arrows away from these; one you
                reached with Tab keeps its own keys.
              </P>
            </Section>

            <Section id="help-share">
              <Terms items={[
                ['Saved', <>Everything you set is remembered in this browser.</>],
                ['Copy link', <>At the top right: a link to this key, scale, pattern and tempo, to share or bookmark. The address bar always holds the same link.</>],
              ]} />
            </Section>
          </div>}
        </div>
      </section>
    </>
  );
};

export default HelpDialog;
