"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
// import { useTranslations } from "next-intl";

// TODO: Utilizar APIs para buscar as informações dos chars e addons:

// - [x] Chars: https://develop.battle.net/documentation/world-of-warcraft/profile-apis
// - [x] API Client & Keys: https://develop.battle.net/access/clients/
// - [ ] Achievements: https://develop.battle.net/documentation/world-of-warcraft/guides/achievements
// - [ ] Render: https://develop.battle.net/documentation/world-of-warcraft/guides/character-renders
// -- https://us.api.blizzard.com/profile/wow/character/
// -- ${realmSlug}/
// -- ${characterName}/appearance
// -- ?namespace=profile-us&locale=en_US

// - [ ] Addons: https://docs.google.com/spreadsheets/d/1Dm8ZmQyewUwQweOuZKMyZPj92LV-PQf2DqdWI3Ft5wE/edit
// - [ ] API Spreadsheet: https://developers.google.com/sheets/api/guides/values

interface Character {
  character: {
    href: string;
  };
  protected_character: {
    href: string;
  };
  name: string;
  id: number;
  realm: {
    key: {
      href: string;
    };
    name: string;
    id: number;
    slug: string;
  };
  playable_class: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  playable_race: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  gender: {
    type: string;
    name: string;
  };
  faction: {
    type: string;
    name: string;
  };
  level: number;
}

export default function WorldOfWarcraft() {
  const [stormrageCharacters, setStormrageCharacters] = useState<
    Character[] | null
  >(null);

  const fetchProfile = async () => {
    try {
      const profileDataResponse = await fetch("/api/blizzard/profile");

      if (!profileDataResponse.ok) {
        const errorData = await profileDataResponse.json();
        console.error("Erro ao buscar dados do perfil:", errorData);
        return;
      }

      const data = await profileDataResponse.json();
      const StormrageChars = data.wow_accounts[1].characters.filter(
        (char: Character) => char.realm.name === "Stormrage" && char.level >= 70
      );

      console.log("Personagens do Stormrage:", StormrageChars);

      setStormrageCharacters(StormrageChars);
    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
          {stormrageCharacters?.map((char: Character) => (
            <div
              key={char.name}
              className="card shadow-lg p-4 bg-neutral text-neutral-content rounded-lg">
              <Image
                src="https://random.imagecdn.app/500/150"
                alt={char.name}
                className="rounded-t-lg h-40 w-full object-cover"
                width={400}
                height={300}
                priority={true}
              />
              <div className="mt-4">
                <h3 className="text-xl font-bold">{char.name}</h3>
                <p>
                  {char.playable_race.name} {char.playable_class.name} - Level{" "}
                  {char.level}
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
