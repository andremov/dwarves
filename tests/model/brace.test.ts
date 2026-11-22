import { expect, test } from 'vitest'
import { BRACE_DEPTH, BRACE_GAP, BRACE_LANE, BRACE_PIN_GAP, braceLayout, bracePath, layoutBracedNotes, stackBraces } from '../../src/model/brace'
import { PIN_SIZE } from '../../src/model/annotationPins'
import { isChangeSet, referencedCardIds } from '../../src/model/changeset'
import { makeFeedbackProps } from '../../src/model/feedback'

const card = (x: number, y: number, h = 100) => ({ x, y, w: 555, h })

test('fewer than two cards means no brace', () => {
  expect(braceLayout([])).toBeNull()
  expect(braceLayout([card(0, 0)])).toBeNull()
})

test('cards side by side get a brace under them, spanning first to last, pin at the tip', () => {
  const layout = braceLayout([card(0, 0), card(603, 0, 160), card(1206, 0)])!
  expect(layout.orientation).toBe('under')
  expect(layout.brace).toEqual({ x: 0, y: 160 + BRACE_GAP, w: 1761, h: BRACE_DEPTH })
  expect(layout.pin).toEqual({
    x: 1761 / 2 - PIN_SIZE / 2,
    y: 160 + BRACE_GAP + BRACE_DEPTH + BRACE_PIN_GAP,
  })
})

test('cards stacked in a column get a brace beside them on the right', () => {
  const layout = braceLayout([card(0, 0), card(0, 300), card(0, 600)])!
  expect(layout.orientation).toBe('beside')
  expect(layout.brace).toEqual({ x: 555 + BRACE_GAP, y: 0, w: BRACE_DEPTH, h: 700 })
  expect(layout.pin.x).toBe(555 + BRACE_GAP + BRACE_DEPTH + BRACE_PIN_GAP)
  expect(layout.pin.y).toBe(350 - PIN_SIZE / 2)
})

test('the brace path runs arm to arm through a tip at the middle', () => {
  expect(bracePath('under', 200)).toMatch(/^M 0 0 .* 100 18 .* 200 0$/)
  expect(bracePath('beside', 200)).toMatch(/^M 0 0 .* 18 100 .* 0 200$/)
})

test('create_feedback accepts 2+ distinct cardIds and nothing less', () => {
  const op = (cardIds?: unknown) => ({
    id: 'x', author: 'claude',
    ops: [{ kind: 'create_feedback', text: 'drags', x: 0, y: 0, feedback: { type: 'drag', cardIds } }],
  })
  expect(isChangeSet(op(undefined))).toBe(true)
  expect(isChangeSet(op(['shape:a', 'shape:b']))).toBe(true)
  expect(isChangeSet(op(['shape:a']))).toBe(false)
  expect(isChangeSet(op(['shape:a', 'shape:a']))).toBe(false)
  expect(isChangeSet(op(['shape:a', 3]))).toBe(false)
})

test("a braced note's cards must exist: they count as referenced cards", () => {
  expect(referencedCardIds({
    id: 'x', author: 'claude',
    ops: [{ kind: 'create_feedback', text: 'drags', x: 0, y: 0, feedback: { type: 'drag', cardIds: ['shape:a', 'shape:b'] } }],
  })).toEqual(['shape:a', 'shape:b'])
})

test('feedback props carry cardIds only when given', () => {
  expect(makeFeedbackProps('n', 'claude', { cardIds: ['shape:a', 'shape:b'] }).cardIds).toEqual(['shape:a', 'shape:b'])
  expect('cardIds' in makeFeedbackProps('n', 'claude', {})).toBe(false)
})

test('braces over the same cards stack into separate rows instead of overlapping', () => {
  const row = [card(0, 0), card(603, 0), card(1206, 0)]
  const [first, second] = stackBraces([braceLayout(row)!, braceLayout(row)!])
  expect(first).toEqual(braceLayout(row))
  expect(second.brace.y).toBe(first.brace.y + BRACE_LANE)
  expect(second.pin.y).toBe(first.pin.y + BRACE_LANE)
  expect(second.brace.x).toBe(first.brace.x)
})

test('braces that do not overlap stay where they are', () => {
  const left = braceLayout([card(0, 0), card(603, 0)])!
  const right = braceLayout([card(3000, 0), card(3603, 0)])!
  expect(stackBraces([left, right])).toEqual([left, right])
})

test('a brace marks each named card with a tick, so skipped cards between them show', () => {
  // Cards 1 and 3 of a row; card 2 (x=603) is not named and gets no tick.
  const layout = braceLayout([card(1206, 0), card(0, 0)])!
  expect(layout.ticks).toEqual([555 / 2, 1206 + 555 / 2])
  const column = braceLayout([card(0, 0), card(0, 600)])!
  expect(column.ticks).toEqual([50, 650])
  expect(stackBraces([layout, layout])[1].ticks).toEqual(layout.ticks)
})

test('layoutBracedNotes stacks open braced notes in index order and skips the rest', () => {
  const boxes: Record<string, { x: number; y: number; w: number; h: number }> = {
    a: card(0, 0), b: card(603, 0), c: card(1206, 0),
  }
  const layouts = layoutBracedNotes([
    { id: 'n2', index: 'a2', resolved: false, cardIds: ['a', 'b'] },
    { id: 'n1', index: 'a1', resolved: false, cardIds: ['a', 'b'] },
    { id: 'done', index: 'a0', resolved: true, cardIds: ['a', 'b'] },
    { id: 'plain', index: 'a3', resolved: false },
    { id: 'gone', index: 'a4', resolved: false, cardIds: ['a', 'missing'] },
  ], (id) => boxes[id] ?? null)
  expect([...layouts.keys()].sort()).toEqual(['n1', 'n2'])
  expect(layouts.get('n1')!.brace.y).toBe(100 + BRACE_GAP)
  expect(layouts.get('n2')!.brace.y).toBe(100 + BRACE_GAP + BRACE_LANE)
})
