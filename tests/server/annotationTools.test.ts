import { expect, test } from 'vitest'
import { applyChangeSetToSnapshot } from '../../server/applyChangeSet'
import { isChangeSet, referencedAnnotationIds, referencedCardIds, referencedQuestionIds } from '../../src/model/changeset'

/** A canvas with one card carrying one comment, one question and one feedback note. */
function snapshot() {
  const shape = (id: string, type: string, props: Record<string, unknown>) => ({
    id, typeName: 'shape', type, x: 10, y: 20, parentId: 'page:page', props,
  })
  return {
    document: {
      store: {
        'shape:card': shape('shape:card', 'card', {
          w: 555, h: 120, kind: 'note', noteKind: 'text', text: 'beat', mergedInto: null,
          comments: [{ id: 'cmt-1', type: 'stakes', text: 'no cost', resolved: false, author: 'claude' }],
        }),
        'shape:q': shape('shape:q', 'question', { w: 555, h: 96, text: 'why?', authoredBy: 'claude', dismissed: false }),
        'shape:f': shape('shape:f', 'feedback', {
          w: 28, h: 28, text: 'gap', authoredBy: 'claude', type: null, reviewId: null, reviewer: null, resolved: false,
        }),
      },
    },
    session: null,
  } as any
}

const cs = (ops: unknown[]) => ({ id: 'x', author: 'claude', ops })

test('resolve_comment and move_annotations are valid change-set ops', () => {
  expect(isChangeSet(cs([{ kind: 'resolve_comment', cardId: 'shape:card', commentId: 'cmt-1' }]))).toBe(true)
  expect(isChangeSet(cs([{ kind: 'move_annotations', moves: [{ id: 'shape:q', x: 1, y: 2 }] }]))).toBe(true)
  expect(isChangeSet(cs([{ kind: 'move_annotations', moves: [] }]))).toBe(false)
  expect(isChangeSet(cs([{ kind: 'move_annotations', moves: [{ id: 'shape:q', x: 'far' }] }]))).toBe(false)
  expect(isChangeSet(cs([{ kind: 'resolve_comment', cardId: 'shape:card' }]))).toBe(false)
})

test('resolve_comment targets its card; move_annotations names its shapes', () => {
  const resolve = cs([{ kind: 'resolve_comment', cardId: 'shape:card', commentId: 'cmt-1' }])
  const move = cs([{ kind: 'move_annotations', moves: [{ id: 'shape:q', x: 1, y: 2 }, { id: 'shape:f', x: 3, y: 4 }] }])
  expect(referencedCardIds(resolve as any)).toEqual(['shape:card'])
  expect(referencedAnnotationIds(move as any)).toEqual(['shape:q', 'shape:f'])
})

test('the server resolves the named comment and moves questions and feedback', () => {
  const next = applyChangeSetToSnapshot(snapshot(), cs([
    { kind: 'resolve_comment', cardId: 'shape:card', commentId: 'cmt-1' },
    { kind: 'move_annotations', moves: [{ id: 'shape:q', x: 100, y: 200 }, { id: 'shape:f', x: 300, y: 400 }] },
  ]) as any) as any
  const store = next.document.store
  expect(store['shape:card'].props.comments[0].resolved).toBe(true)
  expect([store['shape:q'].x, store['shape:q'].y]).toEqual([100, 200])
  expect([store['shape:f'].x, store['shape:f'].y]).toEqual([300, 400])
})

test('move_annotations leaves cards alone even if a card id is named', () => {
  const next = applyChangeSetToSnapshot(snapshot(), cs([
    { kind: 'move_annotations', moves: [{ id: 'shape:card', x: 999, y: 999 }] },
  ]) as any) as any
  expect([next.document.store['shape:card'].x, next.document.store['shape:card'].y]).toEqual([10, 20])
})

test('dismiss_question hides the question but keeps it in the file', () => {
  const op = { kind: 'dismiss_question', questionId: 'shape:q' }
  expect(isChangeSet(cs([op]))).toBe(true)
  expect(isChangeSet(cs([{ kind: 'dismiss_question' }]))).toBe(false)
  expect(referencedQuestionIds(cs([op]) as any)).toEqual(['shape:q'])
  const next = applyChangeSetToSnapshot(snapshot(), cs([op]) as any) as any
  expect(next.document.store['shape:q'].props).toMatchObject({ dismissed: true, text: 'why?' })
})
