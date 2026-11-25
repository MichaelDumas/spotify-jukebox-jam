import type {PropsWithChildren} from "react";

interface GlassCardProps {
  className?: string;
}

export function GlassCard(props: PropsWithChildren<GlassCardProps>) {
  return (
      <div className={`w-full flex border-2 border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl ${props.className} p-5 gap-6`}>
        {props.children}
      </div>
  );
}