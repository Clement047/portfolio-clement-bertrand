import type { APIRoute } from 'astro';
import { projects } from '../data/projects.js';

// Public pages only: the test scenes are excluded from publication and from indexing.
const pages = ['/', '/portfolio-2d/', '/saturne/', '/contact/', '/musiques/', '/mentions-legales/', ...projects.map(project => `/projets/${project.slug}/`)];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://clementbertrandportfolio.store');
  const urls = pages.map(path => `  <url><loc>${new URL(path, base).href}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
