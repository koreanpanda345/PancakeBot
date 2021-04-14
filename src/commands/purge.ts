import { createCommand } from "../utils/helpers.ts";
import { deleteMessages, getMessages } from "../../deps.ts";
import { Embed } from "../utils/Embed.ts";

createCommand({
  name: "purge",
  aliases: ["delete"],
  arguments: [
    {
      name: "count",
      type: "number",
      defaultValue: 1,
    },
    {
      name: "reason",
      type: "...string",
      defaultValue: "No reason given",
    },
  ],
  userChannelPermissions: ["MANAGE_MESSAGES"],
  botChannelPermissions: ["MANAGE_MESSAGES"],
  guildOnly: true,
  execute: async function (message, args: PurgeArgs) {
    try {
      const messagesToDelete = await getMessages(message.channelID, {
        limit: 100,
      });
      if (!messagesToDelete) return;

      await deleteMessages(
        message.channelID,
        // + 1 to include the message that triggered the command
        messagesToDelete.slice(0, args.count + 1).map((m) => m.id),
      );

      const embed = new Embed()
        .setColor("#FFA500")
        .setTitle("Purged messages")
        .addField("Channel:", `<#${message.channelID}>`, true)
        .addField("Total:", args.count.toString(), true)
        .addField("Reason:", args.reason)
        .setTimestamp();

      return message.send({ embed });
    } catch (error) {
      console.error(error);

      return message.reply("Attempt to delete messages has failed!");
    }
  },
});

interface PurgeArgs {
  count: number;
  reason: string;
}
