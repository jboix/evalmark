/**
 * The action's log, written as GitHub workflow commands: plain lines, warnings, errors, groups and
 * masks. It writes through a function, so tests read what a run printed.
 */

/** Writes text to the log. */
export type Write = (text: string) => void;

/** What the action logs through. */
export interface Logger {
  /** Writes a plain line. */
  readonly info: (line: string) => void;
  /** Writes a warning, shown on the workflow run. */
  readonly warning: (message: string) => void;
  /** Writes an error, shown on the workflow run. */
  readonly error: (message: string) => void;
  /** Opens a collapsed group of lines. */
  readonly group: (title: string) => void;
  /** Closes the open group. */
  readonly endGroup: () => void;
  /** Hides a secret everywhere in the rest of the log. */
  readonly mask: (secret: string) => void;
}

/**
 * Escapes a workflow command's data, so a message on several lines stays one command.
 *
 * @param data - The message.
 * @returns The escaped message.
 */
export function escapeData(data: string): string {
  return data.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

/**
 * Writes to the process's standard output.
 *
 * @param text - The text.
 */
export function writeToStdout(text: string): void {
  process.stdout.write(text);
}

/**
 * A logger writing workflow commands.
 *
 * @param write - Where the lines go.
 * @returns The logger.
 */
export function createLogger(write: Write): Logger {
  const command = (name: string, data: string) => write(`::${name}::${escapeData(data)}\n`);
  return {
    info: (line) => write(`${line}\n`),
    warning: (message) => command('warning', message),
    error: (message) => command('error', message),
    group: (title) => command('group', title),
    endGroup: () => write('::endgroup::\n'),
    mask: (secret) => {
      if (secret.length > 0) command('add-mask', secret);
    },
  };
}
