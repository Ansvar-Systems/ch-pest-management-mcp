#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createDatabase } from './db.js';
import { handleAbout } from './tools/about.js';
import { handleListSources } from './tools/list-sources.js';
import { handleCheckFreshness } from './tools/check-freshness.js';
import { handleSearchPests } from './tools/search-pests.js';
import { handleGetPestDetails } from './tools/get-pest-details.js';
import { handleGetTreatments } from './tools/get-treatments.js';
import { handleGetIpmGuidance } from './tools/get-ipm-guidance.js';
import { handleSearchCropThreats } from './tools/search-crop-threats.js';
import { handleIdentifyFromSymptoms } from './tools/identify-from-symptoms.js';
import { handleGetApprovedProducts } from './tools/get-approved-products.js';

const SERVER_NAME = 'ch-pest-management-mcp';
const SERVER_VERSION = '0.1.0';

const TOOLS = [
  {
    name: 'about',
    description: 'Get server metadata: name, version, coverage, data sources, and links.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_sources',
    description: 'List all data sources with authority, URL, license, and freshness info.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'check_data_freshness',
    description: 'Check when data was last ingested, staleness status, and how to trigger a refresh.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_pests',
    description: 'Search pests, diseases, and weeds affecting Swiss crops. Use for broad queries about Schaedlinge, Krankheiten, Unkraeuter.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query (German or English, e.g. "Blattlaeuse Weizen", "Septoria")' },
        pest_type: { type: 'string', description: 'Filter by type: insect, disease, or weed' },
        crop: { type: 'string', description: 'Filter by affected crop (e.g. Winterweizen, Kartoffeln, Reben)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
        limit: { type: 'number', description: 'Max results (default: 20, max: 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_pest_details',
    description: 'Get full profile for a pest: lifecycle, identification, crops affected, and treatments. Use pest ID from search_pests.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pest_id: { type: 'string', description: 'Pest ID (e.g. blattlaeuse, septoria, ackerfuchsschwanz)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['pest_id'],
    },
  },
  {
    name: 'get_treatments',
    description: 'Get approved chemical and non-chemical controls for a specific pest. Includes products, active substances, and OELN alternatives.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pest_id: { type: 'string', description: 'Pest ID (e.g. rapsglanzkaefer, krautfaeule)' },
        approach: { type: 'string', description: 'Filter by approach: chemical, biological, cultural, or mechanical' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['pest_id'],
    },
  },
  {
    name: 'get_ipm_guidance',
    description: 'Get IPM (Integrierter Pflanzenschutz) guidance for a crop: OELN Schadschwellen, monitoring methods, cultural controls, prognosis systems.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        crop: { type: 'string', description: 'Crop name (e.g. Winterweizen, Kartoffeln, Reben, Apfel)' },
        pest_id: { type: 'string', description: 'Optional: filter to specific pest' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['crop'],
    },
  },
  {
    name: 'search_crop_threats',
    description: 'List all pests, diseases, and weeds that threaten a specific crop, with damage thresholds and monitoring advice.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        crop: { type: 'string', description: 'Crop name (e.g. Winterweizen, Winterraps, Kartoffeln)' },
        growth_stage: { type: 'string', description: 'Optional growth stage filter (e.g. Bestockung, Bluete, Knollenbildung)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['crop'],
    },
  },
  {
    name: 'identify_from_symptoms',
    description: 'Identify a pest, disease, or weed from symptom descriptions. Returns ranked differential diagnosis.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symptoms: { type: 'string', description: 'Symptom description (e.g. "gelbe Flecken auf Weizenblaettern", "Frass an Rapsblueten")' },
        crop: { type: 'string', description: 'Affected crop for narrowing results' },
        season: { type: 'string', description: 'Time of year (e.g. Fruehling, Sommer, Herbst)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['symptoms'],
    },
  },
  {
    name: 'get_approved_products',
    description: 'Search approved plant protection products (Pflanzenschutzmittel) from the BLW Verzeichnis. Filter by active substance, target pest, or crop.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        active_substance: { type: 'string', description: 'Active substance name (e.g. Glyphosat, Mancozeb, Spinosad)' },
        target_pest: { type: 'string', description: 'Target organism (e.g. Blattlaeuse, Unkraeuter, Pilzkrankheiten)' },
        crop: { type: 'string', description: 'Target crop (e.g. Winterweizen, Kartoffeln, Reben)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
];

const SearchPestsArgsSchema = z.object({
  query: z.string(),
  pest_type: z.string().optional(),
  crop: z.string().optional(),
  jurisdiction: z.string().optional(),
  limit: z.number().optional(),
});

const PestDetailsArgsSchema = z.object({
  pest_id: z.string(),
  jurisdiction: z.string().optional(),
});

const TreatmentsArgsSchema = z.object({
  pest_id: z.string(),
  approach: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const IpmGuidanceArgsSchema = z.object({
  crop: z.string(),
  pest_id: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const CropThreatsArgsSchema = z.object({
  crop: z.string(),
  growth_stage: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const IdentifyArgsSchema = z.object({
  symptoms: z.string(),
  crop: z.string().optional(),
  season: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const ApprovedProductsArgsSchema = z.object({
  active_substance: z.string().optional(),
  target_pest: z.string().optional(),
  crop: z.string().optional(),
  jurisdiction: z.string().optional(),
});

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

const db = createDatabase();

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'about':
        return textResult(handleAbout());
      case 'list_sources':
        return textResult(handleListSources(db));
      case 'check_data_freshness':
        return textResult(handleCheckFreshness(db));
      case 'search_pests':
        return textResult(handleSearchPests(db, SearchPestsArgsSchema.parse(args)));
      case 'get_pest_details':
        return textResult(handleGetPestDetails(db, PestDetailsArgsSchema.parse(args)));
      case 'get_treatments':
        return textResult(handleGetTreatments(db, TreatmentsArgsSchema.parse(args)));
      case 'get_ipm_guidance':
        return textResult(handleGetIpmGuidance(db, IpmGuidanceArgsSchema.parse(args)));
      case 'search_crop_threats':
        return textResult(handleSearchCropThreats(db, CropThreatsArgsSchema.parse(args)));
      case 'identify_from_symptoms':
        return textResult(handleIdentifyFromSymptoms(db, IdentifyArgsSchema.parse(args)));
      case 'get_approved_products':
        return textResult(handleGetApprovedProducts(db, ApprovedProductsArgsSchema.parse(args)));
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : String(err));
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
