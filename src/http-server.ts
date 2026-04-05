import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createDatabase, type Database } from './db.js';
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
const PORT = parseInt(process.env.PORT ?? '3000', 10);

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
        query: { type: 'string', description: 'Free-text search query (German or English)' },
        pest_type: { type: 'string', description: 'Filter by type: insect, disease, or weed' },
        crop: { type: 'string', description: 'Filter by affected crop' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
        limit: { type: 'number', description: 'Max results (default: 20, max: 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_pest_details',
    description: 'Get full profile for a pest: lifecycle, identification, crops affected, and treatments.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pest_id: { type: 'string', description: 'Pest ID (e.g. blattlaeuse, septoria)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['pest_id'],
    },
  },
  {
    name: 'get_treatments',
    description: 'Get approved chemical and non-chemical controls for a specific pest.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pest_id: { type: 'string', description: 'Pest ID' },
        approach: { type: 'string', description: 'Filter: chemical, biological, cultural, mechanical' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['pest_id'],
    },
  },
  {
    name: 'get_ipm_guidance',
    description: 'Get IPM guidance for a crop: OELN Schadschwellen, monitoring, cultural controls, prognosis systems.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        crop: { type: 'string', description: 'Crop name (e.g. Winterweizen, Kartoffeln, Reben)' },
        pest_id: { type: 'string', description: 'Optional: filter to specific pest' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['crop'],
    },
  },
  {
    name: 'search_crop_threats',
    description: 'List all pests, diseases, and weeds that threaten a specific crop.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        crop: { type: 'string', description: 'Crop name' },
        growth_stage: { type: 'string', description: 'Optional growth stage filter' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['crop'],
    },
  },
  {
    name: 'identify_from_symptoms',
    description: 'Identify a pest, disease, or weed from symptom descriptions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symptoms: { type: 'string', description: 'Symptom description in German or English' },
        crop: { type: 'string', description: 'Affected crop' },
        season: { type: 'string', description: 'Time of year' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['symptoms'],
    },
  },
  {
    name: 'get_approved_products',
    description: 'Search approved plant protection products from the BLW Pflanzenschutzmittelverzeichnis.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        active_substance: { type: 'string', description: 'Active substance name' },
        target_pest: { type: 'string', description: 'Target organism' },
        crop: { type: 'string', description: 'Target crop' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
];

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

function registerTools(server: Server, db: Database): void {
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
}

const db = createDatabase();
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

function createMcpServer(): Server {
  const mcpServer = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );
  registerTools(mcpServer, db);
  return mcpServer;
}

async function handleMCPRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
    return;
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid or missing session ID' }));
    return;
  }

  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await mcpServer.connect(transport);

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
    mcpServer.close().catch(() => {});
  };

  await transport.handleRequest(req, res);

  if (transport.sessionId) {
    sessions.set(transport.sessionId, { transport, server: mcpServer });
  }
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', server: SERVER_NAME, version: SERVER_VERSION }));
    return;
  }

  if (url.pathname === '/mcp' || url.pathname === '/') {
    try {
      await handleMCPRequest(req, res);
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(PORT, () => {
  console.log(`${SERVER_NAME} v${SERVER_VERSION} listening on port ${PORT}`);
});
