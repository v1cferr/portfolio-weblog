// Based on: <https://daisyui.com/components/timeline/>

interface TimelineItem {
  title: string;
  company: string;
  date: string;
  description: string;
}

// TODO: Tabela no Supabase para armazenar os dados da Timeline (add minhas exps)
const timelineData: TimelineItem[] = [
  {
    title: "Desenvolvedor de Software Júnior",
    company: "Xmart Solutions",
    date: "Set 2024 - Atual",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Estagiário de Desenvolvimento",
    company: "Xmart Solutions",
    date: "Jun 2024 - Set 2024",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Suporte Técnico N2",
    company: "VIP Telecom (Giga+)",
    date: "Jul 2023 - Dez 2023",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Técnico de Suporte T.I.",
    company: "Cultura Inglesa",
    date: "Set 2022 - Abr 2023",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Auxiliar Administrativo",
    company: "Amcor",
    date: "Mar 2021 - Ago 2022",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
];

const TimelineIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const TimelineItemComponent: React.FC<{
  item: TimelineItem;
  index: number;
  isLast: boolean;
}> = ({ item, index, isLast }) => {
  return (
    <li>
      {index !== 0 && <hr />}
      <div className="timeline-middle mx-1">
        <TimelineIcon />
      </div>

      <div
        className={`timeline-${index % 2 === 0 ? "start" : "end"} mb-10 ${
          index % 2 === 0 ? "md:text-end" : "md:mb-10"
        }`}>
        <div className="text-xl font-semibold text-primary">{item.title}</div>
        <div className="text-lg font-medium">{item.company}</div>
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
