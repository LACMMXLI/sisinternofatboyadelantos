import { PieChart } from 'lucide-react';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatCentsToMXN } from '@/lib/utils/money';

interface WeeklySummaryCardProps {
  totalCents: number;
  breakdown: { label: string; amountCents: number; colorVar: string; percent: number }[];
}

export function WeeklySummaryCard({ totalCents, breakdown }: WeeklySummaryCardProps) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-control">
      <div className="mb-2 flex items-center gap-2">
        <PieChart size={16} className="text-brand-600" />
        <h3 className="text-sm font-bold text-ink">Resumen de la Semana</h3>
      </div>
      <div className="flex items-center gap-4">
        <DonutChart
          segments={breakdown.map((b) => ({ label: b.label, value: b.amountCents, colorVar: b.colorVar }))}
          centerLabel={`-${formatCentsToMXN(Math.abs(totalCents))}`}
          centerSubLabel="Total"
          size={100}
        />
        <ul className="flex-1 space-y-2 text-sm">
          {breakdown.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.colorVar }} />
                {item.label}
              </span>
              <span className="text-xs text-muted">{item.percent}%</span>
              <span className="font-semibold text-danger tabular-nums">
                {formatCentsToMXN(item.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
