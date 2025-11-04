export type SkillCategory = {
  title: string;
  items: string[];
};

export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  location: string;
  responsibilities: string[];
};

export type Project = {
  name: string;
  headline: string;
  description: string;
  highlights: string[];
  tech: string[];
  liveUrl?: string;
};

export const profile = {
  name: 'Harry Winkler',
  tagLine: 'Founding Developer • Software Engineer • AI tinkerer',
  heroSummary:
    'Full-stack product builder with a sweet spot for shipping polished mobile and AI-driven experiences. I mix pragmatic engineering with founder energy to take products from napkin sketch to production.',
  about:
    'Dynamic and results-driven Software Engineer and Founding Developer with extensive experience in full-stack, mobile, and cloud platforms. Specializes in designing and developing scalable, secure mobile applications for iOS and Android using Swift, Objective-C, Java, and Kotlin. Proven expertise in leading end-to-end product development and cloud deployment with AWS and GCP. Adept at Agile/Scrum methodologies, DevSecOps, and CI/CD pipelines. Successfully delivered high-quality mobile applications, optimizing performance and ensuring compliance with app store guidelines.',
  location: 'Philadelphia, PA',
  availability: 'Open to impactful product engineering roles and advisory work.'
};

export const skills: SkillCategory[] = [
  {
    title: 'Programming Languages',
    items: ['Kotlin', 'Java', 'Swift', 'Objective-C', 'TypeScript', 'Python', 'JavaScript'],
  },
  {
    title: 'Mobile Platforms',
    items: [
      'Android SDK',
      'Jetpack Compose',
      'SwiftUI',
      'React Native',
      'RoomDB',
      'Retrofit',
      'Coroutines',
    ],
  },
  {
    title: 'Web & Backend',
    items: ['React', 'Next.js', 'Node.js', 'Express', 'Flask', 'Django', 'Spring Boot'],
  },
  {
    title: 'Cloud & Data',
    items: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'Supabase'],
  },
  {
    title: 'DevOps & Tooling',
    items: ['GitHub Actions', 'Jenkins', 'Terraform', 'SonarQube', 'GraphQL', 'REST'],
  },
];

export const experiences: ExperienceItem[] = [
  {
    company: 'Fumble Labs',
    role: 'Founding Developer',
    period: 'Jan 2024 – Present',
    location: 'Philadelphia, PA',
    responsibilities: [
      'Bootstrapped Resum8, an AI resume optimizer, from prototype to revenue with Flask, Next.js, PostgreSQL, and Render/Vercel deployments.',
      'Shipped ATS keyword intelligence, job description parsing, and LaTeX PDF generation with a Lean but testable stack.',
      'Implemented secrets management, job queues, and CI/CD workflows to keep a tiny team shipping safely.',
    ],
  },
  {
    company: 'JPMorgan Chase & Co.',
    role: 'Software Engineer II, Reference Data',
    period: 'Aug 2023 – Jun 2024',
    location: 'Wilmington, DE',
    responsibilities: [
      'Modernized legacy Java services with Kotlin + Spring Boot layers, improving reliability and reducing compute spend.',
      'Partnered with product and data stewards to deliver React front-ends and REST APIs that serve thousands of internal users.',
    ],
  },
  {
    company: 'Wells Fargo',
    role: 'Android Developer',
    period: 'Dec 2021 – Jul 2023',
    location: 'Remote / San Francisco, CA',
    responsibilities: [
      'Rebuilt the flagship Android experience in native Kotlin, replacing WebView flows and improving Core Web Vitals by 25%.',
      'Led Compose adoption, architected modular feature squads, and wired analytics/monitoring for every feature launch.',
    ],
  },
];

export const projects: Project[] = [
  {
    name: 'Resum8',
    headline: 'AI Resume Optimizer for modern job hunts',
    description:
      'End-to-end platform that ingests resumes, scores them against job descriptions, and outputs LaTeX-polished PDFs ready for ATS systems.',
    highlights: [
      'Microservice split across Flask API, worker queue, and Next.js marketing site',
      'Keyword intelligence pipeline using OpenAI tools + custom heuristics',
      'Infrastructure-as-code with Render, Vercel, Supabase, and GitHub Actions',
    ],
    tech: ['Flask', 'Pandas', 'Next.js', 'Supabase', 'OpenAI API', 'Render', 'Vercel'],
    liveUrl: 'https://resum8.xyz',
  },
];

export const contactLinks = [
  { label: 'Email', href: 'mailto:harry@fumblebee.site' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/harry-winkler' },
];

export const resumeAsset = {
  file: '/Harry-Winkler.pdf',
  downloadName: 'Harrison-Winkler-Resume.pdf',
  lastUpdated: '2024',
};
