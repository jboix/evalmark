/**
 * Module boundaries. `format/` is the shared contract and imports no other module. The action runs
 * on Node and never imports the dashboard; the dashboard runs in the browser and never imports the
 * action or the CLI. The CLI may use the action's store to record runs locally. The importers read
 * other tools' output into the result format, for the action and the CLI. `src/index.ts` is the
 * npm package's library entry: the result format's types, nothing else.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'format-is-the-contract',
      comment:
        'src/format/ holds the data format and pure functions over it: it imports no module.',
      severity: 'error',
      from: { path: '^src/format/' },
      to: { path: '^src/(action|site|cli|import)/' },
    },
    {
      name: 'import-reads-into-the-format',
      comment:
        'src/import/ converts the output of other tools to the result format: it imports src/format/ only.',
      severity: 'error',
      from: { path: '^src/import/' },
      to: { path: '^src/(action|site|cli)/' },
    },
    {
      name: 'library-exports-the-format',
      comment: "src/index.ts is the package's public API: it exports from src/format/ only.",
      severity: 'error',
      from: { path: '^src/index\\.ts$' },
      to: { path: '^src/', pathNot: '^src/format/' },
    },
    {
      name: 'action-stays-on-node',
      comment: 'The action never imports the dashboard or the CLI.',
      severity: 'error',
      from: { path: '^src/action/' },
      to: { path: '^src/(site|cli)/' },
    },
    {
      name: 'site-stays-in-the-browser',
      comment: 'The dashboard never imports the action, the importers or the CLI.',
      severity: 'error',
      from: { path: '^src/site/' },
      to: { path: '^src/(action|cli|import)/' },
    },
    {
      name: 'site-imports-no-zod',
      comment: 'The dashboard ships without a schema library: it imports types from src/format/.',
      severity: 'error',
      from: { path: '^src/site/' },
      to: { path: 'node_modules/zod/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '^scripts/',
          '^src/(action|cli)/main\\.ts$',
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.test\\.tsx?$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
