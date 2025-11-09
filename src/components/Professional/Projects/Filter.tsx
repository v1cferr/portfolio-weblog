"use client";

import { FaFilter, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";

import type { FilterType, SortDirection } from "@/data/ProjectsData";
import type { FC } from "react";

interface IFilterProps {
  filter: FilterType;
  sortDirection: SortDirection;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: () => void;
  onScrollToSection: (section: "projects" | "tests") => void;
}

const FilterControls: FC<IFilterProps> = ({ filter, sortDirection, onFilterChange, onSortChange, onScrollToSection }) => {
  return (
    <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-base-300 flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Linha do Tempo</h2>

        {/* Dropdown de Filtro */}
        <div className="dropdown dropdown-end">
          <button className="btn btn-outline btn-sm gap-1" tabIndex={0}>
            <FaFilter size={16} />
            {filter === "all" ? "Todos" : filter === "projects" ? "Projetos Principais" : "Testes Técnicos"}
          </button>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[1]" tabIndex={0}>
            <li>
              <button onClick={() => onFilterChange("all")}>Todos</button>
            </li>
            <li>
              <button onClick={() => onFilterChange("projects")}>Projetos Principais</button>
            </li>
            <li>
              <button onClick={() => onFilterChange("tests")}>Testes Técnicos</button>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Botão de Ordenação */}
        <button className="btn btn-outline btn-sm gap-1" onClick={onSortChange}>
          {sortDirection === "newest" ? <FaSortAmountDown size={16} /> : <FaSortAmountUp size={16} />}
          {sortDirection === "newest" ? "Mais Recentes" : "Mais Antigos"}
        </button>

        {/* Navegação Rápida */}
        <div className="hidden sm:flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => onScrollToSection("projects")}>
            #projetos
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onScrollToSection("tests")}>
            #testes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
