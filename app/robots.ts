import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: [
          "/dashboard/",
          "/editor/",
          "/settings/",
          "/applications/",
          "/jobs/",
          "/api/",
          "/auth/",
          "/share/",
          "/preview/",
        ],
      },
      {
        // Block AI training crawlers
        userAgent: [
          "GPTBot",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Google-Extended",
          "FacebookBot",
          "Bytespider",
          "Omgili",
          "Omgilibot",
          "cohere-ai",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: "https://www.cspark.app/sitemap.xml",
    host: "https://www.cspark.app",
  };
}
