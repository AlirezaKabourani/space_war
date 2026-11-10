import { useEffect, useRef, useState, type FormEvent } from "react";

interface AdminLoginFormProps {
  onLogin: (password: string) => Promise<boolean>;
  onCancel: () => void;
}

export const AdminLoginForm = ({ onLogin, onCancel }: AdminLoginFormProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (await onLogin(password)) return;
      setPassword("");
      setError("رمز ورود ادمین نادرست است.");
      inputRef.current?.focus();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "بررسی رمز انجام نشد؛ دوباره تلاش کنید.");
    } finally { setBusy(false); }
  };

  return (
    <form
      className="admin-login-form"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) {
          event.preventDefault();
          onCancel();
        }
      }}
      aria-label="ورود به پروفایل ادمین"
    >
      <div className="profile-form-field">
        <label htmlFor="admin-password">رمز ورود ادمین</label>
        <input
          ref={inputRef}
          id="admin-password"
          name="admin-password"
          type="password"
          readOnly={busy}
          dir="ltr"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          required
          aria-invalid={!!error}
          aria-describedby={error ? "admin-password-error" : undefined}
        />
        {error && <span id="admin-password-error" className="profile-field-error" role="alert">{error}</span>}
      </div>
      <div className="profile-form-actions">
        <button type="submit" className="primary" disabled={busy}>{busy ? "در حال بررسی…" : "ورود به ادمین"}</button>
        <button type="button" className="secondary" disabled={busy} onClick={onCancel}>انصراف</button>
      </div>
    </form>
  );
};
