import NavigationLink from "@/components/i18n/NavigationLink";

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
                      </NavigationLink>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <NavigationLink href={item.href || "/"}>
                {item.label}
              </NavigationLink>
            )}
          </li>
        ))}
      </ul>
    </details>
  </li>
);
