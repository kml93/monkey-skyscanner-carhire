import { selectorsConfig } from '@config/selectors';

/**
 * Reads the total result count shown in Skyscanner's sort banner.
 */
export class ResultCountReader {
  private readonly document: Document;

  constructor(document: Document) {
    this.document = document;
  }

  /** Null when the banner is missing or its text has no count. */
  read(): number | null {
    const match = this.document
      .querySelector(selectorsConfig.banner.sortResults)
      ?.textContent
      ?.match(selectorsConfig.banner.resultCountPattern);

    return match ? Number.parseInt(match[1], 10) : null;
  }
}
