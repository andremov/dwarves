import type { AnnotationMessage, CommentType } from './types'
import type { PersonalityId } from './reviews'

export interface FeedbackProps {
  w: number
  h: number
  text: string
  authoredBy: string
  type: CommentType | null
  reviewId: string | null
  reviewer: PersonalityId | null
  resolved: boolean
  /** Optional so existing feedback annotations remain readable as one Claude turn. */
  messages?: AnnotationMessage[]
  /**
   * The cards this note concerns, when it concerns several (2+). The note then
   * draws a brace gathering them and sits at its tip (see model/brace.ts).
   * Absent for a note about a relationship or gap with no specific cards.
   */
  cardIds?: string[]
}

/** Feedback is now a compact point annotation, not an invisible card. */
export const FEEDBACK_DEFAULT_W = 28
export const FEEDBACK_DEFAULT_H = 28

/** Resolved feedback stays in the document for history, but leaves the active
 * canvas entirely — both rendering and hit-testing. */
export function feedbackIsHidden(
  shape: { type: string; props: { resolved?: boolean } },
): boolean {
  return shape.type === 'feedback' && shape.props.resolved === true
}

export function makeFeedbackProps(
  text = '', authoredBy = 'claude',
  metadata: Partial<Pick<FeedbackProps, 'type' | 'reviewId' | 'reviewer' | 'cardIds'>> = {},
): FeedbackProps {
  return {
    w: FEEDBACK_DEFAULT_W, h: FEEDBACK_DEFAULT_H, text, authoredBy,
    type: metadata.type ?? null, reviewId: metadata.reviewId ?? null,
    reviewer: metadata.reviewer ?? null, resolved: false, messages: [],
    ...(metadata.cardIds?.length ? { cardIds: [...metadata.cardIds] } : {}),
  }
}
