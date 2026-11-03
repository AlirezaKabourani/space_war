import { useRef } from "react";
import { SCENARIO5_GLOSSARY_FA } from "./uiContentFa";
const Definitions = () => <dl className="s5-glossary-definitions">{Object.entries(SCENARIO5_GLOSSARY_FA).map(([term, definition]) =>
  <div key={term}><dt><bdi dir="ltr">{term}</bdi></dt><dd>{definition}</dd></div>,
)}</dl>;
export const ScenarioFiveGlossary = ({ inline = false }: { inline?: boolean }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  if (inline) return <section className="s5-glossary-inline" aria-label="راهنمای اصطلاحات"><h3>راهنمای اصطلاحات</h3><Definitions /></section>;
  return <>
    <button type="button" className="s5-secondary-button s5-glossary-control" onClick={() => dialog.current?.showModal()}>راهنمای اصطلاحات</button>
    <dialog ref={dialog} className="s5-glossary-dialog" aria-labelledby="s5-glossary-title" dir="rtl">
      <h2 id="s5-glossary-title">راهنمای اصطلاحات</h2><Definitions />
      <button type="button" className="s5-secondary-button" onClick={() => dialog.current?.close()}>بستن راهنمای اصطلاحات</button>
    </dialog>
  </>;
};
