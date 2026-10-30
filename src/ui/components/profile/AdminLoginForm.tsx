import { useEffect, useRef, useState, type FormEvent } from "react";

interface AdminLoginFormProps {
  onLogin: (password: string) => boolean;
  onCancel: () => void;
}

export const AdminLoginForm = ({ onLogin, onCancel }: AdminLoginFormProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onLogin(password)) return;
    setPassword("");
    setError("رمز ورود ادمین نادرست است.");
    inputRef.current?.focus();
  };

  return (
    <form
      className="admin-login-form"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
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
        <button type="submit" className="primary">ورود به ادمین</button>
        <button type="button" className="secondary" onClick={onCancel}>انصراف</button>
      </div>
    </form>
  );
};
