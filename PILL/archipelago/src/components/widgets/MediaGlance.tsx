import { useState } from 'react';
import type { MediaUpdate } from '../../lib/tauriEvents';

function Artwork({ source }: { source: string | null }) {
  const [failed, setFailed] = useState(false);
  return source && !failed
    ? <img className="media-glance__image" src={source} alt="" onError={() => setFailed(true)} />
    : <span className="media-glance__fallback" aria-hidden="true">♪</span>;
}

export function MediaGlance({ media }: { media: MediaUpdate }) {
  const title = media.title.trim() || 'Unknown title';
  const artist = media.artist.trim() || (media.is_playing ? 'Now playing' : 'Playback paused');
  const hasProgress = Number.isFinite(media.duration) && media.duration > 0 && Number.isFinite(media.position);
  const progress = hasProgress ? Math.min(100, Math.max(0, media.position / media.duration * 100)) : 0;
  return (
    <div className="media-glance" title={`${title} — ${artist}`}>
      <div className="media-glance__artwork">
        <Artwork key={media.artwork ?? ''} source={media.artwork} />
        <span className="media-glance__status" aria-label={media.is_playing ? 'Playing' : 'Paused'} data-playing={media.is_playing}>
          {media.is_playing ? '▶' : 'Ⅱ'}
        </span>
      </div>
      <div className="media-glance__copy">
        <span className="media-glance__title">{title}</span>
        <span className="media-glance__artist">{artist}</span>
        {hasProgress && <div className="media-glance__progress" role="progressbar" aria-label="Track progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>}
      </div>
    </div>
  );
}
