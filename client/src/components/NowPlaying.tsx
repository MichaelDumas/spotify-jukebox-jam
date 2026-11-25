import {GlassCard} from "./GlassCard.tsx";
import {PauseIcon} from "../icons/PauseIcon.tsx";
import {PlayIcon} from "../icons/PlayIcon.tsx";
import type {NowPlaying} from "../../../shared/NowPlaying.ts";
import QRCode from "react-qr-code";

interface NowPlayingProps {
  nowPlaying?: NowPlaying;
  songProgress?: number;
}

export function NowPlaying(props: NowPlayingProps) {
  const fillPercentage = ((props.songProgress ?? 0) / (props.nowPlaying?.songDuration ?? 0)) * 100;

  const secondsToLengthDisplay = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')}`;
  }

  return (
      <GlassCard>
        <img className="size-48 shrink-0" src={props.nowPlaying?.albumUrl} alt=""/>
        <div className="flex flex-col gap-1 w-full flex-1 min-w-0">
          <h1 className="text-6xl font-medium truncate shrink-0">{props.nowPlaying?.name}</h1>
          <p className="text-4xl text-gray-300 truncate shrink-0">{props.nowPlaying?.artist}</p>
          <p className="text-2xl text-gray-300 truncate shrink-0">{props.nowPlaying?.album}</p>
          <div className="w-full mt-auto flex flex-wrap items-center gap-3">
            <div className="w-8 h-8 text-white">
              {props.nowPlaying?.isPlaying ? (<PauseIcon />) : (<PlayIcon />)}
            </div>
            <p className="text-2xl text-gray-300">{secondsToLengthDisplay((props.songProgress ?? 0) / 1000)}</p>
            <div className="h-full grow content-center">
              <div className="bg-black/30 grow h-3 rounded-2xl flex items-center">
                <div className={`bg-green-500/80 h-3 rounded-2xl`} style={{width: `${fillPercentage}%`}} />
                <div className={`bg-white h-4 w-4 rounded-full relative right-2`} />
              </div>
            </div>
            <p className="text-2xl text-gray-300">{secondsToLengthDisplay((props.nowPlaying?.songDuration ?? 0) / 1000)}</p>
          </div>
        </div>
        <div className="h-full w-1 bg-black/30" />
        <div className="h-48 flex flex-col gap-3 text-center shrink-0">
          <p className="font-bold text-xl">Add to the queue</p>
          <div className="bg-white rounded-2xl p-2 flex-1 min-h-0 aspect-square mx-auto">
            <QRCode
                style={{ height: "100%", width: "100%" }}
                value="http://localhost:5173"
            />
          </div>
        </div>
      </GlassCard>
  )
}