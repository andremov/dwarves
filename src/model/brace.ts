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
      pin: { x: brace.x + brace.w / 2 - PIN_SIZE / 2, y: brace.y + BRACE_DEPTH + BRACE_PIN_GAP },
    }
  }
  const brace = { x: right + BRACE_GAP, y: top, w: BRACE_DEPTH, h: bottom - top }
  return {
    orientation: 'beside',
    brace,
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
