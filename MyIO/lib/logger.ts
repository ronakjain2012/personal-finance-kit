// lib/logger.ts — Single logger for init and auth; no PII or sensitive data.

const prefix = '[MyIO]';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(prefix, message, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug(prefix, message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(prefix, message, ...args);
  },
};
