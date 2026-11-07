import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/app/site";

export interface WebApplicationJsonLd {
  readonly "@context": "https://schema.org";
  readonly "@type": "WebApplication";
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly inLanguage: string;
  readonly applicationCategory: string;
  readonly operatingSystem: string;
}

export function webApplicationJsonLd(): WebApplicationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "ja",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
  };
}

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}
