// Plain data, no "use client" needed, safe to import from server or client
// components.

export type AssistantAvatarKey = "floral" | "rust" | "blackturtle";

export interface AssistantAvatarOption {
  key: AssistantAvatarKey;
  label: string;
  src: string;
  // A matching "thinking" pose from the same look, shown while she's
  // generating outfits instead of reusing her normal expression.
  thinkingSrc: string;
}

// Outfit MC, the assistant's persona. The user picks one look; its matching
// thinking pose comes along with it automatically rather than being a
// separate choice. This set replaces an earlier one whose source images
// weren't cropped cleanly (see README).
export const ASSISTANT_AVATARS: AssistantAvatarOption[] = [
  {
    key: "floral",
    label: "Floral Wrap",
    src: "/avatars/outfitmc_floral.png",
    thinkingSrc: "/avatars/outfitmc_floral_thinking.png",
  },
  {
    key: "rust",
    label: "Rust Sweater",
    src: "/avatars/outfitmc_rust.png",
    thinkingSrc: "/avatars/outfitmc_rust_thinking.png",
  },
  {
    key: "blackturtle",
    label: "Black Turtleneck",
    src: "/avatars/outfitmc_blackturtle.png",
    thinkingSrc: "/avatars/outfitmc_blackturtle_thinking.png",
  },
];

export const DEFAULT_ASSISTANT_AVATAR_KEY: AssistantAvatarKey = "floral";

const ASSISTANT_AVATAR_BY_KEY = new Map(ASSISTANT_AVATARS.map((option) => [option.key, option]));

export function getAssistantAvatar(key: AssistantAvatarKey): AssistantAvatarOption {
  return ASSISTANT_AVATAR_BY_KEY.get(key) ?? ASSISTANT_AVATAR_BY_KEY.get(DEFAULT_ASSISTANT_AVATAR_KEY)!;
}

export type UserAvatarKey =
  | "owl"
  | "toucan"
  | "rabbit"
  | "scottie"
  | "gorilla"
  | "parrot"
  | "monkey"
  | "shepherd"
  | "fox"
  | "walrus"
  | "ninjacat"
  | "yorkie"
  | "catpearls"
  | "badger"
  | "hippo";

export interface UserAvatarOption {
  key: UserAvatarKey;
  label: string;
  src: string;
}

// One-word, at-most-two-syllable nicknames, one per animal avatar. Keys and
// image sources are unchanged (they're storage/DB-adjacent identifiers, not
// display text), only the label shown in the picker moves.
export const USER_AVATARS: UserAvatarOption[] = [
  { key: "owl", label: "Hoot", src: "/avatars/owl.png" },
  { key: "toucan", label: "Beak", src: "/avatars/toucan.png" },
  { key: "rabbit", label: "Egg", src: "/avatars/rabbit.png" },
  { key: "scottie", label: "Scotty", src: "/avatars/scottie.png" },
  { key: "gorilla", label: "Congo", src: "/avatars/gorilla.png" },
  { key: "parrot", label: "Squawk", src: "/avatars/parrot.png" },
  { key: "monkey", label: "Nana", src: "/avatars/monkey.png" },
  { key: "shepherd", label: "Bones", src: "/avatars/shepherd.png" },
  { key: "fox", label: "Ferris", src: "/avatars/fox.png" },
  { key: "walrus", label: "Tusk", src: "/avatars/walrus.png" },
  { key: "ninjacat", label: "Meow", src: "/avatars/ninjacat.png" },
  { key: "yorkie", label: "Beau", src: "/avatars/yorkie.png" },
  { key: "catpearls", label: "Audrey", src: "/avatars/catpearls.png" },
  { key: "badger", label: "Vincent", src: "/avatars/badger.png" },
  { key: "hippo", label: "Harry", src: "/avatars/hippo.png" },
];

export const DEFAULT_USER_AVATAR_KEY: UserAvatarKey = "fox";

const USER_AVATAR_BY_KEY = new Map(USER_AVATARS.map((option) => [option.key, option]));

export function getUserAvatar(key: UserAvatarKey): UserAvatarOption {
  return USER_AVATAR_BY_KEY.get(key) ?? USER_AVATAR_BY_KEY.get(DEFAULT_USER_AVATAR_KEY)!;
}
