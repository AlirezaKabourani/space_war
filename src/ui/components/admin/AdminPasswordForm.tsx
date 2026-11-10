import { useState, type FormEvent } from "react";
import type { Profile } from "../../../core/types/profile";
import type { CognitiveAdminReadAccess } from "../../../services/storage/cognitiveAdminReadAccess";
import { changeAdminPassword } from "../../../services/storage/adminPasswordStorage";
import { systemLogger } from "../../../services/analytics/systemLogger";

interface AdminPasswordFormProps {
  activeProfile: Profile;
  adminAccess: CognitiveAdminReadAccess | null;
}

export function AdminPasswordForm({ activeProfile, adminAccess }: AdminPasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      await changeAdminPassword(adminAccess, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
      systemLogger.log("admin_password_changed", activeProfile);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تغییر رمز انجام نشد؛ دوباره تلاش کنید.");
    } finally { setBusy(false); }
  };
  const edited = () => { setError(null); setSuccess(false); };

  return (
    <section className="system-management-section" aria-labelledby="admin-password-title">
      <h3 id="admin-password-title">تغییر رمز ادمین</h3>
      <form className="admin-password-form" onSubmit={submit} aria-labelledby="admin-password-title" aria-busy={busy}>
        <div className="profile-form-grid">
          <div className="profile-form-field">
            <label htmlFor="admin-current-password">رمز فعلی</label>
            <input id="admin-current-password" name="current-password" type="password" dir="ltr" autoComplete="current-password"
              required maxLength={256} readOnly={busy} value={currentPassword}
              onChange={(event) => { setCurrentPassword(event.target.value); edited(); }} />
          </div>
          <div className="profile-form-field">
            <label htmlFor="admin-new-password">رمز جدید</label>
            <input id="admin-new-password" name="new-password" type="password" dir="ltr" autoComplete="new-password"
              required maxLength={256} readOnly={busy} value={newPassword}
              onChange={(event) => { setNewPassword(event.target.value); edited(); }} />
          </div>
        </div>
        {error && <p className="system-management-error" role="alert">{error}</p>}
        {success && <p className="system-management-success" role="status">رمز ادمین با موفقیت تغییر کرد. از این پس با رمز جدید وارد شوید.</p>}
        <div className="profile-form-actions">
          <button type="submit" className="primary" disabled={busy || !currentPassword || !newPassword.trim()}>{busy ? "در حال ذخیره رمز…" : "ذخیره رمز جدید"}</button>
        </div>
      </form>
    </section>
  );
}
