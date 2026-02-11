import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

const dictionaries = {
  en,
  fr
};

export async function getDictionary(locale: string) {
  return dictionaries[locale as keyof typeof dictionaries] ?? dictionaries.en;
}
