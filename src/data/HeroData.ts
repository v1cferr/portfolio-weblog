export interface ISocialLinkProps {
  href: string;
  Icon: React.ComponentType<{ className?: string; title?: string }>;
  title: string;
}

export interface IQuoteCardProps {
  quote: string;
  source: string;
  href: string;
}

export const quotes = [
  {
    id: 1,
    quote: "Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta será aberta.",
    source: "Mateus 7:7",
    href: "https://www.bibliaonline.com.br/nvi/mt/7/7",
  },
  {
    id: 2,
    quote: "Não tenha medo de crescer lentamente, tenha medo de ficar parado.",
    source: "Provérbio Chinês",
    href: "https://www.pensador.com/frase/NDA2NjE4/",
  },
  {
    id: 3,
    quote: "Uma jornada de mil milhas começa com um único passo.",
    source: "Lao Tzu",
    href: "https://wikipedia.org/wiki/A_journey_of_a_thousand_miles_begins_with_a_single_step",
  },
];
