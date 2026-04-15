import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";

const defaultTitle = "대장내시경 음식체크 | 건강신호등";
const defaultDescription =
  "대장내시경 전 먹어도 되는 음식을 날짜 단계별로 바로 확인하는 검색 서비스.";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const canonicalPath = router.asPath === "/" ? "" : router.asPath;
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="건강신호등" />
        <meta property="og:title" content={defaultTitle} />
        <meta property="og:description" content={defaultDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={defaultTitle} />
        <meta name="twitter:description" content={defaultDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
