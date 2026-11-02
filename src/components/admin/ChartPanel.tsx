import { Bar, BarChart, Legend, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui";

export interface ChartPoint {
  key: string;
  label: string;
  value: number;
}

const COLOURS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface Props {
  id: string;
  title: string;
  kind: "pie" | "bar";
  data: ChartPoint[];
  start: string;
  end: string;
  disabled: boolean;
  /** The larger Sales-view size. */
  large?: boolean;
  onChange: (range: { start: string; end: string }) => void;
  onSubmit: () => void;
}

const input =
  "bg-background focus-visible:outline-ring h-9 w-32 rounded-md border px-3 text-sm outline-none focus-visible:outline-2";

/** A sales chart with its Start/End date fields (MM/DD/YYYY) and Submit. */
export function ChartPanel({
  id,
  title,
  kind,
  data,
  start,
  end,
  disabled,
  large = false,
  onChange,
  onSubmit,
}: Props) {
  const width = large ? 640 : 360;
  const height = large ? 340 : 260;
  const points = data.map((d, i) => ({ ...d, fill: COLOURS[i % COLOURS.length] }));
  return (
    <section aria-labelledby={`${id}-title`} className="bg-background rounded-lg border p-4">
      <h3 id={`${id}-title`} className="mb-3 text-sm font-semibold">
        {title}
      </h3>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`${id}-start`} className="block text-xs font-medium">
            Start date
          </label>
          <input
            id={`${id}-start`}
            value={start}
            placeholder="MM/DD/YYYY"
            onChange={(e) => onChange({ start: e.target.value, end })}
            className={input}
          />
        </div>
        <div>
          <label htmlFor={`${id}-end`} className="block text-xs font-medium">
            End date
          </label>
          <input
            id={`${id}-end`}
            value={end}
            placeholder="MM/DD/YYYY"
            onChange={(e) => onChange({ start, end: e.target.value })}
            className={input}
          />
        </div>
        <Button type="button" variant="outline" disabled={disabled} onClick={onSubmit}>
          Submit
        </Button>
      </div>
      {kind === "pie" ? (
        <PieChart width={width} height={height}>
          <Pie
            data={points}
            dataKey="value"
            nameKey="label"
            outerRadius={large ? 120 : 90}
            isAnimationActive={false}
          />
          <Legend />
          <Tooltip />
        </PieChart>
      ) : (
        <BarChart width={width} height={height} data={points}>
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" isAnimationActive={false} />
        </BarChart>
      )}
    </section>
  );
}
