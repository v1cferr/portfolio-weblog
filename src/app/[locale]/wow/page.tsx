"use client";

import { useTranslations } from "next-intl";
import CharacterCard from "@/components/WoW/CharacterCard";

// TODO: Futuramente se for víavel, adicionar DeepL para traduzir dados enviados das APIs para suas respectivas línguas.
// TODO: Utilizar APIs para buscar as informações dos chars, achievs e addons (PvP Stats talvez?):

// - [x] API Client & Keys: https://develop.battle.net/access/clients/
// - [x] Chars: https://develop.battle.net/documentation/world-of-warcraft/profile-apis
// -- [x] Render: https://develop.battle.net/documentation/world-of-warcraft/guides/character-renders

// - [ ] Achievements: https://develop.battle.net/documentation/world-of-warcraft/guides/achievements
// - [ ] PvP Stats: https://develop.battle.net/documentation/world-of-warcraft/guides/pvp
// -- https://us.api.blizzard.com/profile/wow/character/stormrage/fearvy/pvp-summary?namespace=profile-us&locale=en_US

// - [ ] Addons: https://docs.google.com/spreadsheets/d/1Dm8ZmQyewUwQweOuZKMyZPj92LV-PQf2DqdWI3Ft5wE/edit
// - [ ] API Spreadsheet: https://developers.google.com/sheets/api/guides/values

export default function WorldOfWarcraft() {
  const t = useTranslations("WorldOfWarcraft");

  const mockAddons = [
    { name: "Deadly Boss Mods", description: "Ajuda em raides e masmorras." },
    { name: "Details!", description: "Medidor de dano e cura." },
    { name: "WeakAuras", description: "Personalização de alertas visuais." },
  ];

  return (
    <div className="container mx-auto p-6 space-y-12">
      {/* Título */}
      <section>
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="text-lg">{t("subtitle")}</p>
      </section>

      {/* Personagens */}
      <section id="characters">
        <h2 className="text-2xl font-semibold mb-4">{t("char-title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CharacterCard />
        </div>
      </section>

      {/* TODO: Adicionar seção das conquistas */}
      {/* Conquistas */}

      {/* Addons */}
      <section id="addons">
        <h2 className="text-2xl font-semibold mb-4">Addons</h2>
        <table className="table w-full border-collapse border border-base-content">
          <thead>
            <tr className="bg-base-content text-primary-content">
              <th className="border border-base-content px-4 py-2">Nome</th>
              <th className="border border-base-content px-4 py-2">
                Descrição
              </th>
            </tr>
          </thead>
          <tbody>
            {mockAddons.map((addon) => (
              <tr key={addon.name}>
                <td className="border border-base-content px-4 py-2">
                  {addon.name}
                </td>
                <td className="border border-base-content px-4 py-2">
                  {addon.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Galeria */}
      {/* <section id="gallery">
        <h2 className="text-2xl font-semibold mb-4">Galeria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <iframe
            src="https://worldofwarcraft.com/character/eu/victorthebrave"
            className="w-full h-64 border rounded-lg"
          />
          <Image
            src="/images/raid-moment.jpg"
            alt="Raid moment"
            className="w-full h-64 object-cover rounded-lg"
            width={400}
            height={300}
          />
        </div>
      </section> */}
    </div>
  );
}
