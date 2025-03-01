import { components, stores } from "@/utils/setupData";

function Stores() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Lojas</h2>
      <ul className="list-disc pl-5">
        {stores.map((store, index) => (
          <li key={index}>
            <a
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline">
              {store.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// TODO: Adicionar o mês-ano de aquisição (+quanto tempo até atualmente)
export default function Setup() {
  return (
    <div className="container mx-auto p-4">
      {components.map((component) => (
        <div key={component.category} className="mb-8">
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
      <Stores />

      {/* TODO: Adicionar fotos do setup (galeria); por data, para acompanhar a evolução */}
    </div>
  );
}
