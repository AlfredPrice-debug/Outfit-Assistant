import { prisma } from "./prisma";
import { getOwnerId } from "./owner";
import type { UserSettingsInput } from "./schemas";

// Matches the Prisma model's own column defaults, so a user who's never
// visited the Settings page behaves identically to one who saved these
// values explicitly.
export const DEFAULT_USER_SETTINGS: UserSettingsInput = {
  preferredChatMode: "conversation",
  swipeCardCount: 5,
  chatFollowUpCount: 5,
};

// No row is created just by reading; a row only exists once the user has
// actually saved something from the Settings page.
export async function getUserSettings(): Promise<UserSettingsInput> {
  const userId = await getOwnerId();
  const row = await prisma.userSettings.findUnique({ where: { userId } });
  if (!row) return DEFAULT_USER_SETTINGS;
  return {
    preferredChatMode: row.preferredChatMode as UserSettingsInput["preferredChatMode"],
    swipeCardCount: row.swipeCardCount,
    chatFollowUpCount: row.chatFollowUpCount,
  };
}

export async function upsertUserSettings(input: UserSettingsInput): Promise<UserSettingsInput> {
  const userId = await getOwnerId();
  const row = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { ...input },
  });
  return {
    preferredChatMode: row.preferredChatMode as UserSettingsInput["preferredChatMode"],
    swipeCardCount: row.swipeCardCount,
    chatFollowUpCount: row.chatFollowUpCount,
  };
}
