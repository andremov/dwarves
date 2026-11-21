import { expect, test } from 'vitest'
import { annotationPin, cardAnnotationPins } from '../../src/model/annotationPins'

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

test('card pins are one-per-comment and vertically non-overlapping', () => {
  expect(cardAnnotationPins([{ id: 'a' }, { id: 'b' }] as any)).toEqual([
    { commentId: 'a', offsetY: 0 }, { commentId: 'b', offsetY: 36 },
  ])
})

test('card pin placement is deterministic and handles an empty card', () => {
  expect(cardAnnotationPins([])).toEqual([])
  expect(cardAnnotationPins([{ id: 'b' }, { id: 'a' }, { id: 'b' }])).toEqual([
    { commentId: 'b', offsetY: 0 },
    { commentId: 'a', offsetY: 36 },
    { commentId: 'b', offsetY: 72 },
  ])
})
