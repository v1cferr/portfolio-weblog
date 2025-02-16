// Based on: <https://daisyui.com/components/timeline/>

import Image from "next/image";
import Link from "next/link";

interface TimelineItem {
  title: string;
  company: string;
  date: string;
  description: string;
  logo: string;
  link: string;
}

// TODO: Tabela no Supabase para armazenar os dados da Timeline (exps)
const timelineData: TimelineItem[] = [
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
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
};

interface TimelineItemComponentProps {
  item: TimelineItem;
  index: number;
  isLast: boolean;
}

const TimelineItemComponent: React.FC<TimelineItemComponentProps> = ({
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
        <h1 className="text-xl font-semibold text-primary">{item.title}</h1>
        <div
          className={`flex items-center ${
            index % 2 === 0 ? "md:justify-end" : ""
          }`}>
          <Link
            href={item.link}
            className="flex items-center cursor-pointer"
            target="_blank"
            rel="noopener noreferrer">
            <Image
              src={item.logo}
              alt={`${item.company} logo`}
              width={100}
              height={100}
              className="h-6 w-6 mr-2 rounded-md"
            />
            <h2 className="text-lg font-medium hover:underline">
              {item.company}
            </h2>
          </Link>
        </div>
        <time className="text-sm italic">{item.date}</time>
        <p className="mt-3 whitespace-pre-line">{item.description}</p>
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
          key={index}
          item={item}
          index={index}
          isLast={index === timelineData.length - 1}
        />
      ))}
    </ul>
  );
};

export default Timeline;
