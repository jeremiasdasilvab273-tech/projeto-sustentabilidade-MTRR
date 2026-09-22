'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { regularizeLot } from '../actions';

export default function RegularizeButton({ lotId }: { lotId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await regularizeLot(lotId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="focus-ring inline-flex h-8 items-center rounded border border-green-200 bg-green-50 px-2.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? 'Regularizando…' : 'Marcar regularizado'}
      </button>
      {error && <span className="text-[11px] font-semibold text-red-700">{error}</span>}
    </div>
  );
}
