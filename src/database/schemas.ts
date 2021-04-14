export interface ClientSchema {
  /** The bot id */
  id: string;
}

export interface GuildSchema {
  /** The guild id */
  id: string;
  /** The custom prefix for this guild */
  prefix: string;
  /** The custom language for this guild */
  language: string;
}

export interface UserSchema {
  /** The user id who created this emoji */
  id: string;
  draft_stats: DraftStatsSchema;
  speed_tour_stats: SpeedTourStatsSchema;
}

export interface CurrentDraftSchema {
  id: string;
  coaches: CoachesDataSchema[];
}

export interface CoachesDataSchema {
  id: string;
  stats: DraftStatsSchema;
  roster: PokemonStatsSchema[];
}

export interface SpeedTourStatsSchema {
  competed_tours: number;
  total_wins: number;
  total_losses: number;
  total_differential: number;
  tours: {
    [key: string]: {
      roster: PokemonStatsSchema[];
      wins: number;
      losses: number;
      differential: number;
    }
  }
}

export interface DraftStatsSchema {
  competed_seasons: string[];
  total_wins: number;
  total_losses: number;
  total_differential: number;
  seasons: {
    [key: string]: {
      division: string;
      roster: PokemonStatsSchema[];
      wins: number;
      losses: number;
      differential: number;
      rank: number;
    }
  }
}

export interface PokemonStatsSchema {
  name: string;
  kills: number;
  deaths: number;
  differential: number;
  drafted_by: string;
  season: string;
}
