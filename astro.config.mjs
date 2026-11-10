// @ts-check
import { defineConfig } from 'astro/config';
import localCityTrace from './tools/local-city-trace.mjs';

// https://astro.build/config
export default defineConfig({ integrations: [localCityTrace()] });
