import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";
import mn from "@/lib/i18n/mn";

export const metadata: Metadata = {
  title: mn.meta.title,
  description: mn.meta.description,
  keywords: mn.meta.keywords.split(", "),
  openGraph: {
    title: mn.meta.title,
    description: mn.meta.description,
    type: "website",
    locale: "mn_MN",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: mn.meta.title,
    description: mn.meta.description,
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <LandingPage />;
}
