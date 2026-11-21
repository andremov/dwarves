import { expect, test } from 'vitest'
import { BAND_PAD, sectionBands } from '../../src/model/sectionBands'
import { compileDraft, type DraftCardInput } from '../../src/model/draft'

const content = { right: 2000, bottom: 800 }

test('no sections means no bands', () => {
  expect(sectionBands([], content)).toEqual([])
})

test('each band runs from its left edge to the next one, the last to the content edge', () => {
  const bands = sectionBands([
    { id: 'b', x: 1000, y: -100 },
    { id: 'a', x: 0, y: -140 },
  ], content)
  expect(bands).toEqual([
    { sectionId: 'a', index: 0, x: 0, y: -140 - BAND_PAD, w: 1000, h: 800 + BAND_PAD - (-140 - BAND_PAD) },
    { sectionId: 'b', index: 1, x: 1000, y: -140 - BAND_PAD, w: 1000 + BAND_PAD, h: 800 + BAND_PAD - (-140 - BAND_PAD) },
  ])
})

test('two headers at one left edge: only the one the compile assigns cards to gets a band', () => {
  const bands = sectionBands([
    { id: 'first', x: 0, y: 0 },
    { id: 'second', x: 0, y: 500 },
  ], content)
  expect(bands.map((b) => b.sectionId)).toEqual(['second'])
})

test('a card sits inside the band of the section the draft compiles it under', () => {
  const sections = [
    { id: 's1', x: 0, y: -140, text: 'One', authoredBy: 'user' },
    { id: 's2', x: 1000, y: -140, text: 'Two', authoredBy: 'user' },
  ]
  const card = (id: string, x: number, y: number): DraftCardInput => ({
    id, kind: 'prose', x, y, w: 370, h: 100, text: id, mergedInto: null, draftExcluded: false,
  })
  // A card straddling the boundary belongs where its CENTER falls.
  const cards = [card('left', 100, 0), card('straddle', 700, 900), card('right', 1500, 0)]
  const bands = sectionBands(sections, { right: 1870, bottom: 1000 })
  for (const block of compileDraft(cards, sections)) {
    const band = bands.find((b) => b.sectionId === block.sectionId)!
    for (const item of block.items) {
      const c = cards.find((k) => k.id === item.id)!
      const cx = c.x + c.w / 2
      expect(cx).toBeGreaterThanOrEqual(band.x)
      expect(cx).toBeLessThan(band.x + band.w)
    }
  }
})
