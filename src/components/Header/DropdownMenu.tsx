import NavigationLink from "@/components/i18n/NavigationLink";
import { FaTools } from "react-icons/fa";

interface DropdownMenuProps {
  title: string;
  items: Array<{
    label: string;
    href?: string;
    subItems?: Array<{ label: string; href?: string; wip?: boolean }>;
    wip?: boolean;
  }>;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ title, items }) => (
  <li>
    <details>
      <summary>{title}</summary>
      <ul>
        {items.map((item, index) => (
          <li key={index} className="mb-[0.15rem]">
            {item.subItems ? (
              <details>
                <summary className="mb-[0.25rem]">{item.label}</summary>
                <ul>
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex} className="mb-[0.15rem]">
                      <NavigationLink href={subItem.href || "/"}>
                        {subItem.label}
                        {subItem.wip && <FaTools className="inline ml-2 text-yellow-500" title="Work In Progress" />}
                      </NavigationLink>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <NavigationLink href={item.href || "/"}>
                {item.label}
                {item.wip && <FaTools className="inline ml-2 text-yellow-500" title="Work In Progress" />}
              </NavigationLink>
            )}
          </li>
        ))}
      </ul>
    </details>
  </li>
);
