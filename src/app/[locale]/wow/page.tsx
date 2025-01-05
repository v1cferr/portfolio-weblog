import Image from "next/image";
// import { useTranslations } from "next-intl";

// TODO: Usar uma API para buscar meus chars e addons
// Chars: https://develop.battle.net/documentation/world-of-warcraft/profile-apis
// API Client & Keys: https://develop.battle.net/access/clients/

// Addons: https://docs.google.com/spreadsheets/d/1Dm8ZmQyewUwQweOuZKMyZPj92LV-PQf2DqdWI3Ft5wE/edit
// API Spreadsheet: https://developers.google.com/sheets/api/guides/values

// Apenas um mock temporário
export default function WorldOfWarcraft() {
  // Dados estáticos para teste
  const characters = [
    {
      name: "Monk",
      race: "Pandaren",
      class: "Monk",
      level: 80,
      img: "/images/monk.jpg",
    },
    {
      name: "Paladin",
      race: "Lightforged Draenei",
      class: "Paladin",
      level: 70,
      img: "/images/paladin.jpg",
    },
  ];

  const addons = [
    { name: "Deadly Boss Mods", description: "Ajuda em raides e masmorras." },
    { name: "Details!", description: "Medidor de dano e cura." },
    { name: "WeakAuras", description: "Personalização de alertas visuais." },
  ];

  return (
    <div className="container mx-auto p-6 space-y-12">
      {/* Título */}
      <section>
        <h1 className="text-4xl font-bold">World of Warcraft</h1>
        <p className="text-lg">
          Meus personagens, addons e outros sobre minha jornada no
          &apos;wowzinho&apos;
        </p>
      </section>

      {/* Personagens */}
      <section id="characters">
        <h2 className="text-2xl font-semibold mb-4">Personagens</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <div
              key={char.name}
              className="card shadow-lg p-4 bg-neutral text-neutral-content rounded-lg">
              <Image
                src={char.img}
                alt={char.name}
                className="rounded-t-lg h-40 w-full object-cover"
                width={400}
                height={300}
              />
              <div className="mt-4">
                <h3 className="text-xl font-bold">{char.name}</h3>
                <p>
                  {char.race} {char.class} - Level {char.level}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Addons */}
      <section id="addons">
        <h2 className="text-2xl font-semibold mb-4">Addons</h2>
        <table className="table w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">Nome</th>
              <th className="border border-gray-300 px-4 py-2">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {addons.map((addon) => (
              <tr key={addon.name}>
                <td className="border border-gray-300 px-4 py-2">
                  {addon.name}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {addon.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Galeria */}
      <section id="gallery">
        <h2 className="text-2xl font-semibold mb-4">Galeria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <iframe
            src="https://worldofwarcraft.com/character/eu/victorthebrave"
            className="w-full h-64 border rounded-lg"></iframe>
          <Image
            src="/images/raid-moment.jpg"
            alt="Raid moment"
            className="w-full h-64 object-cover rounded-lg"
            width={400}
            height={300}
          />
        </div>
      </section>
    </div>
  );
}
