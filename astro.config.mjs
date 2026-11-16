// @ts-check
import { defineConfig } from 'astro/config';
import localCityTrace from './tools/local-city-trace.mjs';

// https://astro.build/config
// `site` gives absolute canonical and Open Graph URLs.
export default defineConfig({ site: 'https://clementbertrandportfolio.store', integrations: [localCityTrace()] });
