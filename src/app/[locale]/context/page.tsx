"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const BIRTH_DATE = {
  year: 2002,
  month: 9,
  day: 6,
};

const calculateAge = (birthDate = BIRTH_DATE): number => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - birthDate.year;

  if (
    currentMonth < birthDate.month ||
    (currentMonth === birthDate.month && currentDay < birthDate.day)
  ) {
    age--;
  }

  return age;
};

/**
 *
 */
export default function Context() {
  const [age, setAge] = useState<number>(calculateAge());

  useEffect(() => {
    setAge(calculateAge());

    const intervalId = setInterval(() => {
      const now = new Date();

      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setAge(calculateAge());
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <article className="prose prose-invert max-w-none dark:prose-invert p-6 sm:p-8 md:p-12 lg:p-14">
      <h1 className="text-2xl md:text-3xl lg:text-4xl mb-4 md:mb-6">
        Meu Contexto de Vida e Ambiente
      </h1>

      <p className="my-3 md:my-4">
        Meu nome é Victor, atualmente possuo {age} anos e sou desenvolvedor,
        além de estudar tecnologia, inteligência artificial e geopolítica.
        Cresci e moro na periferia da capital paulista, em um Brasil que
        historicamente se estruturou como um país colonial, extrativista e
        entreguista. Nesse sistema, as riquezas naturais e produtivas do país
        são exploradas por potências estrangeiras e elites internas, enquanto a
        maior parte da população lida com desigualdade, precarização do trabalho
        e instabilidade econômica.
      </p>

      <p className="my-3 md:my-4">
        Meu cotidiano sempre foi marcado por essa realidade. Crescer na
        periferia me proporcionou uma visão crítica sobre as dificuldades
        enfrentadas pela maioria dos brasileiros: transporte público
        superlotado, educação e saúde públicas subfinanciadas e uma constante
        luta por melhores oportunidades. Ao mesmo tempo, esse ambiente moldou
        minha resiliência e capacidade de adaptação. Diferente de muitos que
        nasceram em condições mais favoráveis, precisei entender desde cedo como
        navegar por um cenário que nem sempre favorece quem vem de baixo.
      </p>

      <div className="bg-base-200/50 p-3 md:p-4 rounded-md my-5 md:my-6 text-sm italic shadow-md">
        <p className="text-xs md:text-sm">
          <strong>Nota:</strong> Periferia não é o mesmo que favela. Periferia
          se refere a regiões mais afastadas do centro urbano, onde predominam
          grupos de baixa renda e há uma forte dependência da infraestrutura do
          centro da cidade. Já a favela é um tipo de comunidade inserida dentro
          desse contexto, podendo estar até mesmo em áreas centrais.
        </p>
      </div>

      <h2 className="text-xl md:text-2xl mt-6 md:mt-8 mb-3 md:mb-4">
        Desafios e Perspectivas
      </h2>

      <p className="my-3 md:my-4">
        A verdade é que dificilmente alguém começa do &quot;zero&quot;. Quem diz
        isso geralmente já tem uma base familiar e/ou patrimonial estruturada.
        Já possui uma família que forneceu o pilar para seu desenvolvimento,
        seja um carro, uma casa, um computador ou um celular bom. Para quem
        cresce na periferia, a realidade é diferente. No máximo, se tem um
        celular intermediário para baixo e poucas chances reais de estudo. Ter
        um celular não significa ter acesso a uma educação de qualidade. O
        ensino público muitas vezes não prepara para o mercado de trabalho, e as
        barreiras vão além do acesso à internet. É como jogar no modo Hard,
        enquanto quem tem uma base familiar sólida joga no Easy — cada um com
        seus obstáculos, mas partindo de contextos completamente distintos.
      </p>

      <h2 className="text-xl md:text-2xl mt-6 md:mt-8 mb-3 md:mb-4">
        Tecnologia como Ferramenta de Transformação
      </h2>

      <p className="my-3 md:my-4">
        A tecnologia, para mim, sempre foi uma ferramenta de ascensão e
        liberdade. Aprender a programar e entender os mecanismos do mundo
        digital me permitiu acessar oportunidades que, de outra forma, poderiam
        estar fora do meu alcance. No entanto, sei que esse caminho não é
        acessível para todos, e vejo a falta de investimentos em educação
        tecnológica como um reflexo do próprio modelo exploratório do país:
        importamos conhecimento e inovação, mas investimos pouco na autonomia
        intelectual e produtiva da população.
      </p>

      <h2 className="text-xl md:text-2xl mt-6 md:mt-8 mb-3 md:mb-4">
        Visão Geopolítica
      </h2>

      <p className="my-3 md:my-4">
        Além da tecnologia, sempre me interessei por geopolítica, pois acredito
        que entender os interesses das grandes potências e suas influências no
        Brasil é essencial para compreender nossa realidade. O país é uma peça
        em um tabuleiro global onde decisões políticas e econômicas externas
        frequentemente determinam nosso destino. Busco referências tanto do
        Ocidente quanto do Oriente, analisando diferentes perspectivas sobre o
        papel do Brasil na geopolítica mundial. Essa percepção me fez buscar
        fontes diversas para construir minha própria visão de mundo, sem
        depender de narrativas enviesadas.
      </p>

      {/* TODO: Adicionar essa nota de contexto/detalhe */}
      {/* (Um dos motivos que me fez querer
        aprender Chinês! Além de eles serem a segunda maior economia do mundo.
        Inglês é o básico por conta da dominação do Reino Unido no globo durante séculos
        e logo em seguida os EUA como superpotência mundial em um mundo unipolar
        pós-segunda guerra mundial) */}

      <h2 className="text-xl md:text-2xl mt-6 md:mt-8 mb-3 md:mb-4">
        Minha Abordagem
      </h2>

      <p className="my-3 md:my-4">
        Diante desse cenário, minha abordagem para contribuir com a sociedade
        não é tentar resolver problemas estruturais — esses exigem mudanças
        políticas e sociais profundas — mas sim facilitar o cotidiano das
        pessoas. Acredito que a automação é um dos caminhos para tornar nossa
        vida mais produtiva e menos burocrática. Meu foco é criar soluções que
        reduzam tarefas repetitivas, permitindo que as pessoas tenham mais tempo
        para o que realmente importa: seja para crescer em outras áreas, focar
        em negócios, se dedicar a projetos pessoais ou simplesmente aproveitar a
        vida sem estar sempre sobrecarregado.
      </p>

      <p className="my-5 md:my-6 border-l-4 border-primary rounded-md p-3 md:p-4 italic shadow-md bg-base-200/50">
        No fim das contas, minha trajetória e visão de mundo não são apenas
        fruto de escolhas pessoais, mas também das circunstâncias sociais e
        históricas nas quais estou inserido. Minha busca por conhecimento e{" "}
        <Link
          aria-label="Artigo sobre independência financeira (abre em nova janela)"
          className="text-primary/75 hover:text-primary underline underline-offset-2"
          href="https://www.gov.br/investidor/pt-br/em-busca-da-independencia-financeira-estrategias-e-beneficios-rumo-a-liberdade-economica"
          rel="noopener noreferrer"
          target="_blank">
          independência financeira
        </Link>{" "}
        está diretamente ligada a essa compreensão, e acredito que o futuro
        depende da nossa capacidade de enxergar além do imediato e construir
        soluções reais para os problemas que nos cercam.
      </p>
    </article>
  );
}
