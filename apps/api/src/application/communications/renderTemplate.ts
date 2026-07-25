/** Replaces {{token}} placeholders — e.g. "Hi {{name}}, ..." — with values from the given map. Unknown tokens are left as-is rather than throwing, so a template typo never blocks an entire campaign send. */
export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => values[key] ?? match);
}
