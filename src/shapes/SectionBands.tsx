import { useEditor, useValue } from 'tldraw'
import { sectionBands } from '../model/sectionBands'
import './sectionBands.css'

/**
 * The column each section owns, washed in behind the cards so membership is
 * visible rather than inferred from position. Mounted in tldraw's `OnTheCanvas`
 * layer (page space, behind the shapes) and derived from the same rule the
 * linear draft compiles with — see src/model/sectionBands.ts.
 */
export function SectionBands() {
  const editor = useEditor()
  const bands = useValue('sectionBands', () => {
    const sections: { id: string; x: number; y: number }[] = []
    let right = -Infinity
    let bottom = -Infinity
    for (const shape of editor.getCurrentPageShapes()) {
      const bounds = editor.getShapePageBounds(shape.id)
      if (!bounds) continue
      if (shape.type === 'section') sections.push({ id: shape.id, x: bounds.x, y: bounds.y })
      right = Math.max(right, bounds.maxX)
      bottom = Math.max(bottom, bounds.maxY)
    }
    return sectionBands(sections, { right, bottom })
  }, [editor])

  return (
    <>
      {bands.map((band) => (
        <div
          key={band.sectionId}
          className="elves-section-band"
          data-parity={band.index % 2 === 0 ? 'even' : 'odd'}
          style={{
            transform: `translate(${band.x}px, ${band.y}px)`,
            width: band.w,
            height: band.h,
          }}
        />
      ))}
    </>
  )
}
