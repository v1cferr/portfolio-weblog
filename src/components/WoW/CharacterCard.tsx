"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Loading from "../Loading";
import Image from "next/image";

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

export default function CharacterCard() {
  const locale = useLocale();
  const armoryUrl = `https://worldofwarcraft.blizzard.com/${locale}/character/us`;

  const [loading, setLoading] = useState(true);
  const [stormrageCharacters, setStormrageCharacters] = useState<
    Character[] | null
  >(null);

  // TODO: Verificar como posso renderizar (os personagens do wow) em outras máquinas (usando Supabase)
  // Sem precisar logar no Auth a cada 1 dia ^^
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // TODO: Adicionar sistema de cache para não precisar buscar os dados a cada renderização
    fetchProfileAndRender();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    );
  }

  return (
    <>
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
              <span className="text-base-content">Imagem não disponível</span>
            </div>
          )}
          <div className="bg-base-content text-primary-content p-4 rounded-b-lg">
            <h3 className="text-2xl font-bold">{char.name}</h3>
            <p className="text-lg">
              <span className="font-semibold">{char.playable_race.name}</span>{" "}
              {/* TODO: Anchor element para cada tipo de classe (underscore + dicionário) */}
              {/* https://worldofwarcraft.blizzard.com/${locale}/game/classes/${class.name} */}
              <span className="font-semibold">{char.playable_class.name}</span>
            </p>
            <p className="text-sm text-primary-content">
              Level <span className="font-semibold">{char.level}</span>
            </p>
          </div>
        </div>
      ))}
    </>
  );
}
