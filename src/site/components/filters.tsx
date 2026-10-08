/**
 * Filter controls. Each one changes the route's query, so a filtered view is a permanent link.
 */
import { replaceRoute } from '../hooks/use-route.ts';
import { withQuery } from '../lib/route.ts';

/** One option of a filter. */
export interface Option {
  /** Its value in the query; empty for "any". */
  readonly value: string;
  /** What it says. */
  readonly text: string;
}

/**
 * A drop-down filter bound to one query value.
 *
 * @param props - Its label, the query name, the current value, the options and the current hash.
 * @returns The control.
 */
export function SelectFilter(props: {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly options: readonly Option[];
  readonly hash: string;
}) {
  return (
    <label class="field">
      <span class="field-label">{props.label}</span>
      <select
        class="select"
        value={props.value}
        onChange={(event) =>
          replaceRoute(withQuery(props.hash, { [props.name]: event.currentTarget.value }))
        }
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * A date filter bound to one query value.
 *
 * @param props - Its label, the query name, the current value and the current hash.
 * @returns The control.
 */
export function DateFilter(props: {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly hash: string;
}) {
  return (
    <label class="field">
      <span class="field-label">{props.label}</span>
      <input
        class="input"
        type="date"
        value={props.value}
        onChange={(event) =>
          replaceRoute(withQuery(props.hash, { [props.name]: event.currentTarget.value }))
        }
      />
    </label>
  );
}

/**
 * A text search bound to one query value, updated as the reader types.
 *
 * @param props - Its label, the query name, the current value, the current hash and a hint.
 * @returns The control.
 */
export function SearchFilter(props: {
  readonly label: string;
  readonly placeholder: string;
  readonly name: string;
  readonly value: string;
  readonly hash: string;
}) {
  return (
    <label class="field field-grow">
      <span class="field-label">{props.label}</span>
      <input
        class="input"
        type="search"
        value={props.value}
        placeholder={props.placeholder}
        onInput={(event) =>
          replaceRoute(withQuery(props.hash, { [props.name]: event.currentTarget.value }))
        }
      />
    </label>
  );
}

/**
 * A row of links that switch one query value, the current one marked: tabs.
 *
 * @param props - Its label, the query name, the current value, the options and the current hash.
 * @returns The control.
 */
export function Segmented(props: {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly options: readonly Option[];
  readonly hash: string;
}) {
  return (
    <nav class="tabs" aria-label={props.label}>
      {props.options.map((option) => (
        <a
          key={option.value}
          class="tab"
          href={withQuery(props.hash, { [props.name]: option.value })}
          aria-current={option.value === props.value ? 'true' : undefined}
        >
          {option.text}
        </a>
      ))}
    </nav>
  );
}

/**
 * The options of a filter: "any" first, then each value.
 *
 * @param values - The values.
 * @param anyText - What "any" says.
 * @param anyValue - The query value for "any".
 * @returns The options.
 */
export function optionsOf(values: readonly string[], anyText: string, anyValue = ''): Option[] {
  return [{ value: anyValue, text: anyText }, ...values.map((value) => ({ value, text: value }))];
}

/**
 * A checkbox bound to one query value: `1` when ticked, left out when not.
 *
 * @param props - Its label, the query name, whether it is ticked, and the current hash.
 * @returns The control.
 */
export function ToggleFilter(props: {
  readonly label: string;
  readonly name: string;
  readonly checked: boolean;
  readonly hash: string;
}) {
  return (
    <label class="toggle">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) =>
          replaceRoute(
            withQuery(props.hash, { [props.name]: event.currentTarget.checked ? '1' : undefined }),
          )
        }
      />
      {props.label}
    </label>
  );
}
