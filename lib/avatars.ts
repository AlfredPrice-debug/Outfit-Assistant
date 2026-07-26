// Plain data, no "use client" needed, safe to import from server or client
// components.

export type AssistantAvatarKey =
  | "blazer"
  | "tablet"
  | "thumbsup_red"
  | "turtleneck"
  | "leather_phone"
  | "leopard_thumbsup";

export interface AssistantAvatarOption {
  key: AssistantAvatarKey;
  label: string;
  src: string;
}

// Outfit MC, the assistant's persona. The user picks one headshot to
// represent her everywhere she appears (empty state, chat bubbles, the
// thinking indicator) rather than the app assigning a pose per state.
export const ASSISTANT_AVATARS: AssistantAvatarOption[] = [
  { key: "blazer", label: "Blazer", src: "/avatars/outfitmc_blazer.png" },
  { key: "tablet", label: "Tablet", src: "/avatars/outfitmc_tablet.png" },
  { key: "thumbsup_red", label: "Red Blouse", src: "/avatars/outfitmc_thumbsup_red.png" },
  { key: "turtleneck", label: "Turtleneck", src: "/avatars/outfitmc_turtleneck.png" },
  { key: "leather_phone", label: "Leather Jacket", src: "/avatars/outfitmc_leather_phone.png" },
  { key: "leopard_thumbsup", label: "Leopard Print", src: "/avatars/outfitmc_leopard_thumbsup.png" },
];

export const DEFAULT_ASSISTANT_AVATAR_KEY: AssistantAvatarKey = "blazer";

const ASSISTANT_AVATAR_BY_KEY = new Map(ASSISTANT_AVATARS.map((option) => [option.key, option]));

export function getAssistantAvatar(key: AssistantAvatarKey): AssistantAvatarOption {
  return ASSISTANT_AVATAR_BY_KEY.get(key) ?? ASSISTANT_AVATAR_BY_KEY.get(DEFAULT_ASSISTANT_AVATAR_KEY)!;
}

export type UserAvatarKey =
  | "owl"
  | "toucan"
  | "ram"
  | "rabbit"
  | "scottie"
  | "gorilla"
  | "parrot"
  | "monkey"
  | "shepherd"
  | "fox"
  | "scientist"
  | "walrus"
  | "ninjacat"
  | "yorkie"
  | "catpearls"
  | "badger"
  | "hippo"
  | "crow";

export interface UserAvatarOption {
  key: UserAvatarKey;
  label: string;
  src: string;
}

export const USER_AVATARS: UserAvatarOption[] = [
  { key: "owl", label: "Owl", src: "/avatars/owl.png" },
  { key: "toucan", label: "Toucan", src: "/avatars/toucan.png" },
  { key: "ram", label: "Highland Ram", src: "/avatars/ram.png" },
  { key: "rabbit", label: "Nesting Rabbit", src: "/avatars/rabbit.png" },
  { key: "scottie", label: "Scottie Dog", src: "/avatars/scottie.png" },
  { key: "gorilla", label: "Gorilla", src: "/avatars/gorilla.png" },
  { key: "parrot", label: "Pirate Parrot", src: "/avatars/parrot.png" },
  { key: "monkey", label: "Monkey", src: "/avatars/monkey.png" },
  { key: "shepherd", label: "Detective Shepherd", src: "/avatars/shepherd.png" },
  { key: "fox", label: "Fox", src: "/avatars/fox.png" },
  { key: "scientist", label: "Mad Scientist", src: "/avatars/scientist.png" },
  { key: "walrus", label: "Walrus", src: "/avatars/walrus.png" },
  { key: "ninjacat", label: "Ninja Cat", src: "/avatars/ninjacat.png" },
  { key: "yorkie", label: "Yorkie", src: "/avatars/yorkie.png" },
  { key: "catpearls", label: "Cat with Pearls", src: "/avatars/catpearls.png" },
  { key: "badger", label: "Painter Badger", src: "/avatars/badger.png" },
  { key: "hippo", label: "Hippo", src: "/avatars/hippo.png" },
  { key: "crow", label: "Crow", src: "/avatars/crow.png" },
];

export const DEFAULT_USER_AVATAR_KEY: UserAvatarKey = "fox";

const USER_AVATAR_BY_KEY = new Map(USER_AVATARS.map((option) => [option.key, option]));

export function getUserAvatar(key: UserAvatarKey): UserAvatarOption {
  return USER_AVATAR_BY_KEY.get(key) ?? USER_AVATAR_BY_KEY.get(DEFAULT_USER_AVATAR_KEY)!;
}
