/**
 * Skeleton loader for cards, tables, and list items.
 * Uses Tailwind animate-pulse for shimmer effect.
 */
export default function SkeletonLoader({ variant = 'card', count = 1 }) {
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mb-4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3 mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
    </div>
  );

  const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-24 shrink-0" />
      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded flex-1" />
      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-20 shrink-0" />
    </div>
  );

  const SkeletonTable = () => (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-slate-200 dark:bg-slate-600 rounded flex-1" />
          ))}
        </div>
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 border-b border-slate-200 dark:border-slate-700 last:border-0 flex gap-4">
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="h-3 bg-slate-200 dark:bg-slate-600 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );

  const SkeletonStatCard = () => (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 animate-pulse">
      <div className="h-10 w-10 bg-slate-200 dark:bg-slate-600 rounded-xl mb-4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-20 mb-2" />
      <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-16" />
    </div>
  );

  const Component = variant === 'table' ? SkeletonTable : variant === 'row' ? SkeletonRow : variant === 'stat' ? SkeletonStatCard : SkeletonCard;

  const gridClass = variant === 'card'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
    : variant === 'stat'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'
      : variant === 'row'
        ? 'space-y-2'
        : 'grid gap-4';

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
