export const ArmyMovesPrefix = "army_moves";
export const WarRecognitionsPrefix = "war";
export const GameLogSlug = "game_logs";

export const ExchangePerilDirect = "peril_direct";
export const ExchangePerilTopic = "peril_topic";

export const COMMAND_TYPES = {
  help: 'help',
  move: 'move',
  pause: 'pause',
  quit: 'quit',
  resume: 'resume',
  spam: 'spam',
  spawn: 'spawn',
  status: 'status',
} as const;

export const UNIT_TYPES = {
  artillery: 'artillery',
  cavalry: 'cavalry',
  infantry: 'infantry',
} as const;

export const LOCATION_TYPES = {
  africa: 'africa',
  americas: 'americas',
  antarctica: 'antarctica',
  asia: 'asia',
  australia: 'australia',
  europe: 'europe',
} as const;
