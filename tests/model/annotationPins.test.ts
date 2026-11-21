import { expect, test } from 'vitest'
import { annotationPin, cardAnnotationPins } from '../../src/model/annotationPins'

test('every comment type has a readable stable pin token', () => {
  expect(annotationPin(null)).toEqual({ icon: 'comment', tone: 'freeform', label: 'Comment' })
  expect(annotationPin('abstract')).toEqual({ icon: 'warning', tone: 'abstract', label: 'Abstract' })
  expect(annotationPin('told')).toEqual({ icon: 'image', tone: 'told', label: 'Told' })
  expect(annotationPin('unearned')).toEqual({ icon: 'chart-down', tone: 'unearned', label: 'Unearned' })
  expect(annotationPin('false-note')).toEqual({ icon: 'arrows', tone: 'false-note', label: 'False note' })
  expect(annotationPin('slack')).toEqual({ icon: 'scissors', tone: 'slack', label: 'Slack' })
  expect(annotationPin('buried')).toEqual({ icon: 'link', tone: 'buried', label: 'Buried' })
  expect(annotationPin('so-what')).toEqual({ icon: 'buildings', tone: 'so-what', label: 'So what' })
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
