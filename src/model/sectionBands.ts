/**
 * The page-space BANDS that sections own — the same membership rule compileDraft
 * uses (a card belongs to the LAST section whose left edge ≤ its center x), drawn
 * so the canvas shows it instead of leaving it to be inferred from position.
 *
 * A band runs from its section's left edge to the next section's left edge; the
 * last band runs to the right edge of the content. Vertically every band spans
 * the same rows — from the highest section header to the lowest shape — so the
 * bands read as columns of one table. Pure: no editor, no DOM.
 */

export interface BandSectionInput {
  id: string
  /** Page-space left edge — the band boundary. */
  x: number
  /** Page-space top of the header. */
  y: number
}

export interface ContentExtent {
  /** Right edge of everything on the page. */
  right: number
  /** Bottom edge of everything on the page. */
  bottom: number
}

export interface SectionBand {
  sectionId: string
  /** Position in left-to-right order, for alternating tints. */
  index: number
  x: number
  y: number
  w: number
  h: number
}

/** Breathing room so a band's wash doesn't stop flush against its last card. */
export const BAND_PAD = 40

export function sectionBands(sections: BandSectionInput[], content: ContentExtent): SectionBand[] {
  if (!sections.length) return []
  const sorted = [...sections].sort((a, b) => a.x - b.x)
  const top = Math.min(...sorted.map((s) => s.y)) - BAND_PAD
  const bottom = content.bottom + BAND_PAD
  const bands: SectionBand[] = []
  sorted.forEach((s, i) => {
    const next = sorted[i + 1]
    const right = next ? next.x : Math.max(content.right + BAND_PAD, s.x + BAND_PAD)
    const w = right - s.x
    // Two headers at the same left edge: the earlier one owns nothing (the
    // compile assigns its cards to the later one), so it gets no band.
    if (w <= 0) return
    bands.push({ sectionId: s.id, index: bands.length, x: s.x, y: top, w, h: bottom - top })
  })
  return bands
}
