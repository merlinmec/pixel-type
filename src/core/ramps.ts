export const RAMPS = {
  ascii: ' .:-=+*#%@',
  'ascii-extended':
    ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
} as const;

export type RampCharset = keyof typeof RAMPS;
