/**
 * A trend: one line per series over time, with a crosshair readout that follows the pointer or the
 * arrow keys, and opens the run under it.
 */
import { useState } from 'preact/hooks';
import { useWidth } from '../hooks/use-width.ts';
import {
  keyStop,
  type LineLayout,
  lineLayout,
  type Readout,
  readoutAt,
  slotOf,
  stopsOf,
} from '../lib/chart.ts';
import { formatDateTime, formatShortDate } from '../lib/format.ts';
import { links } from '../lib/route.ts';
import type { Series } from '../lib/series.ts';

/** The chart's height, in pixels. */
const height = 160;

/** The space around the plot. */
const margins = { top: 10, right: 12, bottom: 24, left: 48 };

/** How far apart two runs may start and still share a readout: one workflow's matrix. */
const readoutWindow = 6 * 3_600_000;

/** What the trend chart draws. */
interface TrendProps {
  /** The series. */
  readonly series: readonly Series[];
  /** Every series name the split could have, for stable colours. */
  readonly names: readonly string[];
  /** Writes a value. */
  readonly format: (value: number) => string;
  /** Writes an axis tick; the value's format when left out. */
  readonly tickFormat?: (value: number) => string;
  /** The highest value the axis may show. */
  readonly ceiling?: number;
  /** What the chart shows, read out to assistive technology. */
  readonly label: string;
}

/**
 * The trend chart.
 *
 * @param props - The series and how to show them.
 * @returns The chart.
 */
export function TrendChart(props: TrendProps) {
  const [ref, width] = useWidth<HTMLDivElement>(720);
  const { readout, plotProps } = usePlotCursor(props, width);
  const layout = lineLayout(props.series, { width, height }, margins, props.ceiling);
  if (layout === undefined) return <p class="muted small">No runs to chart.</p>;
  return (
    <div class="chart" ref={ref}>
      <div class="chart-plot" {...plotProps}>
        <svg width={width} height={height} class="chart-svg" aria-hidden="true">
          <Axes layout={layout} width={width} format={props.tickFormat ?? props.format} />
          <Lines series={props.series} names={props.names} layout={layout} />
          {readout === undefined ? null : (
            <Cursor readout={readout} layout={layout} names={props.names} series={props.series} />
          )}
        </svg>
        {readout === undefined ? null : (
          <ReadoutBox
            readout={readout}
            layout={layout}
            width={width}
            series={props.series}
            names={props.names}
            format={props.format}
          />
        )}
      </div>
      <Legend series={props.series} names={props.names} format={props.format} />
    </div>
  );
}

/**
 * The cursor of the plot: it follows the pointer, moves with the arrow keys as a slider over the
 * runs, and opens the run under it on a click or Enter.
 *
 * @param props - The chart's props.
 * @param width - The chart's width.
 * @returns The readout at the cursor, and the props of the plot's element.
 */
function usePlotCursor(props: TrendProps, width: number) {
  const [active, setActive] = useState<number | undefined>(undefined);
  const stops = stopsOf(props.series);
  const readout = active === undefined ? undefined : readoutAt(props.series, active, readoutWindow);
  const [first, last] = [stops[0] ?? 0, stops.at(-1) ?? 0];
  const timeAt = (x: number) =>
    first +
    ((x - margins.left) / Math.max(1, width - margins.left - margins.right)) * (last - first);
  const onKeyDown = (event: KeyboardEvent) => {
    const next = keyStop(event.key, stops, active);
    if (next === undefined) return;
    event.preventDefault();
    if (next === 'open') openRun(readout);
    else setActive(next === 'clear' ? undefined : next);
  };
  const plotProps = {
    ...sliderAttributes(props, stops, readout),
    onKeyDown,
    onPointerMove: (event: PointerEvent) => setActive(timeAt(event.offsetX)),
    onPointerLeave: () => setActive(undefined),
    onClick: () => openRun(readout),
  };
  return { readout, plotProps };
}

/**
 * The plot's slider semantics: it moves over the runs, one stop per start time.
 *
 * @param props - The chart's props.
 * @param stops - The start times, ascending.
 * @param readout - The readout at the cursor, if any.
 * @returns The attributes.
 */
function sliderAttributes(
  props: TrendProps,
  stops: readonly number[],
  readout: Readout | undefined,
) {
  return {
    tabIndex: 0,
    role: 'slider' as const,
    'aria-label': `${props.label}. Use the arrow keys to read each run, Enter to open it.`,
    'aria-valuemin': 0,
    'aria-valuemax': Math.max(0, stops.length - 1),
    'aria-valuenow': readout === undefined ? 0 : stops.indexOf(readout.time),
    'aria-valuetext': readoutText(readout, props.series, props.format),
  };
}

/**
 * A readout as one sentence, for assistive technology.
 *
 * @param readout - The readout, if any.
 * @param series - The series.
 * @param format - Writes a value.
 * @returns Such as `Oct 8, 2026, 10:00: flash 90%, pro 95%`.
 */
function readoutText(
  readout: Readout | undefined,
  series: readonly Series[],
  format: (value: number) => string,
): string {
  const first = readout?.entries[0]?.point.run;
  if (readout === undefined || first === undefined) return 'No run selected';
  const values = readout.entries.map(
    (entry) => `${series[entry.series]?.name ?? ''} ${format(entry.point.value)}`,
  );
  return `${formatDateTime(first.startedAt)}: ${values.join(', ')}`;
}

/**
 * Opens the run of a readout's first entry.
 *
 * @param readout - The readout, if any.
 */
