"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, type FC } from "react";
import { FaExternalLinkAlt, FaGithub, FaGlobe, FaChevronDown, FaChevronUp, FaUsers, FaUser, FaCalendarAlt } from "react-icons/fa";

import FilterControls from "@/components/Professional/Projects/Filter";
import { projectsData } from "@/data/ProjectsData";

import type { Project, FilterType, SortDirection } from "@/data/ProjectsData";

interface ITimelineItemProps {
  project: Project;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isActive: boolean;
}

const TimelineItem: FC<ITimelineItemProps> = ({ project, isExpanded, onToggleExpand, isActive }) => {
  // Formata a data para pt-BR
  const formattedDate = new Date(project.date).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const contentVariants = {
    collapsed: { height: 0, opacity: 0, marginTop: 0, paddingTop: 0 },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      paddingTop: "1rem",
    },
  };

  return (
    <motion.div className="relative" initial="hidden" variants={cardVariants} viewport={{ once: true, amount: 0.1 }} whileInView="visible">
      {/* Timeline dot */}
      <div
        className={`absolute left-4 top-6 w-3 h-3 rounded-full transform -translate-x-1.5 hidden md:block ${
          isActive ? "bg-success" : "bg-base-300"
        }`}
      />

      {/* Usando Card do DaisyUI */}
      <div
        className={`card ml-0 md:ml-10 overflow-hidden bg-base-100 shadow-md hover:shadow-lg border ${
          isActive ? "border-success" : "border-base-300"
        }`}
      >
        <div className="card-body p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="card-title text-lg">{project.title}</h3>
                {/* Badge de Status */}
                <div className={`badge ${isActive ? "badge-success" : "badge-outline"}`}>{project.status}</div>
              </div>

              <p className="text-base-content/80 mt-2">{project.description}</p>

              <div className="flex flex-wrap gap-3 mt-3">
                {/* Data */}
                <div className="flex items-center text-sm text-base-content/70">
                  <FaCalendarAlt className="mr-1" size={16} />
                  {formattedDate}
                </div>

                {/* Colaboradores */}
                {project.collaborators && (
                  <div className="flex items-center text-sm text-base-content/70">
                    {project.collaborators.length === 1 && project.collaborators[0].toLowerCase() === "solo" ? (
                      <FaUser className="mr-1" size={16} />
                    ) : (
                      <FaUsers className="mr-1" size={16} />
                    )}
                    {project.collaborators.join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Links Externos & Botão de Expandir */}
            <div className="flex items-center gap-2 mt-3 md:mt-0">
              {project.links?.github && (
                <a
                  className="btn btn-ghost btn-circle btn-sm"
                  href={project.links.github}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Repositório GitHub"
                >
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
                  title="Demonstração"
                >
                  <FaGlobe size={18} />
                  <span className="sr-only">Demonstração</span>
                </a>
              )}

              <motion.button
                className="btn btn-ghost btn-sm ml-2"
                title={isExpanded ? "Mostrar menos" : "Mostrar mais"}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleExpand}
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: isExpanded ? -180 : 0, opacity: 0 }}
                    initial={{ rotate: isExpanded ? 0 : 180, opacity: 0 }}
                    key={isExpanded ? "up" : "down"}
                    transition={{ duration: 0.2 }}
                  >
                    {isExpanded ? <FaChevronUp size={18} /> : <FaChevronDown size={18} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Conteúdo Expandido */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                animate="expanded"
                className="overflow-hidden border-t border-base-200"
                exit="collapsed"
                initial="collapsed"
                key="content"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                variants={contentVariants}
              >
                {/* Tecnologias Utilizadas */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-base-content/90 mb-2">Tecnologias Utilizadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <div className="badge badge-neutral" key={tech}>
                          {tech}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Descrição Detalhada */}
                {project.details && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-base-content/90 mb-2">Detalhes</h4>
                    <p className="text-base-content/80 text-sm">{project.details}</p>
                  </div>
                )}
                {/* Desafios */}
                {project.challenges && project.challenges.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-base-content/90 mb-2">Desafios</h4>
                    <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                      {project.challenges.map((challenge) => (
                        <li key={challenge}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Posts de Blog */}
                {project.blogPosts && project.blogPosts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-base-content/90 mb-2">Artigos Relacionados</h4>
                    <ul className="space-y-1">
                      {project.blogPosts.map((post) => (
                        <li key={post.url}>
                          <a
                            className="text-sm text-primary hover:text-primary-focus hover:underline flex items-center gap-1"
                            href={post.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {post.title}
                            <FaExternalLinkAlt size={14} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Links Adicionais */}
                {project.links?.other && project.links.other.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-base-content/90 mb-2">Recursos Adicionais</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.links.other.map((link) => (
                        <a
                          className="btn btn-xs btn-outline gap-1"
                          href={link.url}
                          key={link.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {link.label}
                          <FaExternalLinkAlt size={14} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const ProjectTimeline: FC = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("newest");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Refs para navegação por âncora
  const projectsRef = useRef<HTMLDivElement>(null);
  const testsRef = useRef<HTMLDivElement>(null);

  // Filtra e ordena os projetos
  useEffect(() => {
    let filtered = [...projectsData];

    // Aplica o filtro
    if (filter === "projects") {
      filtered = filtered.filter((project) => project.type === "project");
    } else if (filter === "tests") {
      filtered = filtered.filter((project) => project.type === "test");
    }

    // Aplica a ordenação
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredProjects(filtered);
  }, [filter, sortDirection]);

  // Alterna a expansão do projeto
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

  // Rola para a seção
  const scrollToSection = (section: "projects" | "tests") => {
    const ref = section === "projects" ? projectsRef : testsRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Obtém projetos e testes
  const mainProjects = filteredProjects.filter((p) => p.type === "project");
  const technicalTests = filteredProjects.filter((p) => p.type === "test");

  // Handler para mudança de ordenação
  const handleSortChange = () => {
    setSortDirection((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  return (
    <div className="space-y-8 container mx-auto p-4">
      {/* Controles de Filtro e Ordenação */}
      {/* TODO: Migrar tudo relacionado ao filtro para /Projects/Filter.tsx */}
      <FilterControls
        filter={filter}
        sortDirection={sortDirection}
        onFilterChange={setFilter}
        onScrollToSection={scrollToSection}
        onSortChange={handleSortChange}
      />

      {/* Seção de Projetos Principais */}
      {(filter === "all" || filter === "projects") && mainProjects.length > 0 && (
        <div className="relative" id="projects" ref={projectsRef}>
          <h2 className="text-xl font-semibold mb-6 text-base-content flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
              <FaUsers size={18} />
            </span>
            Projetos Principais
          </h2>

          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-base-300 hidden md:block" />

            <div className="space-y-6">
              {mainProjects.map((project) => (
                <TimelineItem
                  isActive={project.status === "Em Andamento"}
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

      {/* Seção de Testes Técnicos */}
      {(filter === "all" || filter === "tests") && technicalTests.length > 0 && (
        <div className="relative pt-4" id="tests" ref={testsRef}>
          <h2 className="text-xl font-semibold mb-6 text-base-content flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
              <FaUser size={18} />
            </span>
            Testes Técnicos
          </h2>

          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-base-300 hidden md:block" />

            <div className="space-y-6">
              {technicalTests.map((test) => (
                <TimelineItem
                  isActive={false}
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

      {/* Estado Vazio */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-base-content/70">Nenhum projeto encontrado com o filtro atual.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectTimeline;
