import { expect, test } from 'vitest'
import { BRACE_DEPTH, BRACE_GAP, BRACE_PIN_GAP, braceLayout, bracePath } from '../../src/model/brace'
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
