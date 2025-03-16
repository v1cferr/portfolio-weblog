import Link from "next/link";

import { categories } from "@/data/TechStackData";

/**
 * Componente TechStack exibe uma grade responsiva mostrando a stack de tecnologias do desenvolvedor (eu || v1cferr)
 *
 * O componente organiza as tecnologias em categorias, cada uma apresentada como um card contendo:
 * - Um título e descrição da categoria
 * - Uma grade de itens tecnológicos com ícones e links para recursos relevantes
 *
 * Cada item de tecnologia apresenta:
 * - Um ícone com coloração customizada opcional
 * - Um link clicável que abre em uma nova aba
 * - Efeitos de hover para melhorar a interação do usuário
 *
 * O layout é responsivo e se ajusta de uma única coluna em dispositivos móveis para três colunas em telas maiores.
 *
 * @returns Um elemento section contendo a apresentação da stack de tecnologias
 */
export default function TechStack() {
  return (
    <section
      aria-labelledby="tech-stack-heading"
      className="py-12"
      id="tech-stack">
      <div className="container mx-auto px-4">
        <header className="mb-12">
          <h2
            className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            id="tech-stack-heading">
            Minha Stack
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <article
              className="card bg-base-100 shadow-lg hover:shadow-xl hover:ring-2 hover:ring-primary transition-all duration-300"
              key={category.title}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50 rounded-lg" />
              <div className="card-body relative z-10">
                <h3 className="card-title text-primary">{category.title}</h3>
                <p className="text-base-content/80 mb-4">
                  {category.description}
                </p>

                {/* Grid de itens */}
                <div className="grid grid-cols-3 gap-4">
                  {category.items.map((item) => (
                    <Link
                      aria-label={`${item.title} - ${category.title}`}
                      className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                      href={item.href}
                      key={item.title}
                      rel="noopener noreferrer"
                      target="_blank">
                      <div className="p-3 rounded-lg transition-all duration-300 bg-base-200/80 group-hover:shadow-md">
                        <item.icon
                          aria-hidden="true"
                          className={`${
                            item.color ?? "text-base-content"
                          } transition-all duration-300 group-hover:scale-110`}
                          size={28}
                          title={item.title}
                        />
                      </div>
                      <span className="text-xs font-medium text-center text-base-content/80">
                        {item.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
