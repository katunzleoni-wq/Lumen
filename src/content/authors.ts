import authorsJson from "../../content/authors.json";
import type { Locale } from "@/i18n";

export type LocalizedCopy = Record<Locale, string>;

export interface AuthorProfile {
  id: string;
  name: string;
  fullName: string;
  years: string;
  country: string;
  publisher: string;
  officialUrl: string;
  role: LocalizedCopy;
  summary: LocalizedCopy;
  rightsNote: LocalizedCopy;
}

export const protectedAuthors = authorsJson.authors as AuthorProfile[];
