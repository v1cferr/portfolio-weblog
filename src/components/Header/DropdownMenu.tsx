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
          <li key={index}>
            {item.subItems ? (
              <details>
                <summary>{item.label}</summary>
                <ul>
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex}>
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
