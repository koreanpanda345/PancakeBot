import {createCommand, createSubcommand} from "../../utils/helpers.ts";
import {Embed} from "../../utils/Embed.ts";
import {db} from "../../database/database.ts";
import { Member } from "../../../deps.ts";

createCommand({
    name: "stats",
    arguments: [
        {
            name: "subcommand",
            type: "subcommand",
            required: false
        }
    ],
    guildOnly: true,
    description: "Displays your stats, or another player's stats in the current season, or previous seasons, as well in speed tours.",
    execute: (message) => {
        const embed = new Embed()
            .setTitle("All of the options you can use to look up someone's stats.")
            .addField("current", "Gets the stats of a player in the current season.")
            .addField("season", "Gets the stats of a player for a certain season.")
            .addField("speed", "Gets the stats of a player for all of the speed tours they were apart of.");

        message.send({embed});
    }
});
createSubcommand("stats", {
    name: "current",
    arguments: [
        {
            name: "player",
            type: "member",
            required: false
        }
    ],
    execute: async (message, args) => {
        if(!args.player) {
            // if no argument, then we are going to get info about the user.
            if (!db.users.has(message.author.id)) {
                db.users.create(message.author.id, {
                    id: message.author.id,
                    draft_stats: {
                        total_wins: 0,
                        total_losses: 0,
                        total_differential: 0,
                        competed_seasons: [],
                        seasons: {}
                    },
                    speed_tour_stats: {
                        total_wins: 0,
                        total_losses: 0,
                        total_differential: 0,
                        competed_tours: 0,
                        tours: {
                            "0": {
                                roster: [],
                                differential: 0,
                                losses: 0,
                                wins: 0
                            }
                        }
                    }
                });
            }
            const data = await db.users.get(message.author.id);
            const embed = new Embed().setTitle(`${message.author.username} stats.`);
            embed.setDescription(`These are the player's stats. Note, that it may not be up to date. Stats have to be put in manually, so please give the staff team some time to put them in.`);
            embed.addField("Total Wins", `${data!.draft_stats.total_wins}`, true);
            embed.addField("Total Losses", `${data!.draft_stats.total_losses}`, true);
            embed.addField("Total Differential", `${data!.draft_stats.total_differential}`, true);

            embed.addField("Roster", `\`\``);
            message.send({embed});
        } else {
            // if argument, then we are going get info about the requested player.
            if(!db.users.has((args.player as Member).id)) {
                db.users.create((args.player as Member).id, {
                    id: (args.player as Member).id,
                    draft_stats: {
                        total_wins: 0,
                        total_losses: 0,
                        total_differential: 0,
                        competed_seasons: [],
                        seasons: {}
                    }
                });
            }
            const data = await db.users.get((args.player as Member).id);
            const embed = new Embed().setTitle(`${(args.player as Member).username} stats.`);
            embed.setDescription(`These are the player's stats. Note, that it may not be up to date. Stats have to be put in manually, so please give the staff team some time to put them in.`);
            embed.addField("Total Wins", `${data!.draft_stats.total_wins}`, true);
            embed.addField("Total Losses", `${data!.draft_stats.total_losses}`, true);
            embed.addField("Total Differential", `${data!.draft_stats.total_differential}`, true);

            message.send({embed});
        }
    }
});

// createSubcommand("stats", {
//     name: "season"
// });
//
// createSubcommand("stats", {
//     name: "speed"
// });
