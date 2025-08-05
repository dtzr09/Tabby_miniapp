export const isLocal =
  process.env.NODE_ENV === "development" &&
  process.env.DATABASE_URL?.includes("postgresql://");
export const BOT_TOKEN =
  process.env.NODE_ENV === "development"
    ? process.env.TELEGRAM_LOCAL_BOT_TOKEN!
    : process.env.TELEGRAM_BOT_TOKEN!;
