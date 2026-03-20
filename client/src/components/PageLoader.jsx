import Spinner from './Spinner';

/**
 * Full-page loading state with spinner and optional message.
 */
export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 animate-fade-in">
      <Spinner size="lg" />
      <p className="text-slate-500 dark:text-slate-400 font-medium">{message}</p>
    </div>
  );
}
