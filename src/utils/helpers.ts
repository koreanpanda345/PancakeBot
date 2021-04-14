import { Command } from "../types/commands.ts";
import { Embed } from "./Embed.ts";
import {
  addReactions,
  botCache,
  cache,
  Collection,
  deleteMessageByID,
  editMessage,
  Message,
  MessageContent,
  removeUserReaction,
  sendMessage,
} from "../../deps.ts";
import { Milliseconds } from "./constants/time.ts";
import { needMessage, needReaction } from "./collectors.ts";

/** This function should be used when you want to convert milliseconds to a human readable format like 1d5h. */
export function humanizeMilliseconds(milliseconds: number) {
  // Gets ms into seconds
  const time = milliseconds / 1000;
  if (time < 1) return "1s";

  const days = Math.floor(time / 86400);
  const hours = Math.floor((time % 86400) / 3600);
  const minutes = Math.floor(((time % 86400) % 3600) / 60);
  const seconds = Math.floor(((time % 86400) % 3600) % 60);

  const dayString = days ? `${days}d ` : "";
  const hourString = hours ? `${hours}h ` : "";
  const minuteString = minutes ? `${minutes}m ` : "";
  const secondString = seconds ? `${seconds}s ` : "";

  return `${dayString}${hourString}${minuteString}${secondString}`;
}

/** This function helps convert a string like 1d5h to milliseconds. */
export function stringToMilliseconds(text: string) {
  const matches = text.match(/(\d+[w|d|h|m|s]{1})/g);
  if (!matches) return;

  let total = 0;

  for (const match of matches) {
    // Finds the first of these letters
    const validMatch = /(w|d|h|m|s)/.exec(match);
    // if none of them were found cancel
    if (!validMatch) return;
    // Get the number which should be before the index of that match
    const number = match.substring(0, validMatch.index);
    // Get the letter that was found
    const [letter] = validMatch;
    if (!number || !letter) return;

    let multiplier = Milliseconds.SECOND;
    switch (letter.toLowerCase()) {
      case `w`:
        multiplier = Milliseconds.WEEK;
        break;
      case `d`:
        multiplier = Milliseconds.DAY;
        break;
      case `h`:
        multiplier = Milliseconds.HOUR;
        break;
      case `m`:
        multiplier = Milliseconds.MINUTE;
        break;
    }

    const amount = number ? parseInt(number, 10) : undefined;
    if (!amount) return;

    total += amount * multiplier;
  }

  return total;
}

export function createCommand(command: Command) {
  botCache.commands.set(command.name, command);
}

export function createSubcommand(
  commandName: string,
  subcommand: Command,
  retries = 0,
) {
  const names = commandName.split("-");

  let command = botCache.commands.get(commandName);

  if (names.length > 1) {
    for (const name of names) {
      const validCommand = command
        ? command.subcommands?.get(name)
        : botCache.commands.get(name);
      if (!validCommand) break;

      command = validCommand;
    }
  }

  if (!command) {
    // If 10 minutes have passed something must have been wrong
    if (retries === 20) {
      return console.error(
        `Subcommand ${subcommand} unable to be created for ${commandName}`,
      );
    }

    // Try again in 30 seconds in case this command file just has not been loaded yet.
    setTimeout(
      () => createSubcommand(commandName, subcommand, retries++),
      30000,
    );
    return;
  }

  if (!command.subcommands) {
    command.subcommands = new Collection();
  }

  command.subcommands.set(subcommand.name, subcommand);
}

/** Use this function to send an embed with ease. */
export function sendEmbed(channelID: string, embed: Embed, content?: string) {
  return sendMessage(channelID, { content, embed });
}

/** Use this function to edit an embed with ease. */
export function editEmbed(message: Message, embed: Embed, content?: string) {
  return editMessage(message, { content, embed });
}

// Very important to make sure files are reloaded properly
let uniqueFilePathCounter = 0;
let paths: string[] = [];

/** This function allows reading all files in a folder. Useful for loading/reloading commands, monitors etc */
export async function importDirectory(path: string) {
  path = path.replaceAll("\\", "/");
  const files = Deno.readDirSync(Deno.realPathSync(path));
  const folder = path.substring(path.indexOf("/src/") + 5);

  if (!folder.includes("/")) console.log(`Loading ${folder}...`);

  for (const file of files) {
    if (!file.name) continue;

    const currentPath = `${path}/${file.name}`;
    if (file.isFile) {
      if (!currentPath.endsWith(".ts")) continue;
      paths.push(
        `import "${
          Deno.mainModule.substring(
            0,
            Deno.mainModule.lastIndexOf("/"),
          )
        }/${
          currentPath.substring(
            currentPath.indexOf("src/"),
          )
        }#${uniqueFilePathCounter}";`,
      );
      continue;
    }

    await importDirectory(currentPath);
  }

  uniqueFilePathCounter++;
}

