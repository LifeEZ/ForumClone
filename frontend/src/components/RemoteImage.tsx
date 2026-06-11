'use client';

import Image from 'next/image';

type RemoteImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
} & (
  | { fill: true; width?: never; height?: never }
  | { fill?: false; width: number; height: number }
);

export function RemoteImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  sizes,
}: RemoteImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? '100vw'}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
    />
  );
}
