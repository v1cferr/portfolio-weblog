"use client";

import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { useLocale } from "next-intl";
import Loading from "../Loading";
import Image from "next/image";
import Link from "next/link";

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
  const wowUrl = "https://worldofwarcraft.blizzard.com";
  const armoryUrl = `${wowUrl}/${locale}/character/us`;
  const classUrl = `${wowUrl}/${locale}/game/classes`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stormrageCharacters, setStormrageCharacters] = useState<
    Character[] | null
  >(null);

  const formatClassName = (className: string) => {
    return className.toLowerCase().replace(/\s+/g, "-");
  };

  const fetchProfileAndRender = async () => {
    try {
      const profileDataResponse = await fetch("/api/blizzard/profile");

      if (!profileDataResponse.ok) {
        const errorData = await profileDataResponse.json();
        console.error("Erro ao buscar dados do perfil:", errorData);
        setError(true);
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

      const cacheData = {
        timestamp: new Date().getTime(),
        characters: updatedChars,
      };

      localStorage.setItem("stormrageCharacters", JSON.stringify(cacheData));
      setStormrageCharacters(updatedChars);
    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = localStorage.getItem("stormrageCharacters");

    if (cachedData) {
      const { timestamp, characters } = JSON.parse(cachedData);
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      if (now - timestamp < oneDay) {
        setStormrageCharacters(characters);
        setLoading(false);
        return;
      }
    }

    fetchProfileAndRender();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 flex-col">
        <FaExclamationTriangle className="text-6xl text-yellow-400 mb-4" />
        <span className="text-base-content break-words text-center">
          Erro ao carregar dados dos personagens.
        </span>
      </div>
    );
  }

  return (
    <>
      {stormrageCharacters?.map((char: Character) => (
        <div key={char.name} className="mb-8 hover:shadow-xl transition">
          {char.render ? (
            <Link
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
            </Link>
          ) : (
            <div className="rounded-t-lg h-20 object-cover flex items-center justify-center shadow-lg">
              <span className="text-base-content">Imagem não disponível</span>
            </div>
          )}
          <div className="bg-base-content text-primary-content p-4 rounded-b-lg">
            <h3 className="text-2xl font-bold">{char.name}</h3>
            <p className="text-lg">
              <span className="font-semibold">{char.playable_race.name}</span>{" "}
              <Link
                href={`${classUrl}/${formatClassName(
                  char.playable_class.name
                )}`}
                target="_blank"
                rel="noopener noreferrer">
                <span className="font-semibold hover:underline">
                  {char.playable_class.name}
                </span>
              </Link>{" "}
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
