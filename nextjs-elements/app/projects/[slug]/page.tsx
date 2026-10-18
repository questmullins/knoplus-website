import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/ProjectPage";
import { getProject, projectPages } from "@/data/projects";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return projectPages.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return {};
  }

  return {
    title: `${project.navTitle}: ${project.kind}`,
    description: project.description,
    alternates: {
      canonical: `/projects/${project.slug}`
    },
    openGraph: {
      title: `${project.navTitle} | Knoplus`,
      description: project.description,
      url: `https://kno.plus/projects/${project.slug}`
    }
  };
}

export default async function ProjectRoute({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project || !project.href.startsWith("/projects/")) {
    notFound();
  }

  return <ProjectPage project={project} />;
}
