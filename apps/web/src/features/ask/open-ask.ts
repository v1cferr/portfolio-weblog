/** Opens the docked Ask panel from anywhere (a hero button, a card), optionally sending a question. */
export const ASK_OPEN_EVENT = "v1c:ask-open";

export interface AskOpenDetail {
  question?: string;
}

export function openAsk(detail: AskOpenDetail = {}) {
  window.dispatchEvent(new CustomEvent<AskOpenDetail>(ASK_OPEN_EVENT, { detail }));
}
