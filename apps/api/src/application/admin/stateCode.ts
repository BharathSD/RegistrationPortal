/**
 * Best-effort free-text Indian state name -> 2-letter code, used only to
 * build the human-readable Player ID (CKT-<STATE>-<YY>-<SEQ>). Falls back to
 * the first two letters of whatever the player entered for states/countries
 * outside this list — extend this map as the platform's footprint grows.
 */
const STATE_CODES: Record<string, string> = {
  "andhra pradesh": "AP",
  "arunachal pradesh": "AR",
  assam: "AS",
  bihar: "BR",
  chhattisgarh: "CG",
  goa: "GA",
  gujarat: "GJ",
  haryana: "HR",
  "himachal pradesh": "HP",
  jharkhand: "JH",
  karnataka: "KA",
  kerala: "KL",
  "madhya pradesh": "MP",
  maharashtra: "MH",
  manipur: "MN",
  meghalaya: "ML",
  mizoram: "MZ",
  nagaland: "NL",
  odisha: "OD",
  punjab: "PB",
  rajasthan: "RJ",
  sikkim: "SK",
  "tamil nadu": "TN",
  telangana: "TS",
  tripura: "TR",
  "uttar pradesh": "UP",
  uttarakhand: "UK",
  "west bengal": "WB",
  delhi: "DL",
};

export function stateCodeFromName(stateName: string): string {
  const known = STATE_CODES[stateName.trim().toLowerCase()];
  if (known) return known;
  const letters = stateName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 2) || "XX").padEnd(2, "X");
}
