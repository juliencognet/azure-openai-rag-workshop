import process from 'node:process';
import path from 'node:path';
import * as dotenv from 'dotenv';
import fp from 'fastify-plugin';

export interface AppConfig {
  azureSearchService: string;
  azureOpenAiUrl: string;
  azureOpenAiEmbeddingDeployment: string;
  azureOpenAiEmbeddingModel: string;
  kbFieldsContent: string;
  kbFieldsSourcePage: string;
  indexName: string;
  qdrantUrl: string;
}

export const unusedService = '__not_used__';

const camelCaseToUpperSnakeCase = (s: string) => s.replaceAll(/[A-Z]/g, (l) => `_${l}`).toUpperCase();

export default fp(
  async (fastify, _options) => {
    const environmentPath = path.resolve(process.cwd(), '../../.env');

    console.log(`Loading .env config from ${environmentPath}...`);
    dotenv.config({ path: environmentPath });

    const config: AppConfig = {
      azureSearchService: process.env.AZURE_SEARCH_SERVICE || '',
      azureOpenAiUrl: process.env.AZURE_OPENAI_URL || '',
      azureOpenAiEmbeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'embedding',
      azureOpenAiEmbeddingModel: process.env.AZURE_OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      kbFieldsContent: process.env.KB_FIELDS_CONTENT || 'content',
      kbFieldsSourcePage: process.env.KB_FIELDS_SOURCEPAGE || 'sourcepage',
      indexName: process.env.INDEX_NAME || 'kbindex',
      qdrantUrl: process.env.QDRANT_URL || '',
    };

    // If Qdrant is used, disable Azure Search but set the config value to avoid errors
    if (config.qdrantUrl) {
      config.azureSearchService = unusedService;
    }

    // Check that all config values are set
    for (const [key, value] of Object.entries(config)) {
      if (!value) {
        const variableName = camelCaseToUpperSnakeCase(key).replace('OPEN_AI', 'OPENAI');
        const message = `${variableName} environment variable must be set`;
        fastify.log.error(message);
        throw new Error(message);
      }
    }

    fastify.decorate('config', config);
  },
  {
    name: 'config',
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    config: AppConfig;
  }
}
