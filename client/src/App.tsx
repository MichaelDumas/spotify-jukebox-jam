import {useJukeboxStream} from "./useJukeboxStream.ts";
import {useEffect, useState} from "react";
import QRCode from "react-qr-code";
import {PauseIcon} from "./icons/PauseIcon.tsx";
import {PlayIcon} from "./icons/PlayIcon.tsx";
import lrclib, {Lyricsfile} from 'lrclib.js';
import {BackgroundImage} from "./components/BackgroundImage.tsx";
import {LyricCard} from "./components/LyricCard.tsx";
import {GlassCard} from "./components/GlassCard.tsx";
import {NowPlaying} from "./components/NowPlaying.tsx";
import {QueueCard} from "./components/QueueCard.tsx";

export interface NowPlayingData {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumUrl: string;
}

function App() {
  const { nowPlaying, isConnected} = useJukeboxStream();

  const [currentSong, setCurrentSong] = useState<NowPlayingData>();
  const [songProgress, setSongProgress] = useState(0);

  useEffect(() => {
    if (nowPlaying) {
      if (currentSong?.id != nowPlaying?.id) {
        setCurrentSong({
          id: nowPlaying.id,
          title: nowPlaying.name,
          artist: nowPlaying.artist,
          album: nowPlaying.album,
          albumUrl: nowPlaying.albumUrl,
        });
      }
      setSongProgress(nowPlaying.currentProgress);

      if (nowPlaying.isPlaying) {
        const interval = setInterval(() => {
          setSongProgress((songProgress) => songProgress + 250);
        }, 250);

        return () => clearInterval(interval);
      }
    }
  }, [nowPlaying]);

  return (
    <div className="h-screen text-neutral-100 p-8 overflow-hidden flex flex-col justify-end gap-6">
      {isConnected ? (
          <>
            {/*TODO remove this image hardcode after just temp while rate limited in dev*/}
            <BackgroundImage imageSrc={Boolean(nowPlaying?.artistPicture?.trim()) ? nowPlaying?.artistPicture : "https://cdn.sanity.io/images/z2aip6ei/production/e8667e8e42b0250616087d60c74e1a48e58426e2-2560x1060.jpg"} />
            <div className="flex gap-6 flex-1 min-h-0">
              <div className="flex-1/3 min-w-0">
                <QueueCard currentSong={currentSong} songProgress={songProgress}/>
              </div>
              <div className="flex-2/3 h-full min-w-0">
                <LyricCard currentSong={currentSong} songProgress={songProgress}/>
              </div>
            </div>
          <NowPlaying nowPlaying={nowPlaying} songProgress={songProgress} />
          </>
      ) : (
          <h1> Nothing is playing </h1>
      )}
    </div>
  )
}

export default App
