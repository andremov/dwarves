import { expect, test } from 'vitest'
import { annotationPin, cardAnnotationPins, pinRowHeight } from '../../src/model/annotationPins'

test('every comment type has a readable stable pin token', () => {
  expect(annotationPin(null)).toEqual({ icon: 'comment', tone: 'freeform', label: 'Comment' })
  expect(annotationPin('telling')).toEqual({ icon: 'slate', tone: 'telling', label: 'Telling' })
  expect(annotationPin('flat')).toEqual({ icon: 'person', tone: 'flat', label: 'Flat' })
  expect(annotationPin('stakes')).toEqual({ icon: 'fire', tone: 'stakes', label: 'Stakes' })
  expect(annotationPin('dialogue')).toEqual({ icon: 'chats', tone: 'dialogue', label: 'Dialogue' })
  expect(annotationPin('pov')).toEqual({ icon: 'eye', tone: 'pov', label: 'Point of view' })
  expect(annotationPin('info-dump')).toEqual({ icon: 'stack', tone: 'info-dump', label: 'Info-dump' })
  expect(annotationPin('continuity')).toEqual({ icon: 'history', tone: 'continuity', label: 'Continuity' })
  expect(annotationPin('drag')).toEqual({ icon: 'hourglass', tone: 'drag', label: 'Drag' })
  expect(annotationPin('unclear')).toEqual({ icon: 'question', tone: 'unclear', label: 'Unclear' })
  expect(annotationPin('tighten')).toEqual({ icon: 'scissors', tone: 'tighten', label: 'Tighten' })
})

test('card pins are one-per-comment in a non-overlapping row', () => {
  expect(cardAnnotationPins([{ id: 'a' }, { id: 'b' }] as any)).toEqual([
    { commentId: 'a', offsetX: 0 }, { commentId: 'b', offsetX: 36 },
  ])
})

test('card pin placement is deterministic and handles an empty card', () => {
  expect(cardAnnotationPins([])).toEqual([])
  expect(cardAnnotationPins([{ id: 'b' }, { id: 'a' }, { id: 'b' }])).toEqual([
    { commentId: 'b', offsetX: 0 },
    { commentId: 'a', offsetX: 36 },
    { commentId: 'b', offsetX: 72 },
  ])
})

test('a card reserves a pin row below itself only when it has pins', () => {
  expect(pinRowHeight(0)).toBe(0)
  expect(pinRowHeight(1)).toBe(8 + 28 + 8)
  expect(pinRowHeight(3)).toBe(pinRowHeight(1)) // one row, however many pins
})
