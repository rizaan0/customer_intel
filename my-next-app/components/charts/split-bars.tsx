export function SplitBars({
  title,
  rows,
  keys,
  colors,
}: {
  title: string;
  rows: { issue: string; [key: string]: string | number }[];
  keys: string[];
  colors: Record<string, string>;
}) {
  const max = Math.max(...rows.map((row) => keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0)), 1);
  return (
    <div>
      <h3 className="text-sm font-medium text-stone-700">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.map((row) => {
          const total = keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0);
          return (
            <div key={row.issue} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-xs">
              <span className="capitalize text-stone-600">{row.issue}</span>
              <span className="flex h-3 overflow-hidden rounded-full bg-stone-100">
                {keys.map((key) => (
                  <span
                    key={key}
                    title={`${key}: ${row[key]}`}
                    style={{ width: `${(Number(row[key] ?? 0) / max) * 100}%`, background: colors[key] }}
                  />
                ))}
              </span>
              <span className="text-right text-stone-400">{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
