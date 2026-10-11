import type { KeyboardEvent } from "react"

/** One tab stop per group; arrows select and focus the next visible choice. */
export function moveRadio(event: KeyboardEvent<HTMLButtonElement>, select: () => void) {
  const directions = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
  if (!directions.includes(event.key)) return
  const group = event.currentTarget.closest('[role="radiogroup"]')
  const choices = Array.from(group?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []).filter(
    (button) => !button.disabled && button.getClientRects().length > 0,
  )
  const index = choices.indexOf(event.currentTarget)
  if (index < 0 || !choices.length) return
  event.preventDefault()
  const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1
  const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (index + step + choices.length) % choices.length
  if (next === index) select()
  else choices[next].click()
  choices[next].focus()
}
