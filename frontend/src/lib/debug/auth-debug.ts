type AuthDebugDetail = Record<string, unknown>;

type AuthDebugLevel = "info" | "warn" | "error";

type AuthDebugEntry = {
  timestamp: string;
  level: AuthDebugLevel;
  event: string;
  pathname: string | null;
  detail: AuthDebugDetail | null;
};

const STORAGE_KEY = "auth-debug-logs";
const MAX_ENTRIES = 200;

const getConsoleMethod = (level: AuthDebugLevel) => {
  if (level === "warn") {
    return console.warn;
  }

  if (level === "error") {
    return console.error;
  }

  return console.info;
};

const readEntries = (): AuthDebugEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuthDebugEntry[]) : [];
  } catch {
    return [];
  }
};

const writeEntries = (entries: AuthDebugEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage failures during temporary debugging.
  }
};

export const clearAuthDebugLogs = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures during temporary debugging.
  }
};

export const logAuthDebug = (
  event: string,
  detail?: AuthDebugDetail,
  level: AuthDebugLevel = "info"
) => {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : null;
  const entry: AuthDebugEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    pathname,
    detail: detail ?? null,
  };

  const consoleMethod = getConsoleMethod(level);
  if (detail) {
    consoleMethod("[auth-debug]", event, detail);
  } else {
    consoleMethod("[auth-debug]", event);
  }

  const entries = readEntries();
  entries.push(entry);
  writeEntries(entries.slice(-MAX_ENTRIES));
};
