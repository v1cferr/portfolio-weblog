import { useTranslations } from "next-intl";
import Link from "next/link";

const Test = () => {
  const t = useTranslations("Test");

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
      <Link href="/api/blizzard/login">
        <button className="btn">Log In</button>
      </Link>
    </>
  );
};

export default Test;
