import { botCache, cache } from "../../deps.ts";
import { PermissionLevels } from "../types/commands.ts";

// The member using the command must be an server owner.
botCache.permissionLevels.set(
  PermissionLevels.SERVER_OWNER,
  // deno-lint-ignore require-await
  async (message) =>
    cache.guilds.get(message.guildID)?.ownerID === message.author.id,
);
