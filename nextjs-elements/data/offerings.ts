import groups from "./offerings.json";

// Every offering the contact form can be about. The worker validates against the same JSON.
export const offeringGroups = groups;
export const offerings = groups.flatMap(group => group.options);

export function offeringLabel(id: string) {
  return offerings.find(option => option.id === id)?.label || "";
}

// Maps a showcase item or project slug to the offering a "Let's talk" should start on.
export function offeringFor(id = ""): string {
  if (id.startsWith("website-") || id === "websites") return "website-template";
  return offerings.some(option => option.id === id) ? id : "other";
}
