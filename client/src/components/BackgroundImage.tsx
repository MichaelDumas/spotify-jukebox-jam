import {useEffect, useState, useTransition} from "react";

interface BackgroundImageProps {
  imageSrc?: string;
}

export function BackgroundImage(props: BackgroundImageProps) {

  const [currentImage, setCurrentImage] = useState<string>();
  const [transitioned, setTransitioned] = useState(false);

  useEffect(() => {
    setTransitioned(false);

    const timer = setTimeout(() => {
      setTransitioned(true);
      setCurrentImage(props.imageSrc);
    }, 1000);

    return () => clearTimeout(timer);
  }, [props.imageSrc])

  const StyledImage = (hide: boolean, src?: string) => {
    return (<div
        className={`fixed inset-0 bg-cover bg-center scale-110 pointer-events-none brightness-40 ${
            transitioned ? "transition-none" : "transition-opacity duration-700 ease-in-out"
        }`}
        style={{
        backgroundImage: src
          ? `url("${src}")`
          : "radial-gradient(circle, rgba(0, 0, 0, 1) 0%, rgba(7, 20, 7, 1) 100%)",
          zIndex: -1,
        opacity: hide ? "0%" : "100%"
    }}
    />)
  }


  return (
      <>
        {StyledImage(!transitioned, currentImage)}
        {StyledImage(transitioned, props.imageSrc)}
      </>)
}