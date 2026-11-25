import {getArtistPicture, getCurrentlyPlaying} from './spotify.ts';
import type {NowPlaying} from "./shared/NowPlaying.ts";

let pushedForTrackId = null;
let nowPlaying: NowPlaying | undefined;
let artistPic: string | undefined;

export const getNowPlaying = () => nowPlaying;

export function startPoller(onQueueChange: () => void) {
  setInterval(async () => {
    try {
      const state = await getCurrentlyPlaying();

      if (!state?.item) {
        console.log('[Poller] Nothing playing (state:', state, ')');
        nowPlaying = undefined;
        return;
      }


      const track = state.item;
      const remainingMs = track.duration_ms - state.progress_ms;

      if (nowPlaying?.id != track.id) {
        artistPic = await getArtistPicture(track.artists[0].id);
      }

      nowPlaying = {
        id: track.id,
        name: track.name,
        artist: track.artists.map((a: { name: string }) => a.name).join(', '),
        artistPicture: artistPic,
        album: track.album.name,
        albumUrl: track.album.images[0]?.url ?? "",
        isPlaying: state.is_playing,
        songDuration: track.duration_ms,
        currentProgress: state.progress_ms
      };

      // // Reset flag when a new song starts (or same song restarts)
      // if (track.id !== pushedForTrackId || state.progress_ms < 10_000) {
      //   if (track.id !== pushedForTrackId) pushedForTrackId = null;
      // }

      // Just-in-time push when < 15 seconds remain
      // if (state.is_playing && remainingMs < 15_000 && pushedForTrackId !== track.id) {
      //   const next = QueueDB.popNext();
      //   if (next) {
      //     await pushToSpotifyQueue(next.track_uri);
      //     pushedForTrackId = track.id;
      //     console.log(`[Jukebox] Pushed to Spotify: ${next.track_name}`);
      //     onQueueChange();
      //   }
      // }

      onQueueChange();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Poller]', message);
    }
  }, 6000);
}