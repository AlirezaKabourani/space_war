import { useState, type FormEvent } from "react";
import type { ProfileFormErrors, ProfileInput } from "../../../core/types/profile";

interface ProfileCreateFormProps {
  onCreate: (input: ProfileInput) => ProfileFormErrors;
}

const fields = [
  { name: "firstName", label: "نام", autoComplete: "given-name", type: "text", maxLength: 100 },
  { name: "lastName", label: "نام خانوادگی", autoComplete: "family-name", type: "text", maxLength: 100 },
  { name: "nationalId", label: "شماره ملی", autoComplete: "off", type: "text", maxLength: 10, hint: "۱۰ رقم؛ صفر ابتدای شماره را هم وارد کنید." },
  { name: "phoneNumber", label: "شماره تماس", autoComplete: "tel", type: "tel", maxLength: 24, hint: "شماره همراه؛ مانند ۰۹۱۲۱۲۳۴۵۶۷" },
] as const;

export const ProfileCreateForm = ({ onCreate }: ProfileCreateFormProps) => {
  const [values, setValues] = useState<ProfileInput>({ firstName: "", lastName: "", nationalId: "", phoneNumber: "" });
  const [errors, setErrors] = useState<ProfileFormErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = onCreate(values);
    setErrors(nextErrors);
    const firstInvalidField = fields.find((field) => nextErrors[field.name]);
    if (firstInvalidField) {
      const input = event.currentTarget.elements.namedItem(firstInvalidField.name);
      if (input instanceof HTMLInputElement) input.focus();
    }
  };

  return (
    <section className="profile-create-section" aria-labelledby="profile-create-title">
      <h3 id="profile-create-title">ساخت پروفایل جدید</h3>
      <p className="hint" id="profile-create-description">
        همه فیلدها الزامی‌اند. پس از ساخت، پروفایل شما فعال می‌شود و سناریوها را به‌ترتیب بازی می‌کنید.
      </p>
      <form onSubmit={handleSubmit} noValidate aria-describedby="profile-create-description">
        <div className="profile-form-grid">
          {fields.map((field) => {
            const isNumeric = field.name === "nationalId" || field.name === "phoneNumber";
            const hint = "hint" in field ? field.hint : undefined;
            const error = errors[field.name];
            const inputId = `profile-${field.name}`;
            return (
              <div className="profile-form-field" key={field.name}>
                <label htmlFor={inputId}>{field.label}</label>
                <input
                  id={inputId}
                  name={field.name}
                  type={field.type}
                  value={values[field.name]}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, [field.name]: event.target.value }));
                    setErrors((current) => ({ ...current, [field.name]: undefined, form: undefined }));
                  }}
                  autoComplete={field.autoComplete}
                  maxLength={field.maxLength}
                  inputMode={field.name === "nationalId" ? "numeric" : field.name === "phoneNumber" ? "tel" : "text"}
                  dir={isNumeric ? "ltr" : "rtl"}
                  required
                  aria-invalid={!!error}
                  aria-describedby={[hint ? `${inputId}-hint` : "", error ? `${inputId}-error` : ""].filter(Boolean).join(" ") || undefined}
                />
                {hint && <span className="profile-field-hint" id={`${inputId}-hint`}>{hint}</span>}
                {error && <span className="profile-field-error" id={`${inputId}-error`} role="alert">{error}</span>}
              </div>
            );
          })}
        </div>
        {errors.form && <p className="profile-field-error" role="alert">{errors.form}</p>}
        <div className="profile-form-actions">
          <button className="primary" type="submit">ساخت و ورود با این پروفایل</button>
          <p className="hint">اطلاعات و پیشرفت شما در همین سیستم ذخیره می‌شود.</p>
        </div>
      </form>
    </section>
  );
};
