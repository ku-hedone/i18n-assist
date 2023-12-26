import type { WriteStream } from 'tty';

class Logger {
  private inGroup: boolean = false;

  constructor(
    private stdout: WriteStream,
    private stderr: WriteStream,
  ) {}

  log(message: string) {
    if (this.inGroup) {
      this.stdout.write(`  ${message}\n`);
    } else {
      this.stdout.write(`${message}\n`);
    }
  }

  warn(message: string) {
    if (this.inGroup) {
      this.stderr.write(`  [WARN] ${message}\n`);
    } else {
      this.stderr.write(`[WARN] ${message}\n`);
    }
  }

  error(message: string) {
    if (this.inGroup) {
      this.stderr.write(`  [ERROR] ${message}\n`);
    } else {
      this.stderr.write(`[ERROR] ${message}\n`);
    }
  }

  group(title: string) {
    if (this.inGroup) {
      this.groupEnd();
    }
    this.stdout.write(`\n${title}\n`);
    this.inGroup = true;
  }

  groupEnd() {
    this.inGroup = false;
  }
}

const logger = new Logger(process.stdout, process.stderr);

export default logger;
