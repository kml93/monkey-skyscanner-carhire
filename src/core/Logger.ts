/**
 * Centralized Logger Service.
 *
 * Adds consistent prefixing and timestamps to all log messages.
 * Automatically handles English messaging as requested.
 */
export class Logger {
  private static prefix = '[SkyScannerDashboard]';

  /** Returns formatted timestamp: [HH:mm:ss] */
  private static getTime(): string {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return `[${h}:${m}:${s}]`;
  }

  static info(message: string, ...args: any[]): void {
    console.info(`${this.prefix}${this.getTime()} INFO: ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix}${this.getTime()} WARN: ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`${this.prefix}${this.getTime()} ERROR: ${message}`, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    if (import.meta.env.DEV) {
      console.debug(`${this.prefix}${this.getTime()} DEBUG: ${message}`, ...args);
    }
  }
}
