import { useState, useEffect } from 'react';
import type {NowPlaying} from "../../shared/NowPlaying.ts";

export function useJukeboxStream() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const events = new EventSource('/api/events');

    events.onopen = () => {
      setIsConnected(true);
    };

    events.onmessage = (event: MessageEvent) => {
      try {
        const data: NowPlaying = JSON.parse(event.data).nowPlaying;
        setNowPlaying(data);
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    events.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      events.close();
    };
  }, []);

  return { nowPlaying, isConnected };
}