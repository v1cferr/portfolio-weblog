import Link from "next/link";

import { categories } from "@/data/TechStackData";

/**
 * Renders a responsive grid of the technologies I work with.
 *
 * Technologies are grouped into categories, each shown as a card with:
 * - A category title and description
 * - A grid of entries, each with an icon and a link to the relevant resource
 *
 * Every entry carries:
 * - An icon, optionally with a custom colour
 * - A link that opens in a new tab
 * - Hover feedback
 *
 * The layout runs from a single column on mobile to three columns on wider screens.
 *
 * @returns Um elemento section contendo a apresentação da stack de tecnologias
 */
export default function TechStack() {
  return (
    <section aria-labelledby="tech-stack-heading" className="py-12" id="tech-stack">
      <div className="container mx-auto px-4">
        <header className="mb-12">
          <h2
            className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            id="tech-stack-heading"
          >
            Minha Stack
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <article
              className="card bg-base-100 shadow-lg hover:shadow-xl hover:ring-2 hover:ring-primary transition-all duration-300"
              key={category.title}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50 rounded-lg" />
              <div className="card-body relative z-10">
                <h3 className="card-title text-primary">{category.title}</h3>
                <p className="text-base-content/80 mb-4">{category.description}</p>

                {/* Grid de itens */}
                <div className="grid grid-cols-3 gap-4">
                  {category.items.map((item) => (
                    <Link
                      aria-label={`${item.title} - ${category.title}`}
                      className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                      href={item.href}
                      key={item.title}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="p-3 rounded-lg transition-all duration-300 bg-base-200/80 group-hover:shadow-md">
                        <item.icon
                          aria-hidden="true"
                          className={`${item.color ?? "text-base-content"} transition-all duration-300 group-hover:scale-110`}
                          size={28}
                          title={item.title}
                        />
                      </div>
                      <span className="text-xs font-medium text-center text-base-content/80">{item.title}</span>
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
