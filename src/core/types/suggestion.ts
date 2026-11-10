export type SuggestionKind = "scenario" | "general";

export const SUGGESTION_LABELS: Record<SuggestionKind, string> = {
  scenario: "پیشنهاد سناریو",
  general: "پیشنهادات",
};

export const MAX_SUGGESTION_LENGTH = 10000;

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  kind: SuggestionKind;
  text: string;
  createdAt: string;
}
