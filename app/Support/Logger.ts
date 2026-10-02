type LogLevel = 'INFO' | 'WARN';

/**
 * Console logger adding a fixed prefix and an [HH:mm:ss] timestamp.
 */
export class Logger {
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  info(message: string, ...context: unknown[]): void {
    console.info(this.format('INFO', message), ...context);
  }

  warn(message: string, ...context: unknown[]): void {
    console.warn(this.format('WARN', message), ...context);
  }

  private format(level: LogLevel, message: string): string {
    const time = new Date().toTimeString().slice(0, 8);
    return `${this.prefix}[${time}] ${level}: ${message}`;
  }
}
