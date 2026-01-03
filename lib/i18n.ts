export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export async function getMessages(locale: string) {
  if (locale !== "en" && locale !== "fr") locale = defaultLocale;
  return (await import(`../messages/${locale}.json`)).default as Record<string, any>;
}

export function t(messages: any, key: string) {
  return key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), messages) ?? key;
}
