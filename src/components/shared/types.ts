export type BreadcrumbItem = {
  label: string;
  href?: string; // if omitted, the item will render as plain text
  current?: boolean; // sets aria-current on the item
};
