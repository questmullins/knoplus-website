type ScreenCounterProps = {
  current: number;
  total: number;
};

export function ScreenCounter({ current, total }: ScreenCounterProps) {
  return (
    <div className="counter">
      <span className="counter-value current">
        {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
