export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateId(id: unknown): number {
  if (!isPositiveInteger(id)) {
    throw new ValidationError("ID must be a positive integer");
  }
  return id;
}

export function validateName(name: unknown, fieldName: string = "name"): string {
  if (!isNonEmptyString(name)) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return name.trim();
}

export function validateType<T extends string>(value: unknown, allowed: T[], fieldName: string = "type"): T {
  if (!allowed.includes(value as T)) {
    throw new ValidationError(`Valid ${fieldName} is required: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function validatePrice(value: unknown, fieldName: string = "price"): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (!isPositiveNumber(num)) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
  return num;
}

export function validateEmail(value: unknown): string | null {
  if (!value || !isNonEmptyString(value)) {
    return null;
  }
  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Invalid email format");
  }
  return email;
}

export function validatePhone(value: unknown): string | null {
  if (!value || !isNonEmptyString(value)) {
    return null;
  }
  return value.trim();
}
