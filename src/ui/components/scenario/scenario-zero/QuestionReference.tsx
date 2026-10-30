import { Fragment, useEffect, useRef, useState } from "react";
import type { QuizNode } from "../../../../core/types/scenario";
import { S0_GatewayToSpaceWargaming as scenario } from "../../../../scenarios/s0_gateway_space_wargaming/tree";
import { eventLogger } from "../../../../services/analytics/eventLogger";

interface Reference {
  label: string;
  text: string;
}

const definitionReferences: Record<string, { label: string; nodeId: string }> = {
  warGameQuiz1: { label: "بر اساس تعریف", nodeId: "warGameIntro" },
  warGameTypesQuiz1: { label: "بر اساس تعریف", nodeId: "warGameTypesIntro" },
  spaceWarGameQuiz1: { label: "بر اساس مقدمه", nodeId: "spaceWarGameIntro" },
};

const ReferenceDialog = ({ reference, nodeId, onDismiss }: { reference: Reference; nodeId: string; onDismiss: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current!;
    const trigger = document.activeElement;
    const startedAt = performance.now();
    dialog.showModal();
    eventLogger.log({ type: "reference_open", scenarioId: scenario.id, nodeId, action: "quiz_example", detail: { label: reference.label } });
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
      eventLogger.log({ type: "reference_close", scenarioId: scenario.id, nodeId, action: "quiz_example", elapsedMs: performance.now() - startedAt, detail: { label: reference.label } });
    };
  }, [nodeId, reference.label]);
  return (
    <dialog ref={dialogRef} id="s0-reference-dialog" className="s0-reference-dialog" aria-labelledby="s0-reference-title" onCancel={(event) => {
      event.preventDefault(); onDismiss();
    }} onClose={(event) => {
      if (!event.currentTarget.open) onDismiss();
    }} dir="rtl">
      <div className="s0-reference-header"><span className="s0-eyebrow">مرور متن مرتبط با پرسش</span><button type="button" className="s0-reference-close" onClick={onDismiss} aria-label="بستن پنجرهٔ مثال">×</button></div>
      <h2 id="s0-reference-title">{reference.label.startsWith("بر اساس") ? "مرور مثال و توضیحات" : reference.label}</h2>
      <div className="s0-reference-body">{reference.text.split(/\n\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      <button type="button" className="primary" onClick={onDismiss}>بازگشت به پرسش</button>
    </dialog>
  );
};

export const QuestionReference = ({ node }: { node: QuizNode }) => {
  const [opened, setOpened] = useState<Reference | null>(null);
  const references: Reference[] = Object.entries(node.referenceTexts ?? {}).map(([label, text]) => ({ label: label.replace(/^\(|\)$/g, ""), text }));
  const definition = definitionReferences[node.id];
  if (definition) {
    const source = scenario.nodes[definition.nodeId];
    if (source.type === "info") references.push({ label: definition.label, text: source.text });
  }
  const pattern = references.length ? new RegExp(`(${references.map(({ label }) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length).join("|")})`, "g") : null;
  const parts = pattern ? node.question.split(pattern) : [node.question];
  return (
    <>
      <h2>{parts.map((part, index) => {
        const reference = references.find(({ label }) => label === part);
        return reference ? <a key={index} href="#s0-reference-dialog" className="s0-reference-link" aria-haspopup="dialog" aria-controls="s0-reference-dialog" onClick={(event) => {
          event.preventDefault(); setOpened(reference);
        }}>{part}</a> : <Fragment key={index}>{part}</Fragment>;
      })}</h2>
      {opened && <ReferenceDialog reference={opened} nodeId={node.id} onDismiss={() => setOpened(null)} />}
    </>
  );
};
