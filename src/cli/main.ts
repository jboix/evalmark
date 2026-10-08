/**
 * The `evalmark` command: `record` a result into a local folder, `import` another tool's output,
 * `preview` a branch's dashboard, `demo` a synthetic history.
 */
import { readInputs } from '../action/inputs.ts';
import { sizeReportOf } from '../action/record.ts';
import { sizeLine, sizeWarning } from '../action/size.ts';
import { demoCommand, demoUsage } from './demo.ts';
import { importCommand, importUsage } from './import.ts';
import { previewCommand, previewUsage } from './preview.ts';
import { recordCommand, recordUsage } from './record.ts';

/** The commands, by name. */
const commands: Readonly<Record<string, (args: string[]) => Promise<void>>> = {
  record: async (args) => {
    const outcome = await recordCommand(args);
    const size = sizeReportOf(outcome, outcome.dir, readInputs({}).warnSizeMb);
    process.stdout.write(`Recorded run ${outcome.run.id}. ${sizeLine(size)}\n`);
    const warning = sizeWarning(size);
    if (warning !== undefined) process.stderr.write(`${warning}\n`);
  },
  import: async (args) => {
    const paths = await importCommand(args);
    process.stdout.write(`Wrote ${paths.length} result${paths.length === 1 ? '' : 's'}:\n`);
    for (const path of paths) process.stdout.write(`  ${path}\n`);
  },
  demo: demoCommand,
  preview: async (args) => {
    await previewCommand(args);
  },
};

/** The usage text. */
const usage = [
  'Usage:',
  `  ${recordUsage}`,
  `  ${importUsage}`,
  `  ${previewUsage}`,
  `  ${demoUsage}`,
  '',
].join('\n');

/**
 * Runs the command the arguments name.
 *
 * @param argv - The arguments after the program's name.
 * @returns The exit code.
 */
async function main(argv: string[]): Promise<number> {
  const [name = '', ...args] = argv;
  const command = commands[name];
  if (command === undefined) {
    process.stderr.write(usage);
    return name === '' || name === 'help' || name === '--help' ? 0 : 1;
  }
  try {
    await command(args);
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

process.exitCode = await main(process.argv.slice(2));
