export type AvatarVideoState = 'loading' | 'ready' | 'error';

/** Decode a paused preview without autoplay. Bound metadata-only mobile loads. */
export function watchAvatarPreview(video: HTMLVideoElement, options: {
  active: () => boolean;
  state: (state: AvatarVideoState) => void;
  failed: () => void;
}) {
  let disposed = false;
  let retried = false;
  let failed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { clearTimeout(timer); timer = undefined; };
  const fail = () => {
    if (disposed || failed) return;
    failed = true;
    clear();
    options.state('error');
    options.failed();
  };
  const ready = () => {
    if (disposed || video.readyState < 2 || video.error) return false;
    failed = false;
    clear();
    options.state('ready');
    return true;
  };
  const arm = () => {
    clear();
    timer = setTimeout(() => {
      if (disposed || ready()) return;
      // Only restart an idle download; never reset an active learner's clock.
      if (!retried && !options.active()) {
        retried = true;
        video.load();
        arm();
      } else fail();
    }, 15000);
  };
  const metadata = () => {
    if (!options.active() && video.paused && Number.isFinite(video.duration) && video.duration > 0) {
      // iOS may fetch metadata without decoding the first frame until a seek.
      video.currentTime = Math.min(0.05, video.duration / 2);
    }
    ready();
  };
  const loading = () => { failed = false; options.state('loading'); arm(); };
  const handlers = { loadedmetadata: metadata, loadeddata: ready, canplay: ready,
    seeked: ready, error: fail, loadstart: loading, emptied: loading };
  Object.entries(handlers).forEach(([event, handler]) => video.addEventListener(event, handler));
  options.state('loading');
  arm();
  metadata();
  if (video.error) fail();
  return {
    retry: () => {
      if (disposed) return;
      retried = false;
      loading();
      video.load();
    },
    dispose: () => {
      disposed = true;
      clear();
      Object.entries(handlers).forEach(([event, handler]) => video.removeEventListener(event, handler));
    },
  };
}
