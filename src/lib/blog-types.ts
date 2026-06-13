/** Metadata van een blogpost (frontmatter). Los van de registry om import-cykels te vermijden. */
export interface BlogMeta {
  slug: string;
  title: string;
  /** Korte samenvatting: meta-description + excerpt op de indexpagina. */
  description: string;
  /** ISO-datum (yyyy-mm-dd). */
  date: string;
  readingMinutes: number;
  tags?: string[];
}
