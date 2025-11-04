import { ChevronRight, Download, ExternalLink, Linkedin, Mail } from 'lucide-react';
import type { ReactNode } from 'react';

import { contactLinks, experiences, profile, projects, resumeAsset, skills } from '../data/portfolio';
import type { ThemeTokens } from '../types/theme';

type SectionProps = {
  theme: ThemeTokens;
  children: ReactNode;
  title: string;
};

const TerminalSection = ({ theme, children, title }: SectionProps) => (
  <section className="mb-8">
    <div className="flex items-center gap-2">
      <ChevronRight className="h-4 w-4" style={{ color: theme.accent }} />
      <h2 className="text-lg font-semibold" style={{ color: theme.bodyText }}>
        {title}
      </h2>
    </div>
    <div className="ml-6 mt-2 text-sm leading-relaxed" style={{ color: theme.bodyText }}>
      {children}
    </div>
  </section>
);

export const TerminalAbout = ({ theme }: { theme: ThemeTokens }) => (
  <TerminalSection theme={theme} title="About Me">
    <p className="text-base leading-relaxed text-neutral-200">{profile.about}</p>
  </TerminalSection>
);

export const TerminalProjects = ({ theme }: { theme: ThemeTokens }) => {
  const featuredProject = projects[0];
  if (!featuredProject) return null;

  return (
    <TerminalSection theme={theme} title="Featured Project">
      <div className="rounded-md border border-neutral-800/70 bg-neutral-900/60 p-4">
        <h3 className="text-base font-semibold text-white">{featuredProject.name}</h3>
        <p className="mt-1 text-sm uppercase tracking-wide text-neutral-400">{featuredProject.headline}</p>
        <p className="mt-3 text-sm text-neutral-300">{featuredProject.description}</p>
        <ul className="mt-3 space-y-1 text-sm text-neutral-400">
          {featuredProject.highlights.map((highlight) => (
            <li key={highlight}>• {highlight}</li>
          ))}
        </ul>
        {featuredProject.liveUrl && (
          <a
            href={featuredProject.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: theme.accent }}
          >
            <ExternalLink size={16} />
            View Live
          </a>
        )}
      </div>
    </TerminalSection>
  );
};

export const TerminalSkills = ({ theme }: { theme: ThemeTokens }) => (
  <TerminalSection theme={theme} title="Skills">
    <div className="space-y-4">
      {skills.map((category) => (
        <div key={category.title}>
          <h3 className="text-sm uppercase tracking-wide text-neutral-400"># {category.title}</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-neutral-300 md:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <span key={item} className="rounded border border-neutral-700/70 px-2 py-1">
                $ {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </TerminalSection>
);

export const TerminalExperience = ({ theme }: { theme: ThemeTokens }) => (
  <TerminalSection theme={theme} title="Recent Experience">
    <div className="space-y-4">
      {experiences.map((experience) => (
        <div key={`${experience.company}-${experience.role}`}>
          <div className="text-sm font-semibold text-white">
            {experience.role} @ {experience.company}
          </div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">
            {experience.period} • {experience.location}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-neutral-300">
            {experience.responsibilities.map((resp) => (
              <li key={resp}>- {resp}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </TerminalSection>
);

export const TerminalContact = ({ theme }: { theme: ThemeTokens }) => (
  <TerminalSection theme={theme} title="Contact">
    <div className="flex flex-col gap-2 text-sm text-neutral-300">
      {contactLinks.map((link) => {
        const Icon =
          {
            Email: Mail,
            LinkedIn: Linkedin,
          }[link.label as 'Email' | 'LinkedIn'] ?? ExternalLink;
        return (
          <a
            key={link.label}
            href={link.href}
            className="inline-flex items-center gap-2 text-neutral-200 transition hover:text-white"
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            <Icon size={16} />
            {link.label}
          </a>
        );
      })}
    </div>
  </TerminalSection>
);

export const TerminalDownload = ({ theme }: { theme: ThemeTokens }) => (
  <TerminalSection theme={theme} title="Download Resume">
    <div className="text-sm text-neutral-300">
      <p>Click below to download my resume (PDF).</p>
      <a
        href={resumeAsset.file}
        download={resumeAsset.downloadName}
        className="mt-3 inline-flex items-center gap-2 rounded border border-neutral-700/70 px-3 py-2 text-sm font-semibold text-white transition hover:border-neutral-500 hover:text-white"
        style={{ color: theme.accent, borderColor: `${theme.accent}80` }}
      >
        <Download size={16} />
        Download Resume
      </a>
    </div>
  </TerminalSection>
);

export const TerminalHelp = ({
  theme,
  commands,
}: {
  theme: ThemeTokens;
  commands: { name: string; description: string }[];
}) => (
  <TerminalSection theme={theme} title="Help">
    <div className="text-sm text-neutral-200">
      <p className="mb-2">Available commands:</p>
      <ul className="space-y-1">
        {commands.map((command) => (
          <li key={command.name}>
            <span className="font-semibold text-white">{command.name}</span> — {command.description}
          </li>
        ))}
      </ul>
    </div>
  </TerminalSection>
);
