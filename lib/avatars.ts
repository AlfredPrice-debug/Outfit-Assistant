// Plain data — no "use client" needed, safe to import from server or client
// components. The assistant's two poses are fixed; the user avatars are the
// full set the user picked to stand in for a profile photo they don't have.
export const ASSISTANT_AVATARS = {
  greeting: "/avatars/greeting.png",
  thinking: "/avatars/thinking.png",
} as const;

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
