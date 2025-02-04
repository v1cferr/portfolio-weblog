interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

const timelineData: TimelineItem[] = [
  {
    year: "2025",
    title: "Lorem Ipsum - Dolor Sit",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.",
  },
  {
    year: "2024",
    title: "Amet Consectetur - Adipiscing Elit",
    description:
      "Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.",
  },
  {
    year: "2023",
    title: "Integer Nec - Odio Praesent",
    description:
      "Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
  },
];

// TODO: "Timeline with icon snapped to the start" do DaisyUI
// <https://daisyui.com/components/timeline/>
const Timeline: React.FC = () => {
  return (
    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
      {timelineData.map((item, index) => (
        <li key={index}>
          <div className="timeline-middle">
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
          </div>
          <div
            className={`timeline-${index % 2 === 0 ? "start" : "end"} mb-10`}>
            <time className="font-mono italic">{item.year}</time>
            <div className="text-lg font-black">{item.title}</div>
            <p>{item.description}</p>
          </div>
          {index < timelineData.length - 1 && <hr />}
        </li>
      ))}
    </ul>
  );
};

export default Timeline;
