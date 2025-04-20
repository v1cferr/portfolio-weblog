import type { Project } from "@/components/Professional/Projects/Timeline"; // Import the type

export const projectsData: Project[] = [
  // Add explicit type
  {
    id: "1",
    title: "E-commerce Platform Redesign",
    description:
      "Complete redesign of the customer-facing e-commerce platform with improved UX.",
    details:
      "Led the redesign of a major e-commerce platform serving over 50,000 monthly users. Implemented a new design system, improved checkout flow, and optimized for mobile devices, resulting in a 23% increase in conversion rate.",
    date: "2025-03-30",
    status: "Current",
    collaborators: ["Me", "César", "Maria"],
    links: {
      github: "https://github.com/username/ecommerce-platform",
      demo: "https://example.com/ecommerce",
      other: [
        { label: "Design System", url: "https://example.com/design-system" },
        { label: "Case Study", url: "https://example.com/case-study" },
      ],
    },
    techStack: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Stripe API"],
    challenges: [
      "Migrating from a legacy codebase without disrupting active users",
      "Implementing a responsive design that works across all device sizes",
      "Optimizing performance for users with slow internet connections",
    ],
    blogPosts: [
      {
        title: "How We Improved Checkout Conversion by 23%",
        url: "https://example.com/blog/checkout-conversion",
      },
      {
        title: "Building Accessible E-commerce Experiences",
        url: "https://example.com/blog/accessibility",
      },
    ],
    type: "project",
  },
  {
    id: "2",
    title: "Personal Portfolio Website",
    description:
      "Built a responsive portfolio website to showcase my projects and skills.",
    details:
      "Designed and developed a personal portfolio website to showcase my work and skills. The site features a clean, minimalist design with a focus on performance and accessibility.",
    date: "2025-02-15",
    status: "Completed",
    collaborators: ["Solo"],
    links: {
      github: "https://github.com/username/portfolio",
      demo: "https://example.com/portfolio",
    },
    techStack: ["React", "Next.js", "Framer Motion", "Tailwind CSS"],
    challenges: [
      "Creating engaging animations without sacrificing performance",
      "Implementing a dark mode that respects user preferences",
    ],
    type: "project",
  },
  {
    id: "3",
    title: "Task Management Application",
    description:
      "Developed a task management application with drag-and-drop functionality.",
    details:
      "Built a collaborative task management tool with real-time updates, drag-and-drop functionality, and team collaboration features. The application helps teams organize their work and track progress on projects.",
    date: "2024-12-10",
    status: "Completed",
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
    description:
      "Created a weather dashboard that displays current conditions and forecasts.",
    details:
      "Developed a weather dashboard that provides current conditions and forecasts for multiple locations. Users can save their favorite locations and view detailed weather information.",
    date: "2024-09-05",
    status: "Archived",
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
    description:
      "Built a responsive product catalog with filtering and sorting capabilities.",
    details:
      "Completed a technical assessment for a frontend developer position. The task was to build a responsive product catalog with filtering, sorting, and search functionality using a provided API.",
    date: "2024-11-20",
    status: "Completed",
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
    description:
      "Optimized a slow-performing React application by implementing memoization and code splitting.",
    details:
      "Participated in a performance optimization challenge where the goal was to improve the performance of a slow React application. Implemented memoization, code splitting, and other optimization techniques.",
    date: "2024-08-15",
    status: "Completed",
    collaborators: ["Solo"],
    links: {
      github: "https://github.com/username/react-performance",
      demo: "https://example.com/test2",
    },
    techStack: [
      "React",
      "React.memo",
      "React.lazy",
      "Lighthouse",
      "Web Vitals",
    ],
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
