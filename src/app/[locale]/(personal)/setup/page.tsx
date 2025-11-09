import Image from "next/image";

import { components, photos } from "@/data/SetupData";
import { getUsageTime } from "@/utils/getTimeBetween";

function PhotoGallery() {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Evolução do Setup</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {photos.map((photo) => (
          <article className="shadow-lg rounded-lg overflow-hidden" key={photo.src}>
            <div className="relative">
              <Image alt={photo.alt} className="rounded-t-lg w-full h-auto" height={700} src={photo.src} width={700} />
              <p className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white/90 p-2 w-full text-center">{photo.date}</p>
            </div>
            <div className="p-4 text-base-content break-words">
              <p>{photo.observation}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 *
 */
export default function Setup() {
  return (
    // TODO: Adicionar o mês-ano de aquisição (+quanto tempo até atualmente)
    <div className="container mx-auto p-4">
      {/* Componentes */}
      {components.map((component) => (
        <div className="mb-8" key={component.category}>
          <h2 className="text-2xl font-bold mb-4">{component.category}</h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  {/* Só mostra "Tempo de uso" para Ex-Peças */}
                  {component.category === "Ex-Peças" && <th>Tempo de uso</th>}
                </tr>
              </thead>
              <tbody>
                {component.items.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    {/* Só mostra tempo de uso para Ex-Peças */}
                    {component.category === "Ex-Peças" && (
                      <td>{"date" in item && item.date ? getUsageTime(item.date, "endDate" in item ? item.endDate : undefined) : "-"}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Evolução do Setup */}
      <PhotoGallery />
    </div>
  );
}
