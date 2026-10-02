import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  status?: number;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({
  title = 'Unable to Load Data',
  message,
  details,
  status,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  const getStatusLabel = (code?: number) => {
    switch (code) {
      case 401:
        return '401 Unauthorized';
      case 403:
        return '403 Forbidden';
      case 404:
        return '404 Not Found';
      case 500:
        return '500 Server Error';
      case 0:
        return 'Network Connection Error';
      default:
        return code ? `HTTP ${code}` : undefined;
    }
  };

  const statusLabel = getStatusLabel(status);

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50/70 p-5 text-red-900 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">{title}</h4>
            {statusLabel && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-red-700">
                {statusLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-red-700 leading-relaxed">{message}</p>
          {details && (
            <p className="mt-2 text-[11px] font-mono text-red-600 bg-white/60 p-2 rounded border border-red-100">
              {details}
            </p>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors shadow-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
