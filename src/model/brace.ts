import { PIN_SIZE } from './annotationPins'

/**
 * The brace a floating feedback note draws when it concerns several cards: a
 * curly bracket gathering them, with the note's pin at its tip. Pure geometry
 * in page space — the shape reads its target cards' live bounds and asks this
 * where the brace and pin go, so the brace follows the cards when they move.
 *
 * Orientation adapts to the cards' arrangement. Spread mostly left-to-right
 * (the usual narrative order) → the brace runs UNDER them, tip pointing down.
 * Stacked in a column → it runs BESIDE them on the right, tip pointing right.
 */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export type BraceOrientation = 'under' | 'beside'

export interface BraceLayout {
  orientation: BraceOrientation
  /** The brace's own box: long side spans the cards, short side is its depth. */
  brace: Box
  /** Top-left of the pin, which sits just past the brace's tip. */
  pin: { x: number; y: number }
  /** Where each named card's centre falls along the brace, measured from the
   * brace's start along its long side. Drawn as a dot, so a brace over cards
   * 1 and 3 visibly skips card 2 between them. */
  ticks: number[]
}

/** Clear space between the cards (or the pin row hanging under them) and the brace. */
export const BRACE_GAP = 10
/** How far the brace bows out, from its arms to its tip. */
export const BRACE_DEPTH = 18
/** Space between the brace's tip and the pin. */
export const BRACE_PIN_GAP = 4

export function braceLayout(targets: readonly Box[]): BraceLayout | null {
  if (targets.length < 2) return null
  const left = Math.min(...targets.map((t) => t.x))
  const right = Math.max(...targets.map((t) => t.x + t.w))
  const top = Math.min(...targets.map((t) => t.y))
  const bottom = Math.max(...targets.map((t) => t.y + t.h))
  const centersX = targets.map((t) => t.x + t.w / 2)
  const centersY = targets.map((t) => t.y + t.h / 2)
  const spreadX = Math.max(...centersX) - Math.min(...centersX)
  const spreadY = Math.max(...centersY) - Math.min(...centersY)

  if (spreadX >= spreadY) {
    const brace = { x: left, y: bottom + BRACE_GAP, w: right - left, h: BRACE_DEPTH }
    return {
      orientation: 'under',
      brace,
      ticks: centersX.map((c) => c - left).sort((a, b) => a - b),
      pin: { x: brace.x + brace.w / 2 - PIN_SIZE / 2, y: brace.y + BRACE_DEPTH + BRACE_PIN_GAP },
    }
  }
  const brace = { x: right + BRACE_GAP, y: top, w: BRACE_DEPTH, h: bottom - top }
  return {
    orientation: 'beside',
    brace,
    ticks: centersY.map((c) => c - top).sort((a, b) => a - b),
    pin: { x: brace.x + BRACE_DEPTH + BRACE_PIN_GAP, y: brace.y + brace.h / 2 - PIN_SIZE / 2 },
  }
}

/**
 * SVG path for a curly brace filling a `length` × BRACE_DEPTH box, drawn in
 * the box's own coordinates. 'under': arms at the top corners, tip at the
 * bottom centre. 'beside': the same shape turned so arms are at the left
 * corners and the tip at the right centre.
 */
export function bracePath(orientation: BraceOrientation, length: number): string {
  const d = BRACE_DEPTH
  const mid = length / 2
  const r = Math.min(d, length / 4)
  // Points along the long axis (a) and the depth axis (b); `at` maps them to
  // x/y for the orientation.
  const at = (a: number, b: number) => (orientation === 'under' ? `${a} ${b}` : `${b} ${a}`)
  return [
    `M ${at(0, 0)}`,
    `Q ${at(0, d / 2)} ${at(r, d / 2)}`,
    `L ${at(mid - r, d / 2)}`,
    `Q ${at(mid, d / 2)} ${at(mid, d)}`,
    `Q ${at(mid, d / 2)} ${at(mid + r, d / 2)}`,
    `L ${at(length - r, d / 2)}`,
    `Q ${at(length, d / 2)} ${at(length, 0)}`,
  ].join(' ')
}

