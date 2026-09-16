export type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
};

export type BreadcrumbItem = {
  label: string;
  href: string;
  current?: boolean;
};

export type ViewType = "grid" | "list";
