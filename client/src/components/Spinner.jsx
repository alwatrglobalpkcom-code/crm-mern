/**
 * Reusable loading spinner using Tailwind CSS.
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - Additional Tailwind classes
 */
export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div
      className={`rounded-full border-slate-200 dark:border-slate-600 border-t-primary-500 animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
