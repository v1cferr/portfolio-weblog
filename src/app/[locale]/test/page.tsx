"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

// TODO: Resolver o bug do loop infinito sempre que a
// página é recarregada e o componente montado

const Test = () => {
  const t = useTranslations("Test");
  const [profileData, setProfileData] = useState(null);

  // useEffect(() => {
  //   const data = localStorage.getItem("profileData");
  //   if (data) {
  //     setProfileData(JSON.parse(data));
  //     localStorage.removeItem("profileData");
  //   }
  // }, []);

  // const buttonRef = useRef<HTMLButtonElement>(null);

  // useEffect(() => {
  //   if (!profileData && buttonRef.current) {
  //     buttonRef.current.click();
  //   }
  // }, [profileData]);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await fetch("/api/blizzard/profile");

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        console.error("Erro ao buscar dados do perfil.");
      }
    };

    fetchProfile();
  }, []);

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>

      {/* 
        TODO: Simular um clique no button para realizar todo o fluxo a seguir:
        
        1. Clicar no button para acessar a rota /api/blizzard/login
        2. Ser redirecionado para a página de login da Blizzard (já autorizado)
        3. Ser redirecionado para a rota /api/blizzard/token com o código de autorização
        4. Ser redirecionado para a rota /api/blizzard/profile com o token de acesso
        5. Acessar a rota /api/blizzard/profile e retornar um JSON com os dados
          - https://us.api.blizzard.com/profile/user/wow
        6. Renderizar os dados no front
        
        Tudo isso utilizando Serverless Functions e sem expor dados sensíveis no front.
      */}
      {profileData && <pre>{JSON.stringify(profileData, null, 2)}</pre>}

      <Link href="/api/blizzard/login">
        <button
          // ref={buttonRef}
          className="btn">
          Log In
        </button>
      </Link>
    </>
  );
};

export default Test;
