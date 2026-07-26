import Image from "next/image";

// The 5 cropped poses live in /public/avatars (see scripts/none — cropped
// once from the provided character sheet). "greeting" and "thinking" are
// reserved for the assistant; the other three are what a user without a
// photo of their own can pick from instead.
export type AvatarPose = "greeting" | "thinking" | "hangers" | "tablet" | "thumbsup";

export const USER_SELECTABLE_POSES: AvatarPose[] = ["hangers", "tablet", "thumbsup"];
export const DEFAULT_USER_POSE: AvatarPose = "hangers";

const AVATAR_SRC: Record<AvatarPose, string> = {
  greeting: "/avatars/greeting.png",
  thinking: "/avatars/thinking.png",
  hangers: "/avatars/hangers.png",
  tablet: "/avatars/tablet.png",
  thumbsup: "/avatars/thumbsup.png",
};

export function Avatar({
  pose,
  size = 32,
  label,
}: {
  pose: AvatarPose;
  size?: number;
  label: string;
}) {
  return (
    <Image
      src={AVATAR_SRC[pose]}
      alt={label}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-brass object-cover"
      style={{ width: size, height: size }}
    />
  );
}
