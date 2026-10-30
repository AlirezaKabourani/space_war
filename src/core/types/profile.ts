export interface Profile {
  id: string;
  name: string;
  role: "admin" | "player";
  scenarioCatalog: "released" | "full";
  progress: number;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  phoneNumber?: string;
}

export interface ProfileInput {
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
}

export const canDeleteProfile = (actor: Profile, target: Profile): boolean =>
  actor.role === "admin" && target.id !== "admin" && target.id !== "scenario-tester";

export type ProfileFormErrors = Partial<Record<keyof ProfileInput | "form", string>>;

export const normalizeDigits = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit <= "٩" ? 0x0660 : 0x06f0))
  );

export const normalizeProfileInput = (input: ProfileInput): ProfileInput => ({
  firstName: input.firstName.trim().replace(/\s+/g, " "),
  lastName: input.lastName.trim().replace(/\s+/g, " "),
  nationalId: normalizeDigits(input.nationalId).trim(),
  phoneNumber: normalizeDigits(input.phoneNumber)
    .replace(/[\s()-]/g, "")
    .replace(/^(?:\+98|0098)/, "0"),
});

export const validateProfileInput = (
  input: ProfileInput,
  profiles: readonly Profile[] = []
): ProfileFormErrors => {
  const values = normalizeProfileInput(input);
  const errors: ProfileFormErrors = {};
  if (!values.firstName) errors.firstName = "نام را وارد کنید.";
  else if (values.firstName.length > 100) errors.firstName = "نام باید حداکثر ۱۰۰ نویسه باشد.";
  if (!values.lastName) errors.lastName = "نام خانوادگی را وارد کنید.";
  else if (values.lastName.length > 100) errors.lastName = "نام خانوادگی باید حداکثر ۱۰۰ نویسه باشد.";
  if (!/^\d{10}$/.test(values.nationalId)) {
    errors.nationalId = "شماره ملی باید دقیقاً ۱۰ رقم باشد.";
  } else if (profiles.some((profile) => profile.nationalId === values.nationalId)) {
    errors.nationalId = "با این شماره ملی قبلاً پروفایل ساخته شده است؛ آن را از فهرست انتخاب کنید.";
  }
  if (!/^0\d{10}$/.test(values.phoneNumber)) {
    errors.phoneNumber = "شماره تماس را با صفر و به‌صورت ۱۱ رقمی وارد کنید.";
  }
  return errors;
};

export const createPlayerProfile = (input: ProfileInput): Profile => {
  const values = normalizeProfileInput(input);
  return {
    ...values,
    id: `player-${crypto.randomUUID()}`,
    name: `${values.firstName} ${values.lastName}`,
    role: "player",
    scenarioCatalog: "released",
    progress: 0,
  };
};
