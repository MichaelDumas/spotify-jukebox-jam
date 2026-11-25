export interface NowPlaying {
  id: string;
  name: string;
  artist: string;
  artistPicture: string | undefined;
  album: string;
  albumUrl: string;
  isPlaying: boolean;
  songDuration: number;
  currentProgress: number;
}