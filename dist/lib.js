//#region src/format/result-types.ts
/**
* The result format's types, declared without the schema library: the package's public types for
* a TypeScript harness. `result.ts` validates against a zod schema of the same shape, and a test
* fails when the two differ.
*/
/** The version of the result format this code reads. */
const resultVersion = 1;
//#endregion
export { resultVersion };
