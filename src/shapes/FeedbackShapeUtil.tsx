import {
  ShapeUtil, TLBaseShape, HTMLContainer, Rectangle2d, T,
  createShapePropsMigrationIds, createShapePropsMigrationSequence,
  type Editor, type Geometry2d,
} from 'tldraw'
import { FEEDBACK_DEFAULT_H, FEEDBACK_DEFAULT_W, makeFeedbackProps } from '../model/feedback'
import { braceLayout, bracePath, stackBraces, type BraceLayout, type Box } from '../model/brace'
import { annotationPin } from '../model/annotationPins'
import type { CommentType } from '../model/types'
import type { CardShape } from './CardShapeUtil'
import { AnnotationPin } from '../components/AnnotationThread'
import './feedback.css'

export type FeedbackShape = TLBaseShape<'feedback', ReturnType<typeof makeFeedbackProps>>

const LEGACY_FEEDBACK_W = 370
const LEGACY_FEEDBACK_H = 96

/** Existing feedback was stored as a card-sized shape. Its saved x/y stays
 * untouched; only its hit-test rectangle changes to match the compact pin. */
export function compactFeedbackPinUp(props: Record<string, unknown>): void {
  props.w = FEEDBACK_DEFAULT_W
  props.h = FEEDBACK_DEFAULT_H
}

export function compactFeedbackPinDown(props: Record<string, unknown>): void {
  if (props.w === FEEDBACK_DEFAULT_W && props.h === FEEDBACK_DEFAULT_H) {
    props.w = LEGACY_FEEDBACK_W
    props.h = LEGACY_FEEDBACK_H
  }
}

const feedbackVersions = createShapePropsMigrationIds('feedback', { CompactPin: 1 })
export const feedbackMigrations = createShapePropsMigrationSequence({
  sequence: [{
    id: feedbackVersions.CompactPin,
    up: (props) => compactFeedbackPinUp(props as Record<string, unknown>),
    down: (props) => compactFeedbackPinDown(props as Record<string, unknown>),
  }],
})

/**
 * Where a note's brace goes, from the live page bounds of the cards it names.
 * Each card's box includes the pin row it reserves below itself, so an "under"
 * brace clears those pins. Cards that are gone or merged away drop out; with
 * fewer than two left there is no brace and the note is a plain floating pin.
 * Reading shapes and bounds here is reactive, so the brace tracks the cards.
 */
function ownBraceLayout(editor: Editor, shape: FeedbackShape): BraceLayout | null {
  const ids = shape.props.cardIds
  if (!ids || ids.length < 2) return null
  const boxes: Box[] = []
  for (const id of ids) {
    const card = editor.getShape<CardShape>(id as CardShape['id'])
    if (!card || card.type !== 'card' || card.props.mergedInto) continue
    const bounds = editor.getShapePageBounds(card.id)
    if (!bounds) continue
    boxes.push({ x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h + (card.props.commentH ?? 0) })
  }
  return braceLayout(boxes)
}

/**
 * A note's brace after making room for the others: every open braced note on
 * the page is laid out in canvas order and overlapping braces are stacked into
 * separate rows (see stackBraces), so two notes about the same cards don't
 * draw over each other.
 */
function braceLayoutFor(editor: Editor, shape: FeedbackShape): BraceLayout | null {
  if (!ownBraceLayout(editor, shape)) return null
  const notes = editor.getCurrentPageShapes()
    .filter((s): s is FeedbackShape => s.type === 'feedback' && !(s as FeedbackShape).props.resolved)
    .sort((a, b) => (a.index < b.index ? -1 : a.index > b.index ? 1 : a.id < b.id ? -1 : 1))
  const braced: { id: string; layout: BraceLayout }[] = []
  for (const note of notes) {
    const layout = ownBraceLayout(editor, note)
    if (layout) braced.push({ id: note.id, layout })
  }
  const stacked = stackBraces(braced.map((b) => b.layout))
  return stacked[braced.findIndex((b) => b.id === shape.id)] ?? null
}

/**
 * Where a note's pin sits, relative to its saved x/y. A braced note's pin is
 * drawn at the brace's tip, derived from the cards on every render rather
 * than written back to x/y, so it can't race the canvas load or drift; its
 * saved x/y stays where it was created. A plain note's pin sits at its x/y.
 */
function pinOffset(shape: FeedbackShape, layout: BraceLayout | null): { x: number; y: number } {
  return layout ? { x: layout.pin.x - shape.x, y: layout.pin.y - shape.y } : { x: 0, y: 0 }
}

/** The brace itself, drawn in the note's own coordinates. */
function FeedbackBrace({ shape, layout }: { shape: FeedbackShape; layout: BraceLayout }) {
  const { brace, orientation } = layout
  const length = orientation === 'under' ? brace.w : brace.h
  return (
    <svg
      className="elves-feedback-brace"
      aria-hidden="true"
      width={brace.w}
      height={brace.h}
      style={{
        left: brace.x - shape.x,
        top: brace.y - shape.y,
        // The comment type's label colour, e.g. --elves-cc-infodump-label.
        stroke: `var(--elves-cc-${annotationPin(shape.props.type as CommentType | null).tone.replace('-', '')}-label)`,
      }}
    >
      <path d={bracePath(orientation, length)} />
    </svg>
  )
}

export class FeedbackShapeUtil extends ShapeUtil<FeedbackShape> {
  static override type = 'feedback' as const
  static override migrations = feedbackMigrations
  static override props = {
    w: T.number, h: T.number, text: T.string, authoredBy: T.string,
    type: T.nullable(T.string), reviewId: T.nullable(T.string), reviewer: T.nullable(T.string), resolved: T.boolean,
    messages: T.arrayOf(T.object({ id: T.string, author: T.string, text: T.string, createdAt: T.string, inReplyToMessageId: T.string.optional() })).optional(),
    cardIds: T.arrayOf(T.string).optional(),
  }
  getDefaultProps(): FeedbackShape['props'] { return makeFeedbackProps() }
  // The hit area follows the pin. Card bounds read here are tracked by
  // tldraw's geometry cache, so it updates as the braced cards move.
  getGeometry(shape: FeedbackShape): Geometry2d {
    const at = pinOffset(shape, braceLayoutFor(this.editor, shape))
    return new Rectangle2d({ x: at.x, y: at.y, width: shape.props.w, height: shape.props.h, isFilled: true })
  }
  component(shape: FeedbackShape) {
    if (shape.props.resolved) return null
    const layout = braceLayoutFor(this.editor, shape)
    const at = pinOffset(shape, layout)
    return (
      <HTMLContainer style={{ overflow: 'visible' }}>
        {layout && <FeedbackBrace shape={shape} layout={layout} />}
        <div style={{ position: 'absolute', left: at.x, top: at.y }}>
          <AnnotationPin
            className="elves-feedback-pin"
            comment={{ id: shape.id, type: shape.props.type, text: shape.props.text, resolved: false, author: shape.props.authoredBy, messages: shape.props.messages }}
            target={{ kind: 'feedback', feedbackId: shape.id }}
          />
        </div>
      </HTMLContainer>
    )
  }
  indicator(shape: FeedbackShape) {
    const at = pinOffset(shape, braceLayoutFor(this.editor, shape))
    return <rect x={at.x} y={at.y} width={shape.props.w} height={shape.props.h} rx={8} />
  }
  override canResize() { return false }
  override canEdit() { return false }
}
