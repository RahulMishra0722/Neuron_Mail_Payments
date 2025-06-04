// Central configuration file for easy customization
export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
  contactEmail: string;
  logo: {
    light: string;
    dark: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "PaymentHub",
  description: "Professional subscription management for modern businesses",
  url: "https://paymenthub.com",
  ogImage: "/og-image.jpg",
  links: {
    twitter: "https://twitter.com/paymenthub",
    github: "https://github.com/paymenthub",
  },
  contactEmail: "rahulmishra7802@gmail.com",
  logo: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
  },
};
