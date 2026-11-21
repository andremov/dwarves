import type { CommentType } from './types'

export const PIN_GAP = 8
export const PIN_SIZE = 28

export type AnnotationPinIcon =
  | 'comment' | 'slate' | 'person' | 'fire' | 'chats'
  | 'eye' | 'stack' | 'history' | 'hourglass' | 'question' | 'scissors'

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
  telling: { icon: 'slate', tone: 'telling', label: 'Telling' },
  flat: { icon: 'person', tone: 'flat', label: 'Flat' },
  stakes: { icon: 'fire', tone: 'stakes', label: 'Stakes' },
  dialogue: { icon: 'chats', tone: 'dialogue', label: 'Dialogue' },
  pov: { icon: 'eye', tone: 'pov', label: 'Point of view' },
  'info-dump': { icon: 'stack', tone: 'info-dump', label: 'Info-dump' },
  continuity: { icon: 'history', tone: 'continuity', label: 'Continuity' },
  drag: { icon: 'hourglass', tone: 'drag', label: 'Drag' },
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
