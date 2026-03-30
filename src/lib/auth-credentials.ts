const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const INTERNAL_USERNAME_DOMAIN = "users.centreplus.local";

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

export function getUsernameValidationMessage(value: string) {
  const username = normalizeUsername(value);

  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }

  if (username.length > 30) {
    return "Username must be 30 characters or fewer";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Use only lowercase letters, numbers, and underscores";
  }

  return null;
}

export function usernameToInternalEmail(username: string) {
  return `${normalizeUsername(username)}@${INTERNAL_USERNAME_DOMAIN}`;
}

export function normalizeLoginIdentifier(value: string) {
  const trimmed = value.trim();

  if (trimmed.includes("@")) {
    return {
      loginValue: trimmed.toLowerCase(),
      type: "email" as const,
    };
  }

  return {
    loginValue: usernameToInternalEmail(trimmed),
    type: "username" as const,
  };
}
