import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Défense des litiges Stripe pour formateurs et coachs",
  description:
    "Vos litiges Stripe contestés avec les preuves que Stripe ne voit pas. 20 % seulement si on gagne.",
  robots: { index: false, follow: false }, // retiré à la mise en ligne officielle
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
