import Image from "next/image";

export function Avatar({
  src,
  size = 32,
  label,
}: {
  src: string;
  size?: number;
  label: string;
}) {
  return (
    <Image
      src={src}
      alt={label}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-brass object-cover"
      style={{ width: size, height: size }}
    />
  );
}
