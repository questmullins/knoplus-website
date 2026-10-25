import { getProject } from "./project-catalog";
import { services, serviceOverview, type ServiceItem } from "./services";

const banner = (name: string) => `url('/revamp/banners/${name}.webp')`;
const rose = (name: string) => `url('/revamp/rosewave-gallery/photos/${name}-01.webp')`;
const projectBanners: Record<string, string[]> = {
  rosewave: [rose("blush-of-autumn"), rose("nyc550"), rose("dreaming-of-a-wave")],
  update: [banner("update"), banner("prepress"), banner("date-evening"), banner("journey"), banner("phone")],
  textualize: [banner("textualize"), banner("phone"), banner("colour")],
  instapost: [banner("instapost"), rose("nyc550"), banner("websites")],
  freestyle: [banner("freestyle"), banner("process"), banner("web-apps")],
  websites: [banner("websites"), banner("web-services"), banner("instapost")],
  "prepress-assistant": [banner("prepress")],
};

export function indexServices(items: ServiceItem[], ancestors: string[] = []): { item: ServiceItem; ancestors: string[] }[] {
  return items.flatMap(item => [{ item, ancestors }, ...indexServices(item.children || [], [...ancestors, item.id])]);
}

export function buildShowcase(slug?: string) {
  if (!slug) {
    const entries = indexServices(services);
    return { navigation: services, entries, overview: serviceOverview, panels: [serviceOverview, ...entries.filter(e => !e.item.children).map(e => e.item)], mobilePanels: [serviceOverview, ...entries.map(e => e.item)], project: undefined };
  }
  const project = getProject(slug);
  const images = projectBanners[slug];
  const panels: ServiceItem[] = project.panes.map((pane, index) => ({
    id: `${slug}--${index + 1}`, name: pane.name, titleText: pane.title,
    label: `${project.name} / ${pane.name}`, description: pane.text, note: pane.note,
    image: images[index % images.length], photos: pane.photos,
    platform: project.action.kind === "store" ? "android" : undefined,
    ...(project.action.kind === "link" ? { href: slug === "websites" ? "/revamp#websites" : project.action.href, action: project.action.label }
      : project.relatedLink ? { href: project.relatedLink.href, action: "Explore the gallery & shop" } : {}),
  }));
  const parent: ServiceItem = { id: slug, name: project.name, label: project.name, description: project.panes[0].text, image: images[0], children: panels };
  let found = false;
  function replace(items: ServiceItem[]): ServiceItem[] {
    return items.map(item => {
      if (item.id === slug) { found = true; return parent; }
      return item.children ? { ...item, children: replace(item.children) } : item;
    });
  }
  const navigation = replace(services);
  if (!found) {
    navigation.push(parent);
  }
  return { navigation, entries: indexServices(navigation), overview: panels[0], panels, mobilePanels: panels, project };
}
