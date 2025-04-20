// Based on: <https://daisyui.com/components/timeline/>

import { differenceInMonths, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

interface ITimelineItem {
  title: string;
  company: string;
  date: string;
  description: string;
  logo: string;
  link: string;
}

// TODO: Tabela no Supabase para armazenar os dados da Timeline (exps)
const timelineData: ITimelineItem[] = [
  {
    title: "Desenvolvedor de Software Júnior",
    company: "Xmart Solutions",
    logo: "/company-logos/xmart-solutions.svg",
    link: "https://www.xmartsolutions.com.br/",
    date: "Set 2024 - Atual",
    description: `Automatizei scans SAST/SCA via GitHub Actions, reduzindo configuração manual em 50%. Otimizei requisições no frontend, melhorando desempenho em 30%. Corrigi 50+ bugs e implementei novas funcionalidades. Planejamento ágil com Scrumban e JIRA.`,
  },
  {
    title: "Estagiário de Desenvolvimento",
    company: "Xmart Solutions",
    logo: "/company-logos/xmart-solutions.svg",
    link: "https://www.xmartsolutions.com.br/",
    date: "Jun 2024 - Set 2024",
    description: `Implementei automação de processos com GitHub Actions, reduzindo tempo de deploy. Resolvi falhas críticas no frontend e backend. Participei do planejamento ágil com Scrumban e JIRA.`,
  },
  {
    title: "Suporte Técnico N2",
    company: "VIP Telecom (Giga+)",
    logo: "/company-logos/vip-telecom.jpeg",
    link: "https://www.viptelecominternet.com.br/",
    date: "Jul 2023 - Dez 2023",
    description: `Atendi clientes externos, solucionando falhas de rede, roteadores e controle de tráfego. Detectei problemas críticos e implementei planos de contingência. Monitorei e otimizei a performance da rede.`,
  },
  {
    title: "Técnico de Suporte T.I.",
    company: "Cultura Inglesa",
    logo: "/company-logos/cultura-inglesa.webp",
    link: "https://www.culturainglesa.com.br/",
    date: "Set 2022 - Abr 2023",
    description: `Resolvi 40+ chamados/semana com 98% de satisfação. Reduzi falhas recorrentes em 20% via manutenção preventiva. Configurei 60+ máquinas para novos colaboradores. Gerenciei tickets e priorizei incidentes críticos via JIRA.`,
  },
  {
    title: "Auxiliar Administrativo",
    company: "Amcor",
    logo: "/company-logos/amcor.jpg",
    link: "https://www.amcor.com/",
    date: "Mar 2021 - Ago 2022",
    description: `Atualizei relatórios industriais com até 98% de precisão. Gerenciei 1.000+ arquivos, reduzindo tempo de acesso em 30%. Controlei estoque de 200+ itens, otimizando custos e garantindo disponibilidade.`,
  },
];

const TimelineIcon: React.FC = () => {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg">
      <path
        clipRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        fillRule="evenodd"
      />
    </svg>
  );
};

interface ITimelineItemComponentProps {
  item: ITimelineItem;
  index: number;
  isLast: boolean;
}

const calculateDuration = (dateRange: string): string => {
  const [start, end] = dateRange.split(" - ");
  const startDate = parse(start, "MMM yyyy", new Date(), { locale: ptBR });
  const endDate =
    end === "Atual"
      ? new Date()
      : parse(end, "MMM yyyy", new Date(), { locale: ptBR });

  const months = differenceInMonths(endDate, startDate);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearString = years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : "";
  const monthString =
    remainingMonths > 0
      ? `${remainingMonths} ${remainingMonths > 1 ? "meses" : "mês"}`
      : "";

  if (yearString && monthString) {
    return `${yearString} e ${monthString}`;
  }

  return yearString || monthString || "menos de um mês";
};

const TimelineItemComponent: React.FC<ITimelineItemComponentProps> = ({
  item,
  index,
  isLast,
}) => {
  return (
    <li>
      {index !== 0 && <hr />}
      <div className="timeline-middle mx-2">
        <TimelineIcon />
      </div>

      <div
        className={`timeline-${index % 2 === 0 ? "start" : "end"} mb-10 ${
          index % 2 === 0 ? "md:text-end" : "md:mb-10"
        }`}>
        <h1 className="text-xl font-semibold text-primary mb-1.5">
          {item.title}
        </h1>
        <div
          className={`flex items-center ${
            index % 2 === 0 ? "md:justify-end" : ""
          }`}>
          <Link
            aria-label={item.company}
            className="flex items-center cursor-pointer"
            href={item.link}
            rel="noopener noreferrer"
            target="_blank"
            title={item.company}>
            <Image
              alt={`${item.company} logo`}
              className="h-6 w-6 mr-2 rounded-md"
              height={100}
              src={item.logo}
              width={100}
            />
            <h2 className="text-lg font-medium hover:underline">
              {item.company}
            </h2>
          </Link>
        </div>
        <time className="text-sm italic">
          {item.date} <span>({calculateDuration(item.date)})</span>
        </time>
        <p className="mt-1.5 whitespace-pre-line max-w-md">
          {item.description}
        </p>
      </div>
      {!isLast && <hr className="border-gray-300 my-4" />}
    </li>
  );
};

const Timeline: React.FC = () => {
  return (
    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
      {timelineData.map((item, index) => (
        <TimelineItemComponent
          index={index}
          isLast={index === timelineData.length - 1}
          item={item}
          key={item.company}
        />
      ))}
    </ul>
  );
};

export default Timeline;
