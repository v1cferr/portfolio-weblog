import { Link } from "@/i18n/routing";

interface DropdownMenuProps {
  title: string;
  items: Array<{
    label: string;
    href?: string;
    subItems?: Array<{ label: string; href?: string }>;
  }>;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ title, items }) => (
  <li>
    <details>
      <summary>{title}</summary>
      <ul className="p-1">
        {items.map((item, index) => (
          <li key={index}>
            {item.subItems ? (
              <details>
                <summary>{item.label}</summary>
                <ul className="p-1">
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex}>
                      <Link href={subItem.href || "#"}>{subItem.label}</Link>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
          </li>
        ))}
      </ul>
    </details>
  </li>
);