/** Radius of the dot marking each named card on the brace. */
export const BRACE_TICK_R = 3.5

/** A tick's centre in the brace's own coordinates: on the brace's straight run. */
export function tickPoint(orientation: BraceOrientation, along: number): { x: number; y: number } {
  const b = BRACE_DEPTH / 2
  return orientation === 'under' ? { x: along, y: b } : { x: b, y: along }
}

/** How far each further brace sits from the one before it when braces overlap. */
export const BRACE_LANE = BRACE_GAP + BRACE_DEPTH + BRACE_PIN_GAP + PIN_SIZE

/** The space a brace and its pin take up together. */
function footprint(layout: BraceLayout): Box {
  const extra = BRACE_PIN_GAP + PIN_SIZE
  return layout.orientation === 'under'
    ? { x: layout.brace.x, y: layout.brace.y, w: layout.brace.w, h: layout.brace.h + extra }
    : { x: layout.brace.x, y: layout.brace.y, w: layout.brace.w + extra, h: layout.brace.h }
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/**
 * Push a brace (and its pin) `lane` rows further out, away from its cards: down
 * for an 'under' brace, right for a 'beside' one. Lane 0 is the brace as laid out.
 */
export function stackBrace(layout: BraceLayout, lane: number): BraceLayout {
  if (lane <= 0) return layout
  const d = lane * BRACE_LANE
  const [dx, dy] = layout.orientation === 'under' ? [0, d] : [d, 0]
  return {
    orientation: layout.orientation,
    brace: { ...layout.brace, x: layout.brace.x + dx, y: layout.brace.y + dy },
    pin: { x: layout.pin.x + dx, y: layout.pin.y + dy },
    ticks: layout.ticks,
  }
}

/**
 * Lay out several braces so none draws over another. Braces are placed in the
 * order given; each takes the first lane where its brace and pin clear every
 * brace already placed. Same order in, same layout out, so every note's shape
 * computes the same answer independently.
 */
export function stackBraces(layouts: readonly BraceLayout[]): BraceLayout[] {
  const placed: BraceLayout[] = []
  for (const layout of layouts) {
    let lane = 0
    let candidate = layout
    while (placed.some((other) => overlaps(footprint(candidate), footprint(other)))) {
      lane += 1
      candidate = stackBrace(layout, lane)
    }
    placed.push(candidate)
  }
  return placed
}

/** What layoutBracedNotes needs to know about a feedback note. */
export interface BracedNoteInput {
  id: string
  /** tldraw fractional index; notes are stacked in (index, id) order. */
  index: string
  resolved: boolean
  cardIds?: readonly string[] | null
}

/**
 * Brace layouts for every open note that gathers two or more live cards,
 * stacked so none overlaps another. `boxOf` gives a card's page box (including
 * the pin row it reserves below itself), or null when the card is gone or
 * merged away. The canvas and read_map both call this, so the pin the agent is
 * told about is the pin the user sees.
 */
export function layoutBracedNotes(
  notes: readonly BracedNoteInput[],
  boxOf: (cardId: string) => Box | null,
): Map<string, BraceLayout> {
  const ordered = notes
    .filter((n) => !n.resolved && (n.cardIds?.length ?? 0) >= 2)
    .sort((a, b) => (a.index < b.index ? -1 : a.index > b.index ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const braced: { id: string; layout: BraceLayout }[] = []
  for (const note of ordered) {
    const boxes = (note.cardIds ?? []).map(boxOf).filter((b): b is Box => b !== null)
    const layout = braceLayout(boxes)
    if (layout) braced.push({ id: note.id, layout })
  }
  const stacked = stackBraces(braced.map((b) => b.layout))
  return new Map(braced.map((b, i) => [b.id, stacked[i]]))
}
