import type {NowPlayingData} from "../App.tsx";
import {useEffect, useRef, useState} from "react";
import lrclib, {type Lyricsfile} from "lrclib.js";
import {GlassCard} from "./GlassCard.tsx";

interface LyricCardProps {
  currentSong?: NowPlayingData;
  songProgress?: number;
}

export function LyricCard(props: LyricCardProps) {

  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [lyricFile, setLyricFile] = useState<Lyricsfile>();
  const [lyrics, setLyrics] = useState<{past: string[], current: string, future: string[]}>();

  // Only update lyrics when songProgress or lyricFile changes AND current text is defined
  useEffect(() => {
    const currentLyrics = lyricFile?.getTimestampLyrics(props.songProgress ?? 0);
    const nextCurrent = currentLyrics?.current?.[0]?.text;

    // At first, currentLyric can be undefined, and so no lyrics are set until the first lyrics
    // (like if the song starts with an instrumental section). This means that no lyrics show up,
    // and eventually all just pop in and it's jarring. So, populate the future lyrics on first
    // load if the lyric file exists but lyrics haven't been set yet.
    if (lyrics == undefined && lyricFile) {
      setLyrics({
        past: [],
        current: "",
        future: currentLyrics?.future.map(t => t.text) ?? []});
      containerRef.current?.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }

    if (!nextCurrent) return;

    setLyrics((prev) => {
      if (prev?.current === nextCurrent) return prev;

      activeLyricRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return {
        past: currentLyrics.history.map((t) => t.text),
        current: nextCurrent,
        future: currentLyrics.future.map((t) => t.text),
      };
    });
  }, [lyricFile, props.songProgress]);

  const handleSongChange = () => {
    setLyricFile(undefined);
    setLyrics(undefined);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchLyrics() {
      handleSongChange();

      if (!props.currentSong) {
        return;
      }

      try {
        const result = await lrclib.search({
          track_name: props.currentSong.title,
          artist_name: props.currentSong.artist,
          album_name: props.currentSong.album,
        });

        if (!cancelled) {
          setLyricFile(result?.filter(t => Boolean(t.syncedLyrics))?.[0].getLyricsfile());
        }
      } catch (err) {
        console.error('Failed to fetch lyrics:', err);
        if (!cancelled) setLyricFile(undefined);
      }
    }

    void fetchLyrics();

    // Cleanup: if the song changes before fetchLyrics finishes, ignore the old result
    return () => {
      cancelled = true;
    };
  }, [props.currentSong])

  const renderLyric = (lyric: string) => {
    return <p className="text-6xl text-gray-300">{lyric}</p>
  };

  const renderContent = () => {
    if (lyricFile) {
      return (
          <div className="mask-t-from-95% mask-b-from-80% overflow-hidden flex flex-col gap-12" ref={containerRef}>
            {lyrics?.past.map(renderLyric)}
            <p ref={activeLyricRef} className="text-6xl font-bold">{lyrics?.current ?? ""}</p>
            {lyrics?.future.map(renderLyric)}
            <div className="h-3/4 shrink-0" aria-hidden="true" />
          </div>)
    }

    if (!props.currentSong) {
      return (
          <div className="w-full h-full text-center flex flex-col justify-center">
            <h2 className="text-4xl italic text-gray-200">No song currently playing</h2>
            <h2 className="text-xl italic text-gray-400">Add a song to the queue to get started</h2>
          </div>
      )
    }

    return (
        <div className="w-full h-full text-center flex flex-col justify-center">
          {/* TODO: Put some sort of not found icon here */}
          <h2 className="text-4xl italic text-gray-200">No lyrics found</h2>
          <h2 className="text-xl italic text-gray-400">You are too tapped into the underground</h2>
        </div>
    )
  }

  return (
      <GlassCard className="flex-col h-full overflow-hidden scroll-mt-8 pt-8">
        {renderContent()}
      </GlassCard>
  )
}