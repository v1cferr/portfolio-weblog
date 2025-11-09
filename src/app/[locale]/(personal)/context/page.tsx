import Head from "next/head";
import Link from "next/link";

import { calculateAge } from "@/utils/calculateAge";

/**
 * Componente da página de Contexto
 * Apresenta o histórico pessoal, perspectiva e abordagem em relação à tecnologia e sociedade
 */
export default function Context() {
  const age = calculateAge();

  return (
    <>
      <Head>
        <title>Meu Contexto de Vida e Ambiente</title>
        <meta
          content="Reflexão sobre meu percurso pessoal e profissional, e como meu ambiente moldou minha visão de mundo."
          name="description"
        />
      </Head>
      <article className="prose prose-invert max-w-none dark:prose-invert">
        {/* Container principal com largura controlada e centralizado */}
        <div className="container mx-auto px-4 sm:px-6 py-8 bg-base-100/5 rounded-lg shadow-sm">
          <div className="max-w-3xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Meu Contexto de Vida e Ambiente</h1>
              <p className="text-base-content/70 text-base md:text-lg italic">
                Reflexões sobre desigualdade, tecnologia, geopolítica e como tudo isso moldou minha trajetória.
              </p>
            </header>

            <section aria-labelledby="background">
              <h2 className="sr-only" id="background">
                Contexto Pessoal
              </h2>
              <p className="my-3 text-xs text-base-content/60">
                <strong>Última atualização:</strong> 12/05/2025
              </p>
              <p className="my-3 text-sm sm:text-base md:text-lg text-justify">
                Meu nome é Victor, atualmente possuo {age} anos e sou desenvolvedor, além de estudar tecnologia, inteligência artificial e
                geopolítica. Atualmente moro em <strong>São Carlos, SP</strong>, interior do estado, após ter crescido na periferia da
                região metropolitana de São Paulo, mais especificamente no <strong>ABC Paulista</strong>, longe do centro da capital. O
                Brasil tem uma história marcada por grandes contrastes sociais e econômicos, resultado de seu passado colonial e de
                diferentes ciclos de desenvolvimento. Crescer nesse contexto me proporcionou uma visão realista sobre os desafios e as
                oportunidades do país, além de ter influenciado diretamente minha trajetória e escolhas.
              </p>
              <p className="my-3 text-sm sm:text-base md:text-lg text-justify">
                A mudança para São Carlos foi motivada pela busca por mais qualidade de vida, custos menores e um ambiente mais propício ao
                desenvolvimento pessoal e profissional. Aqui, consigo manter uma rotina mais saudável, com mais tempo e energia para
                estudar, trabalhar e focar em projetos + personal hub. O objetivo nessa nova fase é intensificar a produção de projetos,
                buscar oportunidades no mercado e manter a constância na rotina de estudos e trabalho, aproveitando a melhor estrutura e
                tranquilidade da cidade.
              </p>
              <p className="my-3 text-sm sm:text-base md:text-lg text-justify">
                Meu cotidiano sempre foi marcado por essa realidade. Crescer na periferia me proporcionou uma visão crítica sobre as
                dificuldades enfrentadas pela maioria dos brasileiros: transporte público superlotado, educação e saúde públicas
                subfinanciadas e uma constante luta por melhores oportunidades. Ao mesmo tempo, esse ambiente moldou minha resiliência e
                capacidade de adaptação. Ao contrário de quem nasceu em condições mais favoráveis, precisei entender desde cedo como navegar
                por um cenário que nem sempre favorece quem vem de baixo.
              </p>
            </section>

            <section aria-labelledby="desafios" className="mt-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 border-b border-base-300 pb-2" id="desafios">
                Desafios e Perspectivas
              </h2>
              <p className="my-3 text-sm sm:text-base md:text-lg">
                A verdade é que dificilmente alguém começa do &quot;zero&quot;. Quem diz isso geralmente já tem uma base familiar e/ou
                patrimonial estruturada. Já possui uma família que forneceu o pilar para seu desenvolvimento, seja um carro, uma casa, um
                computador ou um celular bom. Para quem cresce na periferia, a realidade é diferente. No máximo, se tem um celular
                intermediário para baixo e poucas chances reais de estudo. Ter um celular não significa ter acesso a uma educação de
                qualidade. O ensino público muitas vezes não prepara para o mercado de trabalho, e as barreiras vão além do acesso à
                internet. É como jogar no modo Hard, enquanto quem tem uma base familiar sólida joga no Easy — cada um com seus obstáculos,
                mas partindo de contextos completamente distintos.
              </p>
            </section>

            <section aria-labelledby="tecnologia" className="mt-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 border-b border-base-300 pb-2" id="tecnologia">
                Tecnologia como Ferramenta de Transformação
              </h2>
              <p className="my-3 text-sm sm:text-base md:text-lg">
                A tecnologia, para mim, sempre foi uma ferramenta de ascensão e liberdade. Aprender a programar e entender os mecanismos do
                mundo digital me permitiu acessar oportunidades que, de outra forma, poderiam estar fora do meu alcance. No entanto, sei que
                esse caminho não é acessível para todos, e vejo a falta de investimentos em educação tecnológica como um reflexo do próprio
                modelo exploratório do país.
              </p>
            </section>

            <section aria-labelledby="geopolitica" className="mt-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 border-b border-base-300 pb-2" id="geopolitica">
                Visão Geopolítica
              </h2>
              <p className="my-3 text-sm sm:text-base md:text-lg">
                Além da tecnologia, sempre me interessei por geopolítica, pois acredito que entender os interesses das grandes potências e
                suas influências no Brasil é essencial para compreender nossa realidade. O país é uma peça em um tabuleiro global onde
                decisões políticas e econômicas externas frequentemente determinam nosso destino. Busco referências tanto do Ocidente quanto
                do Oriente, analisando diferentes perspectivas sobre o papel do Brasil na geopolítica mundial. Esse interesse foi um dos
                fatores que me levou a aprender Mandarim. O Chinês é a língua da segunda maior economia do mundo e de uma potência que tem
                expandido sua influência global rapidamente. Se o Inglês se tornou essencial por conta do domínio britânico durante séculos
                e, posteriormente, da ascensão dos EUA como superpotência no pós-Segunda Guerra, aprender Chinês hoje é um passo lógico para
                compreender um mundo que caminha para uma nova configuração multipolar.
              </p>
            </section>

            <section aria-labelledby="abordagem" className="mt-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 border-b border-base-300 pb-2" id="abordagem">
                Minha Abordagem
              </h2>
              <p className="my-3 text-sm sm:text-base md:text-lg">
                Diante desse cenário, minha abordagem para contribuir com a sociedade não é tentar resolver problemas estruturais — esses
                exigem mudanças políticas e sociais profundas — mas sim facilitar o cotidiano das pessoas. Acredito que a automação é um dos
                caminhos para tornar nossa vida mais produtiva e menos burocrática. Por exemplo, automatizar o envio de relatórios,
                organizar processos internos com bots ou facilitar o uso de sistemas com assistentes inteligentes. Meu foco é criar soluções
                que reduzam tarefas repetitivas, permitindo que as pessoas tenham mais tempo para o que realmente importa: seja para crescer
                em outras áreas, focar em negócios, se dedicar a projetos pessoais ou simplesmente aproveitar a vida sem estar sempre
                sobrecarregado.
              </p>
            </section>

            <section aria-labelledby="conclusao" className="mt-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3" id="conclusao">
                Conclusão
              </h2>

              <p className="my-3 text-sm sm:text-base md:text-lg">
                No fim das contas, minha trajetória e visão de mundo são resultado tanto das minhas escolhas pessoais quanto das
                circunstâncias sociais e históricas em que estou inserido. Buscar conhecimento e{" "}
                <Link
                  aria-label="Artigo sobre independência financeira (abre em nova janela)"
                  className="text-primary hover:text-primary/80 underline underline-offset-2"
                  href="https://www.gov.br/investidor/pt-br/em-busca-da-independencia-financeira-estrategias-e-beneficios-rumo-a-liberdade-economica"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  independência financeira
                </Link>{" "}
                faz parte desse processo de compreender o contexto ao meu redor e encontrar caminhos para crescer e contribuir. Acredito que
                o futuro depende da nossa capacidade de enxergar além do imediato e construir soluções reais para os desafios que
                enfrentamos.
              </p>
            </section>
          </div>
        </div>
      </article>
    </>
  );
}
