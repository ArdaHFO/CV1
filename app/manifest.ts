import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CSpark — AI CV Builder & Job Search",
    short_name: "CSpark",
    description:
      "Build ATS-optimized CVs and search jobs on LinkedIn, Workday & CareerOne with AI. Powered by Meta Llama 3.3.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF3000",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    categories: ["productivity", "business", "utilities"],
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/og-image.png",
        sizes: "1200x630",
        type: "image/png",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form_factor: "wide" as any,
      },
    ],
  };
}
