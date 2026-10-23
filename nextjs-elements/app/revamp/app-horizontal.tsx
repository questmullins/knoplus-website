import type { AppStory } from "./walkthroughs";
import type { ProjectPresentation } from "./project-catalog";
import { ServicesShowcase } from "./services-showcase";

// Canonical routes and the earlier /horizontal links share the current presentation.
export function AppHorizontal({ story }: { story: AppStory }) {
  return <ServicesShowcase key={story.slug} projectSlug={story.slug} />;
}

export function ProjectHorizontal({ project }: { project: ProjectPresentation }) {
  return <ServicesShowcase key={project.slug} projectSlug={project.slug} />;
}
