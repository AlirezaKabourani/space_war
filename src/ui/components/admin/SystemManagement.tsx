import { useRef, useState, type ChangeEvent } from "react";
import type { Profile } from "../../../core/types/profile";
import { eventLogger } from "../../../services/analytics/eventLogger";
import { buildLogCSV, downloadFile } from "../../../services/analytics/logExport";
import { systemLogger } from "../../../services/analytics/systemLogger";
import {
  createSystemBackup, getBackupSummary, parseSystemBackup, resetSystemStorage,
  restoreSystemBackup, type SystemBackup,
} from "../../../services/storage/systemStorage";

interface SystemManagementProps {
  activeProfile: Profile;
  profiles: readonly Profile[];
  onBack: () => void;
  onManageProfiles: () => void;
}

const fileStamp = () => new Date().toISOString().replace(/[:.]/g, "-");
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "عملیات انجام نشد؛ دوباره تلاش کنید.";

export const SystemManagement = ({ activeProfile, profiles, onBack, onManageProfiles }: SystemManagementProps) => {
  const [, refresh] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<{ backup: SystemBackup; filename: string } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileReadRef = useRef(0);

  if (activeProfile.role !== "admin") {
    return <div className="screen"><div className="card"><p>دسترسی فقط برای ادمین فعال است.</p><button onClick={onBack}>بازگشت</button></div></div>;
  }

  const behaviorEvents = eventLogger.getEvents();
  const systemEvents = systemLogger.getEvents();
  const loggingEnabled = eventLogger.isLoggingEnabled();
  const users = new Map(profiles.map((profile) => [profile.id, profile.name]));
  for (const event of behaviorEvents) {
    if (event.userId && !users.has(event.userId)) users.set(event.userId, `${event.userName ?? event.userId} (پروفایل حذف‌شده)`);
  }
  const selectedEvents = selectedUserId === "all" ? behaviorEvents : behaviorEvents.filter((event) => event.userId === selectedUserId);

  const run = (action: () => void) => {
    setError(null);
    setMessage(null);
    try { action(); } catch (failure) { setError(errorMessage(failure)); }
    refresh((value) => value + 1);
  };

  const exportLogs = (kind: "behavior" | "system", format: "csv" | "json") => run(() => {
    const events = kind === "behavior" ? selectedEvents : systemEvents;
    const content = format === "csv" ? buildLogCSV(events) : JSON.stringify({
      format: "space-war-logs", version: 1, exportedAt: new Date().toISOString(), kind,
      selectedUserId: kind === "behavior" ? selectedUserId : "all", events,
    }, null, 2);
    downloadFile(`space-war-${kind}-logs-${fileStamp()}.${format}`, content, format === "csv" ? "text/csv" : "application/json");
    systemLogger.log("logs_exported", activeProfile, { kind, format, eventCount: events.length, selectedUserId });
    setMessage(`فایل ${events.length.toLocaleString("fa-IR")} رویداد برای دانلود آماده شد.`);
  });

  const exportBackup = () => run(() => {
    const backup = createSystemBackup();
    // Validate before offering a transfer file that cannot be restored.
    parseSystemBackup(JSON.stringify(backup));
    downloadFile(`space-war-full-backup-${fileStamp()}.json`, JSON.stringify(backup, null, 2));
    systemLogger.log("backup_exported", activeProfile, getBackupSummary(backup));
    setMessage("فایل پشتیبان کامل برای دانلود آماده شد. برای انتقال، همین فایل را در سامانهٔ مقصد بارگذاری کنید.");
  });

  const readBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const readId = ++fileReadRef.current;
    setReadingFile(true);
    setPendingBackup(null);
    setError(null);
    setMessage(null);
    setShowReset(false);
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error("حجم فایل باید کمتر از ۱۰۰ مگابایت باشد.");
      const backup = parseSystemBackup(await file.text());
      if (readId === fileReadRef.current) setPendingBackup({ backup, filename: file.name });
    } catch (failure) {
      if (readId === fileReadRef.current) setError(errorMessage(failure));
    } finally {
      if (readId === fileReadRef.current) setReadingFile(false);
    }
  };

  const importBackup = () => run(() => {
    if (!pendingBackup) return;
    restoreSystemBackup(pendingBackup.backup);
    systemLogger.log("backup_restored", activeProfile, {
      sourceExportedAt: pendingBackup.backup.exportedAt, ...getBackupSummary(pendingBackup.backup),
    });
    window.location.reload();
  });

  const summary = pendingBackup ? getBackupSummary(pendingBackup.backup) : null;
  return (
    <div className="screen system-management-screen" dir="rtl">
      <div className="card system-management-card">
        <div className="screen-header">
          <div><h2 className="screen-title">مدیریت سامانه</h2><p className="subtitle">کنترل ثبت رفتار، خروجی داده‌ها و انتقال اطلاعات بین سیستم‌ها</p></div>
          <button className="link" onClick={onBack}>بازگشت به منوی اصلی</button>
        </div>
        <div className="system-management-stats">
          <span>پروفایل‌ها: <strong>{profiles.length.toLocaleString("fa-IR")}</strong></span>
          <span>لاگ رفتاری: <strong>{behaviorEvents.length.toLocaleString("fa-IR")}</strong></span>
          <span>لاگ سامانه: <strong>{systemEvents.length.toLocaleString("fa-IR")}</strong></span>
          <button className="secondary" onClick={() => refresh((value) => value + 1)}>به‌روزرسانی آمار</button>
        </div>
        {error && <p className="system-management-error" role="alert">{error}</p>}
        {message && <p className="system-management-success" role="status">{message}</p>}
        {eventLogger.getStorageError() && <p className="system-management-error" role="alert">{eventLogger.getStorageError()}</p>}

        <section className="system-management-section" aria-labelledby="profiles-management-title">
          <h3 id="profiles-management-title">مدیریت پروفایل‌ها</h3>
          <p className="hint">ساخت و انتخاب پروفایل و حذف بازیکنان؛ پروفایل‌های ادمین و تست سناریو قابل حذف نیستند.</p>
          <button onClick={onManageProfiles}>باز کردن مدیریت پروفایل‌ها</button>
        </section>

        <section className="system-management-section" aria-labelledby="logging-title">
          <h3 id="logging-title">ثبت رفتار بازیکنان</h3>
          <p>وضعیت فعلی: <strong className={loggingEnabled ? "logging-active" : "logging-paused"}>{loggingEnabled ? "لاگ‌برداری فعال است" : "لاگ‌برداری متوقف است"}</strong></p>
          <p className="hint">این تنظیم برای همهٔ بازیکنان و سناریوهای قدیمی و جدید اعمال می‌شود و با بستن صفحه باقی می‌ماند. توقف، لاگ‌های قبلی را پاک نمی‌کند؛ رخدادهای مدیریتی سامانه مستقل ثبت می‌شوند.</p>
          <button className={loggingEnabled ? "secondary" : "primary"} onClick={() => run(() => {
            eventLogger.setLoggingEnabled(!loggingEnabled);
            systemLogger.log(loggingEnabled ? "behavior_logging_stopped" : "behavior_logging_started", activeProfile);
            setMessage(loggingEnabled ? "ثبت لاگ رفتاری متوقف شد." : "ثبت لاگ رفتاری شروع شد.");
          })}>{loggingEnabled ? "توقف لاگ‌برداری رفتاری" : "شروع لاگ‌برداری رفتاری"}</button>
        </section>

        <section className="system-management-section" aria-labelledby="logs-title">
          <h3 id="logs-title">دانلود لاگ‌های بازیکنان و سامانه</h3>
          <p className="hint">CSV شامل جزئیات تصمیم‌ها، شواهد، منابع و نتایج مدل‌های فعلی است. JSON ساختار کامل و تو‌در‌توی رویدادها را نگه می‌دارد. فایل لاگ برای تحلیل است؛ برای انتقال سامانه از پشتیبان کامل استفاده کنید.</p>
          <div className="profile-form-field system-user-filter">
            <label htmlFor="log-user-filter">لاگ رفتاری کدام بازیکن؟</label>
            <select id="log-user-filter" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              <option value="all">همهٔ پروفایل‌ها</option>
              {[...users].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div className="system-management-actions">
            <button onClick={() => exportLogs("behavior", "csv")}>دانلود لاگ رفتاری (CSV)</button>
            <button className="secondary" onClick={() => exportLogs("behavior", "json")}>لاگ رفتاری کامل (JSON)</button>
            <button onClick={() => exportLogs("system", "csv")}>دانلود لاگ سامانه (CSV)</button>
            <button className="secondary" onClick={() => exportLogs("system", "json")}>لاگ سامانه کامل (JSON)</button>
            <button className="secondary" onClick={() => run(() => {
              downloadFile(`space-war-all-logs-${fileStamp()}.json`, JSON.stringify({
                format: "space-war-all-logs", version: 1, exportedAt: new Date().toISOString(),
                behaviorEvents, systemEvents,
              }, null, 2));
              systemLogger.log("all_logs_exported", activeProfile, { behaviorEventCount: behaviorEvents.length, systemEventCount: systemEvents.length });
              setMessage("فایل همهٔ لاگ‌های بازیکنان و سامانه برای دانلود آماده شد.");
            })}>دانلود همهٔ لاگ‌ها (JSON)</button>
          </div>
        </section>

        <section className="system-management-section" aria-labelledby="backup-title">
          <h3 id="backup-title">پشتیبان کامل و انتقال سامانه</h3>
          <p>فایل پشتیبان شامل همهٔ پروفایل‌ها و اطلاعات تماس، پیشرفت بازی، لاگ‌های رفتاری و سامانه، داده‌های ذخیره‌شدهٔ سناریوها و تنظیمات است.</p>
          <p className="hint">بازیِ در حال اجرا فقط تا آخرین دادهٔ ذخیره‌شده منتقل می‌شود. بهتر است بازیکن پیش از تهیهٔ پشتیبان سناریو را تمام کند.</p>
          <ol className="system-transfer-steps"><li>در سیستم مبدأ، پشتیبان کامل را دانلود کنید.</li><li>فایل را به ویندوز یا مرورگر مقصد منتقل کنید.</li><li>با ادمین وارد شوید، فایل را بارگذاری و بازیابی را تأیید کنید.</li></ol>
          <div className="system-management-actions">
            <button className="primary" onClick={exportBackup}>دانلود پشتیبان کامل سامانه</button>
            <button disabled={readingFile} onClick={() => fileInputRef.current?.click()}>{readingFile ? "در حال بررسی فایل…" : "آپلود اطلاعات از سامانهٔ دیگر"}</button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={readBackup} aria-label="انتخاب فایل پشتیبان سامانه" />
          </div>
          {pendingBackup && summary && (
            <div className="system-confirmation" role="region" aria-label="پیش‌نمایش بازیابی پشتیبان">
              <h4>پیش‌نمایش فایل: <bdi>{pendingBackup.filename}</bdi></h4>
              <p>تاریخ پشتیبان: {new Date(pendingBackup.backup.exportedAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</p>
              <p>{summary.profileCount.toLocaleString("fa-IR")} پروفایل، {summary.behaviorEventCount.toLocaleString("fa-IR")} لاگ رفتاری، {summary.systemEventCount.toLocaleString("fa-IR")} لاگ سامانه و {summary.entryCount.toLocaleString("fa-IR")} بخش ذخیره‌شده</p>
              <p className="system-management-warning">بازیابی، همهٔ اطلاعات فعلی همین سامانه را با اطلاعات فایل جایگزین می‌کند. ابتدا از اطلاعات فعلی پشتیبان بگیرید. پس از بازیابی، صفحه دوباره باز می‌شود و ورود به ادمین نیاز به رمز دارد.</p>
              <div className="system-management-actions"><button className="danger" onClick={importBackup}>تأیید جایگزینی و بازیابی اطلاعات</button><button className="secondary" onClick={() => setPendingBackup(null)}>انصراف</button></div>
            </div>
          )}
        </section>

        <section className="system-management-section system-reset-section" aria-labelledby="reset-title">
          <h3 id="reset-title">ریست سامانه</h3>
          <p>تمام پروفایل‌های ساخته‌شده، پیشرفت‌ها، لاگ‌ها و داده‌های ذخیره‌شدهٔ سامانه در این مرورگر پاک می‌شوند. سامانه به سه پروفایل اولیه و تنظیمات پیش‌فرض برمی‌گردد.</p>
          <button className="danger" disabled={readingFile} onClick={() => { setShowReset(true); setResetConfirmation(""); setPendingBackup(null); }}>ریست سامانه</button>
          {showReset && (
            <div className="system-confirmation">
              <p className="system-management-warning">این کار قابل بازگشت نیست. پیش از ادامه پشتیبان کامل بگیرید. برای تأیید، عبارت «ریست» را وارد کنید.</p>
              <div className="profile-form-field"><label htmlFor="reset-confirmation">تأیید پاکسازی کامل</label><input id="reset-confirmation" value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} autoComplete="off" /></div>
              <div className="system-management-actions"><button className="danger" disabled={resetConfirmation.trim() !== "ریست"} onClick={() => run(() => {
                resetSystemStorage();
                window.location.reload();
              })}>تأیید ریست و پاکسازی کامل</button><button className="secondary" onClick={() => setShowReset(false)}>انصراف</button></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
