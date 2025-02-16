"use client";

import { useTranslations } from "next-intl";
import CharacterCard from "@/components/WoW/CharacterCard";
/* eslint-disable @next/next/no-img-element */
// import Image from "next/image";

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

      {/* Montarias */}
      <section id="mounts">
        <h2 className="text-2xl font-semibold mb-4">
          Montarias que quero pegar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="border rounded-lg p-4">
            <a
              href="https://www.wowhead.com/pt/item=210061/r%C3%A9deas-de-anurelos-guia-das-chamas"
              target="_blank"
              rel="noopener noreferrer">
              <img
                src="https://wow.zamimg.com/images/wow/icons/large/inv_dreamowl_firemount.jpg"
                alt="Ícone da Rédeas de Anurelos, Guia das Chamas"
                className="w-16 h-16 mb-2"
                width={64}
                height={64}
              />
              <h3 className="text-xl font-bold">
                Rédeas de Anurelos, Guia das Chamas
              </h3>
              <p className="text-lg">Montaria flamejante dos sonhos.</p>
              <img
                src="https://wow.zamimg.com/uploads/screenshots/normal/1150707-r%C3%A9deas-de-anurelos-guia-das-chamas.jpg"
                alt="Imagem em alta definição da montaria Rédeas de Anurelos, Guia das Chamas"
                className="w-full h-auto rounded-lg mt-2"
                width={800}
                height={450}
              />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
