import type {ReactNode} from "react";

export interface IconButtonProps {
  icon: ReactNode;
  ariaLabel: string;
  onClick: () => void;
}

export function IconButton(props: IconButtonProps) {

  return (
      <button
          className="rounded-md bg-green-600 p-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow-lg focus:bg-green-900 focus:shadow-none active:bg-green-900 hover:bg-green-900 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none w-full h-full"
          type="button"
          aria-label={props.ariaLabel}
          onClick={props.onClick}
      >
        {props.icon}
      </button>
  )
}