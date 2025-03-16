"use client";

import Link from "next/link";
import { useState } from "react";

import { categories } from "@/data/TechStackData";

// TODO: Trocar essa função pela função cn/clsx do tailwind-merge
// https://www.npmjs.com/package/tailwind-merge
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Componente que exibe a stack de tecnologias, incluindo linguagens de programação,
 * tecnologias e ferramentas utilizadas
 */
export default function TechStack() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // TODO: Deixar os elementos mais semânticos (SEO)
  return (
    <section className="py-12" id="tech-stack">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Minha Stack
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div
              className={cn(
                "card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300",
                activeCategory === category.title ? "ring-2 ring-primary" : ""
              )}
              key={category.title}
              onMouseEnter={() => setActiveCategory(category.title)}
              onMouseLeave={() => setActiveCategory(null)}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50 rounded-lg" />
              <div className="card-body relative z-10">
                <h2 className="card-title text-primary">{category.title}</h2>
                <p className="text-base-content/80 mb-4">
                  {category.description}
                </p>

                {/* Grid de itens */}
                <div className="grid grid-cols-3 gap-4">
                  {category.items.map((item) => (
                    <Link
                      className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                      href={item.href}
                      key={item.title}
                      rel="noopener noreferrer"
                      target="_blank">
                      <div
                        className={cn(
                          "p-3 rounded-lg transition-all duration-300 bg-base-200/80 group-hover:shadow-md"
                        )}>
                        <item.icon
                          className={cn(
                            "transition-all duration-300",
                            item.color || "text-base-content",
                            "group-hover:scale-110"
                          )}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
