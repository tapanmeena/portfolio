export interface Experience {
  title: string;
  company: string;
  period: string;
  location?: string;
  description?: string;
  skills?: string[];
}

export interface SkillCategory {
  name: string;
  description?: string;
  icon?: string;
  skills: string[];
}

export interface Author {
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  title?: string;
  location?: string;
  email?: string;
  phone?: string;
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  skills?: SkillCategory[];
  experience?: Experience[];
}

export const authors: Record<string, Author> = {
  "tapan-meena": {
    name: "Tapan Meena",
    slug: "tapan-meena",
    avatar: "/images/authors/tapan-meena/avatar.png",
    title: "Senior Software Engineer",
    location: "Hyderabad, India",
    email: "tapanmeena1998@gmail.com",
    bio: "Senior Software Engineer with 6+ years of experience in designing and developing scalable software solutions. Currently working at MAQ Software, where I lead cross-functional teams and drive technical excellence across projects. Passionate about mentoring junior developers and implementing best practices that enhance team productivity and code quality.",
    social: {
      twitter: "https://twitter.com/tapanmeena3",
      github: "https://github.com/tapanmeena",
      linkedin: "https://www.linkedin.com/in/tapanmeena/",
      website: "https://tapanmeena.com",
    },
    skills: [
      {
        name: "Programming Languages",
        description: "Core programming languages I work with",
        icon: "code",
        skills: [
          "C#",
          "JavaScript",
          "TypeScript",
          "Python",
          "SQL",
          "PowerShell",
          "Bash",
        ],
      },
      {
        name: "Frontend Development",
        description: "Modern frontend technologies and frameworks",
        icon: "globe",
        skills: ["React", "HTML5", "CSS3", "Tailwind CSS", "SPA"],
      },
      {
        name: "Backend Development",
        description: "Server-side technologies and architectures",
        icon: "server",
        skills: [".NET", "ASP.NET", "Node.js", "REST APIs", "Microservices"],
      },
      {
        name: "Cloud & DevOps",
        description: "Cloud platforms and deployment strategies",
        icon: "cloud",
        skills: ["Microsoft Azure", "Docker", "Azure DevOps", "Git"],
      },
      {
        name: "Databases",
        description: "Database technologies and data management",
        icon: "database",
        skills: [
          "SQL Server",
          "PostgreSQL",
          "MongoDB",
          "Redis",
          "Azure SQL",
          "Database Design",
        ],
      },
      {
        name: "Tools & Frameworks",
        description: "Development tools and productivity frameworks",
        icon: "settings",
        skills: ["VS Code", "Git", "Postman", "Swagger"],
      },
      {
        name: "Soft Skills",
        description: "Leadership and collaboration abilities",
        icon: "users",
        skills: [
          "Team Leadership",
          "Mentoring",
          "Agile/Scrum",
          "Problem Solving",
          "Communication",
          "Project Management",
        ],
      },
      {
        name: "Other Technologies",
        description: "Additional technologies and concepts",
        icon: "layers",
        skills: [
          "Data Analysis",
          "Power BI",
          "Automation",
          "Testing",
          "Performance Optimization",
        ],
      },
    ],
    experience: [
      {
        title: "Project Lead",
        company: "MAQ Software",
        period: "Mar 2026 - Present",
        description:
          "Leading project delivery for enterprise data platform engagements — owning architecture decisions, sprint planning, stakeholder communication, and the technical health of the team.",
      },
      {
        title: "Senior Software Engineer 2",
        company: "MAQ Software",
        period: "Sep 2024 - Mar 2026",
        location: "On-site",
        description:
          "Drove delivery of customer-facing web applications end-to-end — architecture, code review, mentoring, and shipping production releases on tight cycles.",
        skills: ["TypeScript", "React.js", ".NET", "Azure", "SQL"],
      },
      {
        title: "Senior Software Engineer",
        company: "MAQ Software",
        period: "Sep 2023 - Aug 2024",
        description:
          "Owned features across the stack on data-heavy enterprise applications. Set up code-quality and CI/CD baselines that the team still uses.",
        skills: [
          "TypeScript",
          "React.js",
          ".NET",
          "Azure DevOps",
          "SQL Server",
        ],
      },
      {
        title: "Software Engineer 2",
        company: "MAQ Software",
        period: "Sep 2022 - Aug 2023",
        description:
          "Built and maintained React + .NET features across multiple Microsoft engagements. Started mentoring incoming engineers and running tech-talk sessions.",
        skills: ["TypeScript", "React.js", ".NET", "REST APIs"],
      },
      {
        title: "Software Engineer",
        company: "MAQ Software",
        period: "Jul 2020 - Aug 2022",
        location: "Hyderabad, Telangana, India",
        description:
          "First role out of college. Shipped backend features, wrote a lot of SQL, and learned what production-grade software actually looks like.",
        skills: ["SQL", "C#", "ASP.NET"],
      },
      {
        title: "Technical Intern",
        company: "McAfee",
        period: "May 2019 - Jul 2019",
        description:
          "Worked on cybersecurity tooling and enterprise-level software development.",
      },
    ],
  },
};

/**
 * Get author data by name string from frontmatter
 * Falls back to a default author object if not found
 */
export const getAuthorByName = (name: string): Author => {
  // Convert name to slug format for lookup
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  if (authors[slug]) {
    return authors[slug];
  }

  return {
    name,
    slug,
    avatar: "/images/authors/default.svg",
    bio: "",
  };
};
