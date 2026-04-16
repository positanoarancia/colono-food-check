import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSiteUrl } from "../lib/site-url";

const defaultTitle = "대장내시경 전에 먹어도 될까? | 건강신호등";
const defaultDescription = "대장내시경 전 먹어도 되는 음식인지 바로 확인할 수 있어요.";
const ogTitle = "대장내시경 전에 먹어도 될까? | 음식 바로 확인";
const ogDescription =
  "대장내시경 전 음식, 먹어도 되는지 바로 확인하세요. 음식별 섭취 가능 여부와 이유를 한눈에 확인할 수 있습니다.";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const siteUrl = getSiteUrl();
  const cleanPath = router.asPath.split("#")[0]?.split("?")[0] || "/";
  const canonicalPath = cleanPath === "/" ? "" : cleanPath;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const ogImageUrl = `${siteUrl}/og-image.svg`;

  return (
    <>
      <Head>
        <title>{defaultTitle}</title>
        <meta name="description" content={defaultDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f4f8ef" />
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        <meta
          name="google-site-verification"
          content="f8VLh3Llc8IXBYWkldrHvplHkYIt17No7Sjnuc9TexI"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="건강신호등" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
