type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, fields?: LogFields) => emit("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => emit("warn", msg, fields),
  error: (msg: string, error?: unknown, fields?: LogFields) =>
    emit("error", msg, {
      ...fields,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    }),
};

export async function withErrorLog<T>(name: string, fn: () => Promise<T>, fields?: LogFields): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    log.error(`${name} failed`, e, fields);
    throw e;
  }
}
