export type ChildItem = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: ChildItem[];
};