/** Imports all everything in fileloader.ts */
export async function fileLoader() {
  await Deno.writeTextFile(
    "fileloader.ts",
    paths.join("\n").replaceAll("\\", "/"),
  );
  await import(
    `${
      Deno.mainModule.substring(
        0,
        Deno.mainModule.lastIndexOf("/"),
      )
    }/fileloader.ts#${uniqueFilePathCounter}`
  );
  paths = [];
}

export function getTime() {
  const now = new Date();
  const hours = now.getHours();
  const minute = now.getMinutes();

  let hour = hours;
  let amOrPm = `AM`;
  if (hour > 12) {
    amOrPm = `PM`;
    hour = hour - 12;
  }

  return `${hour >= 10 ? hour : `0${hour}`}:${
    minute >= 10 ? minute : `0${minute}`
  } ${amOrPm}`;
}

export function getCurrentLanguage(guildID: string) {
  return botCache.guildLanguages.get(guildID) ||
    cache.guilds.get(guildID)?.preferredLocale || "en_US";
}

/** This function allows to create a pagination using embeds and reactions Requires GUILD_MESSAGE_REACTIONS intent **/
export async function createEmbedsPagination(
  channelID: string,
  authorID: string,
  embeds: Embed[],
  defaultPage = 1,
  reactionTimeout = Milliseconds.SECOND * 30,
  reactions: {
    [emoji: string]: (
      setPage: (newPage: number) => void,
      currentPage: number,
      pageCount: number,
      deletePagination: () => void,
    ) => Promise<void>;
  } = {
    // deno-lint-ignore require-await
    "◀️": async (setPage, currentPage) => setPage(Math.max(currentPage - 1, 1)),
    "↗️": async (setPage) => {
      const question = await sendMessage(
        channelID,
        "To what page would you like to jump? Say `cancel` or `0` to cancel the prompt.",
      );
      const answer = await needMessage(authorID, channelID);

      if (question) {
        await deleteMessageByID(question.channelID, question.id);
      }

      const newPageNumber = parseInt(answer.content);

      if (answer) {
        await deleteMessageByID(answer.channelID, answer.id);
      }

      if (isNaN(newPageNumber)) {
        await sendMessage(channelID, "This is not a valid number!");
        return;
      }

      if (newPageNumber < 1 || newPageNumber > embeds.length) {
        await sendMessage(channelID, `This is not a valid page!`);
        return;
      }

      setPage(newPageNumber);
    },
    // deno-lint-ignore require-await
    "▶️": async (setPage, currentPage, pageCount) =>
      setPage(Math.min(currentPage + 1, pageCount)),
    // deno-lint-ignore require-await
    "🗑️": async (setPage, currentPage, pageCount, deletePagination) =>
      deletePagination(),
  },
) {
  if (embeds.length === 0) {
    return;
  }

  let currentPage = defaultPage;
  const embedMessage = await sendEmbed(channelID, embeds[currentPage - 1]);

  if (!embedMessage) {
    return;
  }

  if (embeds.length <= 1) {
    return;
  }

  await addReactions(
    embedMessage.channelID,
    embedMessage.id,
    Object.keys(reactions),
    true,
  );

  let isEnded = false;

  while (!isEnded) {
    if (!embedMessage) {
      return;
    }
    const reaction = await needReaction(authorID, embedMessage.id, {
      duration: reactionTimeout,
    });
    if (!reaction) {
      return;
    }

    if (embedMessage.guildID) {
      await removeUserReaction(
        embedMessage.channelID,
        embedMessage.id,
        reaction,
        authorID,
      );
    }

    if (reactions[reaction]) {
      await reactions[reaction](
        (newPage) => {
          currentPage = newPage;
        },
        currentPage,
        embeds.length,
        () => {
          isEnded = true;
          deleteMessageByID(embedMessage.channelID, embedMessage.id);
        },
      );
    }

    if (
      isEnded || !embedMessage ||
      !(await editEmbed(embedMessage, embeds[currentPage - 1]))
    ) {
      return;
    }
  }
}
