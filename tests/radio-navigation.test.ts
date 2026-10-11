// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import type { KeyboardEvent } from "react"
import { moveRadio } from "@/lib/radio-navigation"

afterEach(() => { document.body.innerHTML = "" })
function setup() {
  document.body.innerHTML = '<div role="radiogroup"><button role="radio">A</button><button role="radio" disabled>B</button><button role="radio" hidden>C</button><button role="radio">D</button></div>'
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')]
  buttons.forEach(button => vi.spyOn(button, "getClientRects").mockReturnValue(button.hidden ? [] as unknown as DOMRectList : [new DOMRect(0, 0, 44, 44)] as unknown as DOMRectList))
  const run = (key: string, currentTarget: HTMLButtonElement) => moveRadio({ key, currentTarget, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLButtonElement>, () => {})
  return { buttons, run }
}
describe("keyboard radio choices", () => {
  it("skips hidden and disabled choices and wraps around", () => {
    const { buttons, run } = setup()
    const click = vi.spyOn(buttons[3], "click")
    run("ArrowRight", buttons[0])
    expect(click).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(buttons[3])
    run("ArrowRight", buttons[3])
    expect(document.activeElement).toBe(buttons[0])
  })
  it("supports first, last and reverse selection", () => {
    const { buttons, run } = setup()
    run("End", buttons[0]); expect(document.activeElement).toBe(buttons[3])
    run("Home", buttons[3]); expect(document.activeElement).toBe(buttons[0])
    run("ArrowLeft", buttons[0]); expect(document.activeElement).toBe(buttons[3])
  })
})