function openRun(readout: Readout | undefined): void {
  const entry = readout?.entries[0];
  if (entry !== undefined) location.hash = links.run(entry.point.run.id);
}

/**
 * The grid and the axes' labels.
 *
 * @param props - The layout, the chart's width and how to write values.
 * @returns The axes.
 */
function Axes(props: {
  readonly layout: LineLayout;
  readonly width: number;
  readonly format: (value: number) => string;
}) {
  const { layout } = props;
  const right = props.width - margins.right;
  const bottom = height - margins.bottom;
  return (
    <g class="axes">
      {layout.yTicks.map((tick) => (
        <g key={`y${tick}`}>
          <line
            class={tick === 0 ? 'baseline' : 'gridline'}
            x1={margins.left}
            x2={right}
            y1={layout.y(tick)}
            y2={layout.y(tick)}
          />
          <text class="tick" x={margins.left - 8} y={layout.y(tick)} dy="0.32em" text-anchor="end">
            {props.format(tick)}
          </text>
        </g>
      ))}
      {layout.xTicks.map((tick) => (
        <text key={`x${tick}`} class="tick" x={layout.x(tick)} y={bottom + 18} text-anchor="middle">
          {formatShortDate(tick)}
        </text>
      ))}
    </g>
  );
}

/**
 * The series' lines, each with its own dash, and a dot on each run.
 *
 * @param props - The series, their names and the layout.
 * @returns The lines.
 */
function Lines(props: {
  readonly series: readonly Series[];
  readonly names: readonly string[];
  readonly layout: LineLayout;
}) {
  return (
    <g>
      {props.series.map((line, index) => {
        const slot = slotOf(line.name, props.names);
        return (
          <g key={line.name}>
            <path class={`line stroke-${slot} dash-${slot}`} d={props.layout.paths[index]} />
            {line.points.map((point) => (
              <circle
                key={point.run.id}
                class={`point fill-series-${slot}`}
                cx={props.layout.x(point.time)}
                cy={props.layout.y(point.value)}
                r={2.5}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/**
 * The crosshair and the highlighted points.
 *
 * @param props - The readout, the layout and the series.
 * @returns The cursor.
 */
function Cursor(props: {
  readonly readout: Readout;
  readonly layout: LineLayout;
  readonly series: readonly Series[];
  readonly names: readonly string[];
}) {
  const x = props.layout.x(props.readout.time);
  return (
    <g>
      <line class="crosshair" x1={x} x2={x} y1={margins.top} y2={height - margins.bottom} />
      {props.readout.entries.map((entry) => (
        <circle
          key={entry.point.run.id}
          class={`dot-active fill-series-${slotOf(props.series[entry.series]?.name ?? '', props.names)}`}
          cx={props.layout.x(entry.point.time)}
          cy={props.layout.y(entry.point.value)}
          r={4}
        />
      ))}
    </g>
  );
}

/**
 * The readout's box: the date and each series' value.
 *
 * @param props - The readout, the layout, the chart's width and the series.
 * @returns The box.
 */
function ReadoutBox(props: {
  readonly readout: Readout;
  readonly layout: LineLayout;
  readonly width: number;
  readonly series: readonly Series[];
  readonly names: readonly string[];
  readonly format: (value: number) => string;
}) {
  const x = props.layout.x(props.readout.time);
  const flip = x > props.width / 2;
  const first = props.readout.entries[0]?.point.run;
  return (
    <div class={`readout ${flip ? 'readout-left' : ''}`} style={{ left: `${x}px` }}>
      <div class="readout-title">{first === undefined ? '' : formatDateTime(first.startedAt)}</div>
      {first?.source.branch === undefined ? null : (
        <div class="readout-sub mono">
          {first.source.branch} {first.source.commit?.slice(0, 7)}
        </div>
      )}
      {props.readout.entries.map((entry) => {
        const name = props.series[entry.series]?.name ?? '';
        return (
          <div key={entry.point.run.id} class="readout-row">
            <span class={`swatch fill-series-${slotOf(name, props.names)}`} />
            <span class="readout-name">{name === 'all' ? 'Runs' : name}</span>
            <span class="readout-value">{props.format(entry.point.value)}</span>
          </div>
        );
      })}
      <div class="readout-hint">Click to open the run</div>
    </div>
  );
}

/**
 * A series' line as the legend draws it: its colour and its dash.
 *
 * @param props - The series' slot.
 * @returns The sample.
 */
export function LineSample(props: { readonly slot: number }) {
  return (
    <svg class="legend-line" viewBox="0 0 22 6" aria-hidden="true">
      <line class={`stroke-${props.slot} dash-${props.slot}`} x1={0} y1={3} x2={22} y2={3} />
    </svg>
  );
}

/**
 * The legend: each series with its line and its newest value.
 *
 * @param props - The series and how to write values.
 * @returns The legend, or nothing for a single unsplit series.
 */
function Legend(props: {
  readonly series: readonly Series[];
  readonly names: readonly string[];
  readonly format: (value: number) => string;
}) {
  if (props.series.length === 1 && props.series[0]?.name === 'all') return null;
  return (
    <ul class="legend">
      {props.series.map((line) => {
        const latest = line.points.at(-1);
        return (
          <li key={line.name} class="legend-item">
            <LineSample slot={slotOf(line.name, props.names)} />
            <span>{line.name}</span>
            {latest === undefined ? null : (
              <strong class="legend-value">{props.format(latest.value)}</strong>
            )}
          </li>
        );
      })}
    </ul>
  );
}
