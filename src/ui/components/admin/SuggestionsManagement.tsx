import { useEffect, useState } from "react";
import type { Profile } from "../../../core/types/profile";
import { SUGGESTION_LABELS, type Suggestion, type SuggestionKind } from "../../../core/types/suggestion";
import type { CognitiveAdminReadAccess } from "../../../services/storage/cognitiveAdminReadAccess";
import { listSuggestionsForAdmin, SUGGESTIONS_CHANGED_EVENT } from "../../../services/storage/suggestionStorage";

interface SuggestionsManagementProps {
  profiles: readonly Profile[];
  adminAccess: CognitiveAdminReadAccess | null;
  onBack: () => void;
}

export function SuggestionsManagement({ profiles, adminAccess, onBack }: SuggestionsManagementProps) {
  const [userId, setUserId] = useState("all");
  const [kind, setKind] = useState<SuggestionKind | "all">("all");
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh((value) => value + 1);
    window.addEventListener("storage", update);
    window.addEventListener(SUGGESTIONS_CHANGED_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(SUGGESTIONS_CHANGED_EVENT, update);
    };
  }, []);

  let entries: Suggestion[] = [];
  let error: string | null = null;
  try { entries = listSuggestionsForAdmin(adminAccess); }
  catch (failure) { error = failure instanceof Error ? failure.message : "خواندن پیشنهادها انجام نشد."; }
  const names = new Map(profiles.map((profile) => [profile.id, profile.name]));
  for (const entry of entries) {
    if (!names.has(entry.userId)) names.set(entry.userId, `${entry.userName} (پروفایل حذف‌شده)`);
  }
  const filtered = entries.filter((entry) => (userId === "all" || entry.userId === userId) && (kind === "all" || entry.kind === kind));

  return (
    <div className="screen system-management-screen" dir="rtl">
      <div className="card system-management-card">
        <div className="screen-header">
          <h2 id="suggestions-title" className="screen-title">پیشنهادهای کاربران</h2>
          <button className="link" onClick={onBack}>بازگشت به مدیریت سامانه</button>
        </div>
        <section className="system-management-section suggestions-management" aria-labelledby="suggestions-title">
          <p className="hint">مشاهده پیشنهادها به تفکیک کاربر و نوع، از جدیدترین به قدیمی‌ترین.</p>
          <div className="profile-form-grid">
            <div className="profile-form-field system-user-filter">
              <label htmlFor="suggestion-user-filter">کاربر</label>
              <select id="suggestion-user-filter" value={userId} onChange={(event) => setUserId(event.target.value)}>
                <option value="all">همهٔ کاربران</option>
                {[...names].map(([id, name]) => <option key={id} value={id}>{name} — {id}</option>)}
              </select>
            </div>
            <div className="profile-form-field system-user-filter">
              <label htmlFor="suggestion-kind-filter">نوع پیشنهاد</label>
              <select id="suggestion-kind-filter" value={kind} onChange={(event) => setKind(event.target.value as SuggestionKind | "all")}>
                <option value="all">همهٔ پیشنهادها</option>
                <option value="scenario">پیشنهاد سناریو</option>
                <option value="general">پیشنهادات</option>
              </select>
            </div>
          </div>
          <div className="system-management-actions">
            <span role="status">{filtered.length.toLocaleString("fa-IR")} پیشنهاد از {entries.length.toLocaleString("fa-IR")}</span>
            <button className="secondary" onClick={() => refresh((value) => value + 1)}>به‌روزرسانی پیشنهادها</button>
          </div>
          {error ? <p className="system-management-error" role="alert">{error}</p> : filtered.length === 0 ? (
            <p>{entries.length === 0 ? "هنوز پیشنهادی ثبت نشده است." : "پیشنهادی با این فیلترها پیدا نشد."}</p>
          ) : <div className="suggestion-list">{filtered.map((entry) => (
            <article key={entry.id} className="suggestion-entry">
              <div className="suggestion-entry-meta">
                <strong>{names.get(entry.userId)}</strong>
                <span className="badge">{SUGGESTION_LABELS[entry.kind]}</span>
                <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</time>
              </div>
              <p className="hint">شناسه کاربر: <bdi>{entry.userId}</bdi></p>
              <p className="suggestion-entry-text" dir="auto">{entry.text}</p>
            </article>
          ))}</div>}
        </section>
      </div>
    </div>
  );
}
