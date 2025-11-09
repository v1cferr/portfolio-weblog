// TODO: Conectar com a API do GitHub para buscar os repositórios
// TODO: Utilizar o Supabase para cachear os dados

export type FilterType = "all" | "projects" | "tests";
export type SortDirection = "newest" | "oldest";

export type Project = {
  id: string;
  title: string;
  description: string;
  details?: string;
  date: string;
  status: "Em Andamento" | "Completo" | "Arquivado";
  collaborators?: string[];
  links?: {
    github?: string;
    demo?: string;
    other?: { label: string; url: string }[];
  };
  techStack?: string[];
  challenges?: string[];
  blogPosts?: { title: string; url: string }[];
  type: "project" | "test";
};

export const projectsData: Project[] = [
  {
    id: "1",
    title: "SpendFlow (TCC & MVP)",
    description:
      "SpendFlow é o seu assistente financeiro automatizado – a ferramenta que transforma a gestão dos seus gastos em uma experiência simples, intuitiva e poderosa.",
    details:
      "SpendFlow integra automaticamente os seus extratos bancários e categoriza cada transação com inteligência, gerando dashboards dinâmicos e insights valiosos. O objetivo é dar controle total sobre os hábitos de consumo, economizando tempo e evitando anotações manuais. O nome SpendFlow representa a essência do nosso assistente financeiro, focado no controle dos gastos pessoais, enfatizando o monitoramento dos gastos do usuário e a fluidez do movimento financeiro.",
    date: "2025-03-09",
    status: "Em Andamento",
    collaborators: ["Eu", "César"],
    links: {
      github: "https://github.com/v1cferr/spendflow",
      other: [
        {
          label: "Documentação HackMD",
          url: "https://hackmd.io/@v1cferr/HJX-6Wos1l",
        },
        {
          label: "Repositório GitHub (privado)",
          url: "https://github.com/v1cferr/spendflow",
        },
        {
          label: "Gemini (IA Gen)",
          url: "https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br",
        },
      ],
    },
    techStack: ["Docker", "Dev Container", "APIs Bancárias", "Inteligência Artificial", "Google Sheets API"],
    challenges: [
      "Integração de APIs bancárias para coleta automática de dados",
      "Implementação de categorização inteligente usando IA",
      "Criação de dashboards interativos para visualização de dados financeiros",
      "Sistema de feedback para aprimoramento contínuo da categorização",
    ],
    type: "project",
  },

  {
    id: "2",
    title: "Personal Hub (Portfolio & Weblog)",
    description: "Built a responsive portfolio website to showcase my projects and skills.",
    details:
      "Designed and developed a personal portfolio website to showcase my work and skills. The site features a clean, minimalist design with a focus on performance and accessibility.",
    date: "2025-02-15",
    status: "Em Andamento",
    collaborators: ["Solo"],
    links: {
      github: "https://github.com/username/portfolio",
      demo: "https://example.com/portfolio",
    },
    techStack: ["React", "Next.js", "Framer Motion", "Tailwind CSS"],
    challenges: ["Creating engaging animations without sacrificing performance", "Implementing a dark mode that respects user preferences"],
    type: "project",
  },
  {
    id: "3",
    title: "Task Management Application",
    description: "Developed a task management application with drag-and-drop functionality.",
    details:
      "Built a collaborative task management tool with real-time updates, drag-and-drop functionality, and team collaboration features. The application helps teams organize their work and track progress on projects.",
    date: "2024-12-10",
    status: "Completo",
    collaborators: ["Me", "Alex", "Sarah"],
    links: {
      github: "https://github.com/username/task-manager",
      demo: "https://example.com/tasks",
    },
    techStack: ["React", "TypeScript", "Firebase", "React DnD", "Tailwind CSS"],
    challenges: [
      "Implementing real-time updates across multiple clients",
      "Designing an intuitive drag-and-drop interface",
      "Managing complex state across the application",
    ],
    blogPosts: [
      {
        title: "Building Real-time Applications with Firebase",
        url: "https://example.com/blog/firebase",
      },
    ],
    type: "project",
  },
  {
    id: "4",
    title: "Weather Dashboard",
    description: "Created a weather dashboard that displays current conditions and forecasts.",
    details:
      "Developed a weather dashboard that provides current conditions and forecasts for multiple locations. Users can save their favorite locations and view detailed weather information.",
    date: "2024-09-05",
    status: "Arquivado",
    collaborators: ["Solo"],
    links: {
      github: "https://github.com/username/weather-app",
      demo: "https://example.com/weather",
    },
    techStack: ["React", "OpenWeather API", "Chart.js", "Geolocation API"],
    challenges: [
      "Working with inconsistent data from the weather API",
      "Optimizing API calls to stay within rate limits",
      "Displaying complex weather data in an intuitive way",
    ],
    type: "project",
  },
  {
    id: "5",
    title: "Frontend Technical Assessment",
    description: "Built a responsive product catalog with filtering and sorting capabilities.",
    details:
      "Completed a technical assessment for a frontend developer position. The task was to build a responsive product catalog with filtering, sorting, and search functionality using a provided API.",
    date: "2024-11-20",
    status: "Completo",
    collaborators: ["Solo"],
    links: {
      github: "https://github.com/username/frontend-assessment",
      demo: "https://example.com/test1",
    },
    techStack: ["React", "TypeScript", "CSS Modules", "REST API"],
    challenges: [
      "Completing the assessment within a tight deadline",
      "Implementing efficient filtering and sorting algorithms",
      "Creating a responsive design that works on all devices",
    ],
    type: "test",
  },
  {
    id: "6",
    title: "React Performance Challenge",
    description: "Optimized a slow-performing React application by implementing memoization and code splitting.",
    details:
      "Participated in a performance optimization challenge where the goal was to improve the performance of a slow React application. Implemented memoization, code splitting, and other optimization techniques.",
    date: "2024-08-15",
    status: "Completo",
    collaborators: ["Solo"],
    links: {
      github: "https://github.com/username/react-performance",
      demo: "https://example.com/test2",
    },
    techStack: ["React", "React.memo", "React.lazy", "Lighthouse", "Web Vitals"],
    challenges: [
      "Identifying performance bottlenecks in a complex application",
      "Reducing bundle size without removing functionality",
      "Improving rendering performance for large lists",
    ],
    blogPosts: [
      {
        title: "Lessons Learned from Optimizing React Applications",
        url: "https://example.com/blog/react-optimization",
      },
    ],
    type: "test",
  },
];
