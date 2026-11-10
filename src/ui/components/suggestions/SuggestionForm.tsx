import { useState, type FormEvent } from "react";
import type { Profile } from "../../../core/types/profile";
import { MAX_SUGGESTION_LENGTH, SUGGESTION_LABELS, type SuggestionKind } from "../../../core/types/suggestion";
import { submitSuggestion } from "../../../services/storage/suggestionStorage";

interface SuggestionFormProps {
  activeProfile: Profile;
  kind: SuggestionKind;
  onBack: () => void;
}

export function SuggestionForm({ activeProfile, kind, onBack }: SuggestionFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      submitSuggestion(activeProfile, kind, text);
      setText("");
      setSaved(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "ثبت پیشنهاد انجام نشد؛ دوباره تلاش کنید.");
    }
  };

  return (
    <div className="screen suggestion-screen" dir="rtl">
      <div className="card suggestion-card">
        <div className="screen-header">
          <h2 className="screen-title">{SUGGESTION_LABELS[kind]}</h2>
          <button className="link" onClick={onBack}>بازگشت به منوی اصلی</button>
        </div>
        <p>ثبت پیشنهاد با پروفایل <strong>{activeProfile.name}</strong></p>
        <p className="hint">{kind === "scenario" ? "ایده و جزئیات سناریوی پیشنهادی خود را بنویسید." : "نظر و پیشنهاد خود را برای بهبود سامانه بنویسید."} پیشنهادها برای بررسی در اختیار ادمین قرار می‌گیرند.</p>
        <form onSubmit={submit}>
          <div className="profile-form-field">
            <label htmlFor="suggestion-text">متن پیشنهاد</label>
            <textarea id="suggestion-text" rows={10} maxLength={MAX_SUGGESTION_LENGTH} required
              value={text} aria-invalid={!!error} aria-describedby={error ? "suggestion-length suggestion-error" : "suggestion-length"}
              placeholder={kind === "scenario" ? "سناریوی پیشنهادی شما…" : "پیشنهاد شما…"}
              onChange={(event) => { setText(event.target.value); setError(null); setSaved(false); }} />
            <span id="suggestion-length" className="profile-field-hint">{text.length.toLocaleString("fa-IR")} از {MAX_SUGGESTION_LENGTH.toLocaleString("fa-IR")} نویسه</span>
          </div>
          {error && <p id="suggestion-error" className="system-management-error" role="alert">{error}</p>}
          {saved && <p className="system-management-success" role="status">پیشنهاد شما با موفقیت ثبت شد.</p>}
          <div className="profile-form-actions"><button className="primary" type="submit" disabled={!text.trim()}>ثبت پیشنهاد</button></div>
        </form>
      </div>
    </div>
  );
}
