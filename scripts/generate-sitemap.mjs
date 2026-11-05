import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
const configuredUrl = (
  process.env.PUBLIC_SITE_URL ||
  (process.env.CONTEXT === "production" ? process.env.URL : "") ||
  ""
).trim();
let origin = "";
if (configuredUrl) {
  const url = new URL(configuredUrl);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("PUBLIC_SITE_URL must be a primary HTTPS origin without a path, query, or credentials.");
  }
  origin = url.origin;
}
const sitemapPath = path.resolve("dist/sitemap.xml");
const robotsPath = path.resolve("dist/robots.txt");
if (!origin) {
  console.warn(
    "Sitemap not generated: set the production environment variable PUBLIC_SITE_URL to the primary HTTPS domain of your Netlify site."
  );
  await rm(sitemapPath, { force: true });
} else {
  const pages = [
    "/",
    "/about",
    "/services",
    "/guide",
    "/location",
    "/contact",
    "/notices",
    "/privacy",
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `<url><loc>${new URL(page, origin).href}</loc></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(sitemapPath, xml, "utf8");
  console.info(`SEO sitemap generated for ${origin}`);
}
const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ""}`;
await writeFile(robotsPath, robots, "utf8");
