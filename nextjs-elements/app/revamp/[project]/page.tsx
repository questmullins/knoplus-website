import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectHorizontal } from "../app-horizontal";
import { projectCatalog } from "../project-catalog";

export function generateStaticParams() {
  return projectCatalog.filter(project => !["update", "rosewave"].includes(project.slug))
    .map(project => ({ project: project.slug }));
}

export async function generateMetadata({ params }: {
  params: Promise<{ project: string }>;
}): Promise<Metadata> {
  const { project: slug } = await params;
  const project = projectCatalog.find(item => item.slug === slug);
  return {
    title: project?.name ?? "Project",
    description: project?.panes[0].text,
    alternates: { canonical: `/revamp/${slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function ProjectPage({ params }: {
  params: Promise<{ project: string }>;
}) {
  const { project: slug } = await params;
  const project = projectCatalog.find(item => item.slug === slug);
  if (!project) notFound();
  return <ProjectHorizontal key={project.slug} project={project} />;
}
