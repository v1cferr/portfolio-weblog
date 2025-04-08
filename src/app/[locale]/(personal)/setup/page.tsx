import Image from "next/image";

import { components, stores, photos } from "@/data/SetupData";

function _Stores() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Lojas</h2>
      <ul className="list-disc pl-5">
        {stores.map((store, index) => (
          <li key={index}>
            <a
              className="text-blue-500 hover:underline"
              href={store.url}
              rel="noopener noreferrer"
              target="_blank">
              {store.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhotoGallery() {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Evolução do Setup</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {photos.map((photo, index) => (
          <article className="shadow-lg rounded-lg overflow-hidden" key={index}>
            <div className="relative">
              <Image
                alt={photo.alt}
                className="rounded-t-lg w-full h-auto"
                height={700}
                src={photo.src}
                width={700}
              />
              <p className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white/90 p-2 w-full text-center">
                {photo.date}
              </p>
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
                </tr>
              </thead>
              <tbody>
                {component.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Peças compradas dessas lojas */}
      {/* <Stores /> */}

      {/* Evolução do Setup */}
      <PhotoGallery />
    </div>
  );
}
