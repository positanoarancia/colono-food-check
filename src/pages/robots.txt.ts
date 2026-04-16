import type { GetServerSideProps } from "next";
import { getSiteUrl } from "../lib/site-url";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteUrl = getSiteUrl();

  res.setHeader("Content-Type", "text/plain");
  res.write(`User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`);
  res.end();

  return { props: {} };
};

export default function RobotsTxt() {
  return null;
}
