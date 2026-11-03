import { useEffect, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { NafsAssetView } from '@/types/nafs.contract';
import { nafsService } from '@/services/nafsService';
import { useNafsSession } from './useNafsSession';

export function NafsMedia({
  asset,
  attemptId,
  onReady,
}: {
  asset: NafsAssetView;
  attemptId: string;
  onReady?: () => void;
}) {
  const owner = useNafsSession();
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setUrl('');
    setFailed(false);
    void nafsService
      .media(owner, controller.signal, attemptId, asset.id)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [owner, attemptId, asset.id, retry]);
  if (failed)
    return (
      <div
        role="alert"
        className="rounded-lg border border-slate-300 p-3 text-sm"
      >
        Image could not load.{' '}
        <button
          type="button"
          className="underline"
          onClick={() => setRetry((n) => n + 1)}
        >
          Reload image
        </button>
      </div>
    );
  if (!url)
    return (
      <p role="status" className="p-3 text-sm text-slate-500">
        Loading image…
      </p>
    );
  return (
    <div className="min-w-0">
      <img
        src={url}
        width={asset.width}
        height={asset.height}
        alt={asset.alt}
        onLoad={onReady}
        onError={() => setFailed(true)}
        className="max-w-full h-auto mx-auto rounded-lg"
      />
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 text-sm text-blue-700 underline min-h-10"
      >
        <ZoomIn className="h-4 w-4" aria-hidden="true" />
        Enlarge image
      </button>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[96vw] w-[1100px] max-h-[92dvh] p-4 rounded-2xl">
          <DialogTitle>Expanded image</DialogTitle>
          <DialogDescription>
            Scroll to inspect the full image. Use your device zoom for more
            detail.
          </DialogDescription>
          <div className="overflow-auto max-h-[70dvh] border rounded-lg bg-white">
            <img
              src={url}
              width={asset.width}
              height={asset.height}
              alt={asset.alt}
              className="max-w-none h-auto"
              style={{ width: Math.max(asset.width, 800) }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
