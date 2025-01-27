"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import Image from "next/image";

// TODO: Utilizar APIs para buscar as informações dos chars e addons:

// - [x] API Client & Keys: https://develop.battle.net/access/clients/
// - [x] Chars: https://develop.battle.net/documentation/world-of-warcraft/profile-apis
// -- [x] Render: https://develop.battle.net/documentation/world-of-warcraft/guides/character-renders

// - [ ] Achievements: https://develop.battle.net/documentation/world-of-warcraft/guides/achievements
// - [ ] PvP Stats: https://develop.battle.net/documentation/world-of-warcraft/guides/pvp
// -- https://us.api.blizzard.com/profile/wow/character/stormrage/fearvy/pvp-summary?namespace=profile-us&locale=en_US

// - [ ] Addons: https://docs.google.com/spreadsheets/d/1Dm8ZmQyewUwQweOuZKMyZPj92LV-PQf2DqdWI3Ft5wE/edit
// - [ ] API Spreadsheet: https://developers.google.com/sheets/api/guides/values

interface Character {
  name: string;
  render: string;
  level: number;
  realm: {
    name: string;
    slug: string;
  };
  playable_class: {
    name: string;
  };
  playable_race: {
    name: string;
  };
}

export default function WorldOfWarcraft() {
  const t = useTranslations("WorldOfWarcraft");
  const locale = useLocale();
  const armoryUrl = `https://worldofwarcraft.blizzard.com/${locale}/character/us`;

  const [stormrageCharacters, setStormrageCharacters] = useState<
    Character[] | null
  >(null);

  const fetchProfileAndRender = async () => {
    try {
      const profileDataResponse = await fetch("/api/blizzard/profile");

      if (!profileDataResponse.ok) {
        const errorData = await profileDataResponse.json();
        console.error("Erro ao buscar dados do perfil:", errorData);
        return;
      }

      const data = await profileDataResponse.json();
      const StormrageChars = data.wow_accounts[1].characters
        .filter(
          (char: Character) =>
            char.realm.name === "Stormrage" && char.level >= 70
        )
        .sort((a: Character, b: Character) => b.level - a.level);

      const updatedChars = await Promise.all(
        StormrageChars.map(async (char: Character) => {
          const renderDataResponse = await fetch(
            `/api/blizzard/render?realmSlug=${
              char.realm.slug
            }&characterName=${char.name.toLowerCase()}`
          );

          if (renderDataResponse.ok) {
            const renderData = await renderDataResponse.json();
            const render = renderData.assets[2]?.value;
            return { ...char, render };
          }

          return char;
        })
      );

      setStormrageCharacters(updatedChars);
    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
    }
  };

  useEffect(() => {
    fetchProfileAndRender();
  }, []);

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
          {stormrageCharacters?.map((char: Character) => (
            <div key={char.name} className="mb-8 hover:shadow-xl transition">
              {char.render ? (
                <a
                  href={`${armoryUrl}/${
                    char.realm.slug
                  }/${char.name.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <Image
                    src={char.render}
                    alt={char.name}
                    className="rounded-t-lg shadow-lg object-cover w-auto h-auto"
                    width={400}
                    height={300}
                    priority={true}
                  />
                </a>
              ) : (
                <div className="rounded-t-lg h-20 object-cover flex items-center justify-center shadow-lg">
                  <span className="text-base-content">
                    Imagem não disponível
                  </span>
                </div>
              )}
              <div className="bg-base-content text-primary-content p-4 rounded-b-lg">
                <h3 className="text-2xl font-bold">{char.name}</h3>
                <p className="text-lg">
                  <span className="font-semibold">
                    {char.playable_race.name}
                  </span>{" "}
                  {/* TODO: Anchor element para cada tipo de classe (underscore + dicionário) */}
                  {/* https://worldofwarcraft.blizzard.com/${locale}/game/classes/${class.name} */}
                  <span className="font-semibold">
                    {char.playable_class.name}
                  </span>
                </p>
                <p className="text-sm text-primary-content">
                  Level <span className="font-semibold">{char.level}</span>
                </p>
              </div>
            </div>
          ))}
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
