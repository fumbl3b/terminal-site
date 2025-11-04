import { Mail, Linkedin, ExternalLink, Download } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { SkillCategory, ExperienceItem, Project } from '../data/portfolio';
import type { ThemeTokens } from '../types/theme';

type AllContentViewProps = {
  theme: ThemeTokens;
  onReturnToTerminal: () => void;
  profile: {
    name: string;
    tagLine: string;
    heroSummary: string;
    location: string;
    availability: string;
  };
  skills: SkillCategory[];
  experiences: ExperienceItem[];
  projects: Project[];
  contactLinks: { label: string; href: string }[];
  resumeAsset: { file: string; downloadName: string; lastUpdated: string };
};

const contactIcon = {
  Email: Mail,
  LinkedIn: Linkedin,
};

export function AllContentView({
  theme,
  onReturnToTerminal,
  profile,
  skills,
  experiences,
  projects,
  contactLinks,
  resumeAsset,
}: AllContentViewProps) {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-4 py-10 md:px-8"
      style={{ color: theme.bodyText }}
    >
      <section
        className="relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-[radial-gradient(circle_at_top,var(--hero-highlight)_0%,transparent_60%)] p-6 md:p-10"
        style={
          {
            '--hero-highlight': theme.heroAccent,
            backgroundColor: theme.heroBg,
          } as CSSProperties
        }
      >
        <div className="relative z-10 space-y-6">
          <span
            className="inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest"
            style={{ background: `${theme.accent}15`, color: theme.accent }}
          >
            {profile.location}
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{profile.name}</h1>
            <p className="text-lg text-white/80">{profile.tagLine}</p>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-white/75">{profile.heroSummary}</p>
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <span className="rounded-full border border-white/10 px-4 py-1">{profile.availability}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/50" />
      </section>

      <section className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-6">
        <h2 className="text-lg font-semibold text-white">Skills</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {skills.map((category) => (
            <div key={category.title} className="space-y-3">
              <h3 className="text-sm uppercase tracking-wide text-neutral-400">{category.title}</h3>
              <div className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <span
                    key={item}
                    className="rounded border border-neutral-700/70 bg-neutral-900 px-2.5 py-1 text-xs uppercase tracking-wide text-neutral-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-white">Recent Experience</h2>
        <div className="space-y-6">
          {experiences.map((experience) => (
            <article
              key={`${experience.company}-${experience.role}`}
              className="relative flex flex-col gap-3 rounded-2xl border border-neutral-800/60 bg-neutral-950/80 p-6"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{experience.role}</h3>
                  <p className="text-sm uppercase tracking-wide text-neutral-400">{experience.company}</p>
                </div>
                <div className="text-sm text-neutral-400 md:text-right">
                  <div>{experience.period}</div>
                  <div>{experience.location}</div>
                </div>
              </div>
              <ul className="space-y-2 text-sm leading-relaxed text-neutral-300">
                {experience.responsibilities.map((responsibility) => (
                  <li key={responsibility} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
                    <span>{responsibility}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.name}
            className="group relative flex flex-col gap-4 rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-6 transition duration-300 hover:border-neutral-500/70 hover:bg-neutral-900/70"
          >
            <header>
              <h2 className="text-xl font-semibold text-white">{project.name}</h2>
              <p className="mt-1 text-sm uppercase tracking-wide text-neutral-400">{project.headline}</p>
            </header>
            <p className="text-sm leading-relaxed text-neutral-300">{project.description}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-400">
              {project.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-neutral-700/70 bg-neutral-900 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400"
                >
                  {item}
                </span>
              ))}
            </div>
            {project.liveUrl && (
              <div className="mt-auto text-sm">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/80 transition hover:text-white"
                  style={{ color: theme.accent }}
                >
                  <ExternalLink size={16} />
                  Live site
                </a>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Let&apos;s connect</h2>
          <div className="mt-4 space-y-3 text-sm">
            {contactLinks.map((link) => {
              const Icon = contactIcon[link.label as keyof typeof contactIcon] ?? ExternalLink;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-900/80 hover:text-white"
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <Icon size={18} className="text-neutral-500 group-hover:text-white" />
                  <span className="font-medium">{link.label}</span>
                  <ExternalLink size={14} className="ml-auto opacity-0 transition group-hover:opacity-100" />
                </a>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Resume</h2>
          <p className="mt-2 text-sm text-neutral-300">
            Download a PDF snapshot of my latest experience. Last updated {resumeAsset.lastUpdated}.
          </p>
          <a
            href={resumeAsset.file}
            download={resumeAsset.downloadName}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-neutral-500 hover:bg-neutral-800"
            style={{ color: theme.bodyText }}
          >
            <Download size={16} />
            Download resume
          </a>
        </div>
      </section>

      <button
        type="button"
        onClick={onReturnToTerminal}
        className="mx-auto mb-8 mt-auto inline-flex items-center gap-2 rounded-lg border border-neutral-700/70 bg-neutral-900 px-4 py-2 text-sm uppercase tracking-wide text-neutral-300 transition hover:border-neutral-500 hover:text-white"
        style={{ color: theme.accent, borderColor: `${theme.accent}80` }}
      >
        $ return-to-terminal
      </button>
    </div>
  );
}
