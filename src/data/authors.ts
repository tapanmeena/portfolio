export interface Experience {
  title: string;
  company: string;
  period: string;
  description?: string;
}

export interface SkillCategory {
  name: string;
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
    bio: "Senior Software Engineer with 5+ years of experience in designing and developing scalable software solutions. Currently working at MAQ Software, where I lead cross-functional teams and drive technical excellence across projects. Passionate about mentoring junior developers and implementing best practices that enhance team productivity and code quality.",
    social: {
      twitter: "https://twitter.com/tapanmeena3",
      github: "https://github.com/tapanmeena",
      linkedin: "https://www.linkedin.com/in/tapanmeena/",
      website: "https://tapanmeena.com",
    },
    skills: [
      {
        name: "Languages",
        skills: [
          "C#",
          "TypeScript",
          "JavaScript",
          "Python",
          "SQL",
          "PowerShell",
        ],
      },
      {
        name: "Frontend",
        skills: ["React", "HTML5", "CSS3", "Tailwind CSS", "Astro"],
      },
      {
        name: "Backend",
        skills: [".NET", "ASP.NET", "Node.js", "REST APIs"],
      },
      {
        name: "Cloud & DevOps",
        skills: ["Azure", "Docker", "Azure DevOps"],
      },
      {
        name: "Databases",
        skills: ["SQL Server", "PostgreSQL", "MongoDB"],
      },
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "MAQ Software",
        period: "July 2020 - Present",
        description:
          "Developing scalable web applications, leading cross-functional teams, and implementing cloud technologies & DevOps practices.",
      },
      {
        title: "Technical Intern",
        company: "McAfee",
        period: "May 2019 - July 2019",
        description:
          "Worked on cybersecurity technologies and enterprise-level software development.",
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
