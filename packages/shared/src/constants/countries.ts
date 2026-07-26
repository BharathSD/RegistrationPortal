export interface CountryDialCode {
  name: string;
  /** ISO 3166-1 alpha-2 code — also used to derive the flag emoji (regional indicator symbols). */
  iso2: string;
  /** E.164 calling code, without the leading "+". */
  dialCode: string;
}

/**
 * India first (this platform's primary market), then the rest alphabetically
 * by country name. Not exhaustive — a curated list covering the countries
 * players/organizers are actually likely to select, rather than the full
 * ITU-T E.164 assignment table. A few dial codes are genuinely shared by
 * multiple countries (e.g. +1 for both the US and Canada); there's no way to
 * disambiguate from the dial code alone, so picking either is fine.
 */
export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { name: "India", iso2: "IN", dialCode: "91" },
  { name: "Afghanistan", iso2: "AF", dialCode: "93" },
  { name: "Australia", iso2: "AU", dialCode: "61" },
  { name: "Bahrain", iso2: "BH", dialCode: "973" },
  { name: "Bangladesh", iso2: "BD", dialCode: "880" },
  { name: "Belgium", iso2: "BE", dialCode: "32" },
  { name: "Bhutan", iso2: "BT", dialCode: "975" },
  { name: "Brazil", iso2: "BR", dialCode: "55" },
  { name: "Canada", iso2: "CA", dialCode: "1" },
  { name: "China", iso2: "CN", dialCode: "86" },
  { name: "Denmark", iso2: "DK", dialCode: "45" },
  { name: "Egypt", iso2: "EG", dialCode: "20" },
  { name: "Fiji", iso2: "FJ", dialCode: "679" },
  { name: "France", iso2: "FR", dialCode: "33" },
  { name: "Germany", iso2: "DE", dialCode: "49" },
  { name: "Hong Kong", iso2: "HK", dialCode: "852" },
  { name: "Indonesia", iso2: "ID", dialCode: "62" },
  { name: "Ireland", iso2: "IE", dialCode: "353" },
  { name: "Italy", iso2: "IT", dialCode: "39" },
  { name: "Japan", iso2: "JP", dialCode: "81" },
  { name: "Kenya", iso2: "KE", dialCode: "254" },
  { name: "Kuwait", iso2: "KW", dialCode: "965" },
  { name: "Malaysia", iso2: "MY", dialCode: "60" },
  { name: "Maldives", iso2: "MV", dialCode: "960" },
  { name: "Nepal", iso2: "NP", dialCode: "977" },
  { name: "Netherlands", iso2: "NL", dialCode: "31" },
  { name: "New Zealand", iso2: "NZ", dialCode: "64" },
  { name: "Nigeria", iso2: "NG", dialCode: "234" },
  { name: "Oman", iso2: "OM", dialCode: "968" },
  { name: "Pakistan", iso2: "PK", dialCode: "92" },
  { name: "Philippines", iso2: "PH", dialCode: "63" },
  { name: "Qatar", iso2: "QA", dialCode: "974" },
  { name: "Saudi Arabia", iso2: "SA", dialCode: "966" },
  { name: "Singapore", iso2: "SG", dialCode: "65" },
  { name: "South Africa", iso2: "ZA", dialCode: "27" },
  { name: "South Korea", iso2: "KR", dialCode: "82" },
  { name: "Sri Lanka", iso2: "LK", dialCode: "94" },
  { name: "Sweden", iso2: "SE", dialCode: "46" },
  { name: "Switzerland", iso2: "CH", dialCode: "41" },
  { name: "Thailand", iso2: "TH", dialCode: "66" },
  { name: "United Arab Emirates", iso2: "AE", dialCode: "971" },
  { name: "United Kingdom", iso2: "GB", dialCode: "44" },
  { name: "United States", iso2: "US", dialCode: "1" },
  { name: "Zimbabwe", iso2: "ZW", dialCode: "263" },
];

/** Regional-indicator-symbol flag emoji derived from an ISO 3166-1 alpha-2 code — no image assets needed. */
export function flagEmoji(iso2: string): string {
  return String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)));
}

export const DEFAULT_COUNTRY_ISO2 = "IN";
