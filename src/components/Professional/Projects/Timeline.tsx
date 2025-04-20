"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaExternalLinkAlt,
  FaGithub,
  FaGlobe,
  FaChevronDown,
  FaChevronUp,
  FaUsers,
  FaUser,
  FaCalendarAlt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFilter,
} from "react-icons/fa"; // Using react-icons

import { projectsData } from "@/data/ProjectsData"; // Corrected import path

// Define the Project type (assuming it's defined correctly in ProjectsData.ts or here)
export type Project = {
  // Export the type
  id: string;
  title: string;
  description: string;
  details?: string;
  date: string;
  status: "Current" | "Completed" | "Archived" | "In Progress";
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

type FilterType = "all" | "projects" | "tests";
type SortDirection = "newest" | "oldest";

/**
 *
 */
export default function ProjectTimeline() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("newest");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

  // Refs for scroll animations and anchor navigation
  const projectsRef = useRef<HTMLDivElement>(null);
  const testsRef = useRef<HTMLDivElement>(null);

  // Filter and sort projects
  useEffect(() => {
    let filtered = [...projectsData];

    // Apply filter
    if (filter === "projects") {
      filtered = filtered.filter((project) => project.type === "project");
    } else if (filter === "tests") {
      filtered = filtered.filter((project) => project.type === "test");
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredProjects(filtered);
  }, [filter, sortDirection]);

  // Toggle project expansion
  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Scroll to section
  const scrollToSection = (section: "projects" | "tests") => {
    const ref = section === "projects" ? projectsRef : testsRef;
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get projects and tests
  const mainProjects = filteredProjects.filter((p) => p.type === "project");
  const technicalTests = filteredProjects.filter((p) => p.type === "test");

  return (
    <div className="space-y-8 container mx-auto p-4">
      {/* Controls */}
      <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-base-300 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Project Timeline</h2>

          {/* Filter Dropdown */}
          <div className="dropdown dropdown-end">
            <button className="btn btn-outline btn-sm gap-1" tabIndex={0}>
              <FaFilter size={16} />
              {filter === "all"
                ? "All"
                : filter === "projects"
                ? "Main Projects"
                : "Technical Tests"}
            </button>
            <ul
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[1]"
              tabIndex={0}>
              <li>
                <button onClick={() => setFilter("all")}>All</button>
              </li>
              <li>
                <button onClick={() => setFilter("projects")}>
                  Main Projects
                </button>
              </li>
              <li>
                <button onClick={() => setFilter("tests")}>
                  Technical Tests
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Toggle */}
          <button
            className="btn btn-outline btn-sm gap-1"
            onClick={() =>
              setSortDirection((prev) =>
                prev === "newest" ? "oldest" : "newest"
              )
            }>
            {sortDirection === "newest" ? (
              <FaSortAmountDown size={16} />
            ) : (
              <FaSortAmountUp size={16} />
            )}
            {sortDirection === "newest" ? "Newest First" : "Oldest First"}
          </button>

          {/* Quick Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => scrollToSection("projects")}>
              #projects
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => scrollToSection("tests")}>
              #tests
            </button>
          </div>
        </div>
      </div>

      {/* Main Projects Section */}
      {(filter === "all" || filter === "projects") &&
        mainProjects.length > 0 && (
          <div className="relative" id="projects" ref={projectsRef}>
            <h2 className="text-xl font-semibold mb-6 text-base-content flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
                <FaUsers size={18} />
              </span>
              Main Projects
            </h2>

            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-base-300 hidden md:block" />

              <div className="space-y-6">
                {mainProjects.map((project) => (
                  <TimelineItem
                    isActive={project.status === "Current"}
                    isExpanded={expandedProjects.has(project.id)}
                    key={project.id}
                    project={project}
                    onToggleExpand={() => toggleExpand(project.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Technical Tests Section */}
      {(filter === "all" || filter === "tests") &&
        technicalTests.length > 0 && (
          <div className="relative pt-4" id="tests" ref={testsRef}>
            <h2 className="text-xl font-semibold mb-6 text-base-content flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
                <FaUser size={18} />
              </span>
              Technical Tests
            </h2>

            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-base-300 hidden md:block" />

              <div className="space-y-6">
                {technicalTests.map((test) => (
                  <TimelineItem
                    isActive={false} // Tests are never 'Current' in this context
                    isExpanded={expandedProjects.has(test.id)}
                    key={test.id}
                    project={test}
                    onToggleExpand={() => toggleExpand(test.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-base-content/70">
            No projects found with the current filter.
          </p>
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  project,
  isExpanded,
  onToggleExpand,
  isActive,
}: {
  project: Project;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isActive: boolean;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  // Format date
  const formattedDate = new Date(project.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Animation on scroll (simple opacity transition)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-4");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = itemRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      className="relative opacity-0 translate-y-4 transition-all duration-500"
      ref={itemRef}>
      {/* Timeline dot */}
      <div
        className={`absolute left-4 top-6 w-3 h-3 rounded-full transform -translate-x-1.5 hidden md:block ${
          isActive ? "bg-success" : "bg-base-300"
        }`}
      />

      {/* Using DaisyUI Card */}
      <div
        className={`card ml-0 md:ml-10 overflow-hidden transition-all bg-base-100 shadow-md hover:shadow-lg border ${
          isActive ? "border-success" : "border-base-300"
        }`}>
        <div className="card-body p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="card-title text-lg">{project.title}</h3>

                {/* Status Badge */}
                <div
                  className={`badge ${
                    isActive ? "badge-success" : "badge-outline"
                  }`}>
                  {project.status}
                </div>
              </div>

              <p className="text-base-content/80 mt-2">{project.description}</p>

              <div className="flex flex-wrap gap-3 mt-3">
                {/* Date */}
                <div className="flex items-center text-sm text-base-content/70">
                  <FaCalendarAlt className="mr-1" size={16} />
                  {formattedDate}
                </div>

                {/* Collaborators */}
                {project.collaborators && (
                  <div className="flex items-center text-sm text-base-content/70">
                    {project.collaborators.length === 1 &&
                    project.collaborators[0].toLowerCase() === "solo" ? (
                      <FaUser className="mr-1" size={16} />
                    ) : (
                      <FaUsers className="mr-1" size={16} />
                    )}
                    {project.collaborators.join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* External Links & Toggle Button */}
            <div className="flex items-center gap-2 mt-3 md:mt-0">
              {project.links?.github && (
                <a
                  className="btn btn-ghost btn-circle btn-sm"
                  href={project.links.github}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="GitHub Repository">
                  <FaGithub size={18} />
                  <span className="sr-only">GitHub</span>
                </a>
              )}

              {project.links?.demo && (
                <a
                  className="btn btn-ghost btn-circle btn-sm"
                  href={project.links.demo}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Live Demo">
                  <FaGlobe size={18} />
                  <span className="sr-only">Live Demo</span>
                </a>
              )}

              <button
                className="btn btn-ghost btn-sm ml-2"
                title={isExpanded ? "Show less" : "Show more"}
                onClick={onToggleExpand}>
                {isExpanded ? (
                  <FaChevronUp size={18} />
                ) : (
                  <FaChevronDown size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-base-200 animate-fade-in duration-300">
              {" "}
              {/* Basic fade-in */}
              {/* Tech Stack */}
              {project.techStack && project.techStack.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-base-content/90 mb-2">
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <div className="badge badge-neutral" key={tech}>
                        {" "}
                        {/* DaisyUI badge */}
                        {tech}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Detailed Description */}
              {project.details && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-base-content/90 mb-2">
                    Details
                  </h4>
                  <p className="text-base-content/80 text-sm">
                    {project.details}
                  </p>
                </div>
              )}
              {/* Challenges */}
              {project.challenges && project.challenges.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-base-content/90 mb-2">
                    Challenges
                  </h4>
                  <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                    {project.challenges.map((challenge) => (
                      <li key={challenge}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Blog Posts */}
              {project.blogPosts && project.blogPosts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-base-content/90 mb-2">
                    Related Articles
                  </h4>
                  <ul className="space-y-1">
                    {project.blogPosts.map((post) => (
                      <li key={post.url}>
                        <a
                          className="text-sm text-primary hover:text-primary-focus hover:underline flex items-center"
                          href={post.url}
                          rel="noopener noreferrer"
                          target="_blank">
                          {post.title}
                          <FaExternalLinkAlt className="ml-1" size={14} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Additional Links */}
              {project.links?.other && project.links.other.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-base-content/90 mb-2">
                    Additional Resources
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.links.other.map((link) => (
                      <a
                        className="btn btn-xs btn-outline gap-1" // DaisyUI button for links
                        href={link.url}
                        key={link.url}
                        rel="noopener noreferrer"
                        target="_blank">
                        {link.label}
                        <FaExternalLinkAlt size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
