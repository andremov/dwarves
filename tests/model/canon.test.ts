import { expect, test } from 'vitest'
import { isCanonSection, owningSection } from '../../src/model/sections'
import { compileDraft } from '../../src/model/draft'
import { snapshotToCardMap, snapshotToCards } from '../../server/digest'

test('a section is canon when its title starts with the word "Canon"', () => {
  expect(isCanonSection('Canon')).toBe(true)
  expect(isCanonSection('  canon: world rules')).toBe(true)
  expect(isCanonSection('CANON (magic)')).toBe(true)
  expect(isCanonSection('Canonical order')).toBe(false)
  expect(isCanonSection('Reference: cast, canon')).toBe(false)
})

test('owningSection follows the draft rule: last left edge at or before x', () => {
  const sections = [{ x: 1000, id: 'b' }, { x: 0, id: 'a' }]
  expect(owningSection(sections, -5)).toBeNull()
  expect(owningSection(sections, 999)?.id).toBe('a')
  expect(owningSection(sections, 1000)?.id).toBe('b')
})

const card = (id: string, x: number) => ({
  id, kind: 'prose' as const, noteKind: null, x, y: 0, w: 100, h: 50, text: id, mergedInto: null, draftExcluded: false,
})

test('canon cards stay out of the compiled draft without spilling into the section before', () => {
  const blocks = compileDraft(
    [card('beat', 10), card('rule', 1010)],
    [
      { id: 's1', x: 0, text: 'Story', authoredBy: 'user' },
      { id: 's2', x: 1000, text: 'Canon', authoredBy: 'user' },
    ],
  )
  expect(blocks.map((b) => b.section)).toEqual(['Story'])
  expect(blocks[0].items.map((i) => i.id)).toEqual(['beat'])
})

test('read_map and read_cards mark cards in a canon section', () => {
  const shape = (id: string, type: string, x: number, props: Record<string, unknown>) => ({
    id, typeName: 'shape', type, x, y: 0, parentId: 'page:page', props,
  })
  const note = (id: string, x: number) =>
    shape(id, 'card', x, { w: 100, h: 50, kind: 'note', noteKind: 'text', text: id, comments: [], mergedInto: null })
  const snapshot = {
    document: {
      store: {
        'shape:s1': shape('shape:s1', 'section', 0, { text: 'Story', authoredBy: 'user' }),
        'shape:s2': shape('shape:s2', 'section', 1000, { text: 'Canon', authoredBy: 'user' }),
        'shape:beat': note('shape:beat', 10),
        'shape:rule': note('shape:rule', 1010),
      },
    },
    session: null,
  } as any
  const map = Object.fromEntries(snapshotToCardMap(snapshot).cards.map((c) => [c.id, c]))
  expect(map['shape:rule'].canon).toBe(true)
  expect(map['shape:beat'].canon).toBeUndefined()
  const cards = Object.fromEntries(snapshotToCards(snapshot).map((c) => [c.id, c]))
  expect(cards['shape:rule'].canon).toBe(true)
  expect(cards['shape:beat'].canon).toBe(false)
})
