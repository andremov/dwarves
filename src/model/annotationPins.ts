import type { CommentType } from './types'

export const PIN_GAP = 8
export const PIN_SIZE = 28

export type AnnotationPinIcon =
  | 'comment' | 'warning' | 'chart-down' | 'link' | 'image'
  | 'arrows' | 'scissors' | 'question' | 'buildings'

export type AnnotationPin = {
  icon: AnnotationPinIcon
  tone: CommentType | 'freeform'
  label: string
}

export type CardAnnotationPin = {
  commentId: string
  offsetY: number
}

const PIN_TOKENS: Record<CommentType | 'freeform', AnnotationPin> = {
  abstract: { icon: 'warning', tone: 'abstract', label: 'Abstract' },
  told: { icon: 'image', tone: 'told', label: 'Told' },
  unearned: { icon: 'chart-down', tone: 'unearned', label: 'Unearned' },
  'false-note': { icon: 'arrows', tone: 'false-note', label: 'False note' },
  slack: { icon: 'scissors', tone: 'slack', label: 'Slack' },
  buried: { icon: 'link', tone: 'buried', label: 'Buried' },
  'so-what': { icon: 'buildings', tone: 'so-what', label: 'So what' },
  unclear: { icon: 'question', tone: 'unclear', label: 'Unclear' },
  tighten: { icon: 'scissors', tone: 'tighten', label: 'Tighten' },
  freeform: { icon: 'comment', tone: 'freeform', label: 'Comment' },
}

/** Return the stable visual and accessible tokens for an annotation type. */
export function annotationPin(type: CommentType | null): AnnotationPin {
  const token = PIN_TOKENS[type ?? 'freeform']
  return { ...token }
}

/** Place one compact pin per comment in source order, with a fixed clear gap. */
export function cardAnnotationPins(
  comments: readonly { id: string }[],
): CardAnnotationPin[] {
  return comments.map((comment, index) => ({
    commentId: comment.id,
    offsetY: index * (PIN_SIZE + PIN_GAP),
  }))
}
