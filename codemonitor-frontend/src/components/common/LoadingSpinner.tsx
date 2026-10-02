import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export default function LoadingSpinner({
  label = 'Loading data from backend...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-[#2E45A2]" />
      {label && <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
}
