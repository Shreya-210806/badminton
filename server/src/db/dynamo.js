import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let rawClient = null;
let docClient = null;

export const tableName = (model) => `${process.env.DYNAMODB_TABLE_PREFIX || 'shuttlepulse'}_${model}`;

export function getClients() {
  if (!docClient) {
    const config = { region: process.env.AWS_REGION || 'ap-south-1' };
    // DYNAMODB_ENDPOINT lets you point at DynamoDB Local / dynalite during development.
    if (process.env.DYNAMODB_ENDPOINT) {
      config.endpoint = process.env.DYNAMODB_ENDPOINT;
      config.credentials = { accessKeyId: 'local', secretAccessKey: 'local' };
    }
    rawClient = new DynamoDBClient(config);
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return { rawClient, docClient };
}

export async function ensureTables(modelNames, { createMissing = true } = {}) {
  const { rawClient: client } = getClients();
  const existing = new Set();
  let start;
  do {
    const out = await client.send(new ListTablesCommand({ ExclusiveStartTableName: start }));
    (out.TableNames || []).forEach((n) => existing.add(n));
    start = out.LastEvaluatedTableName;
  } while (start);

  for (const model of modelNames) {
    const name = tableName(model);
    if (existing.has(name)) continue;
    if (!createMissing) {
      throw new Error(
        `Required DynamoDB table ${name} does not exist. Create it only after approval, or correct DYNAMODB_TABLE_PREFIX.`
      );
    }
    await client.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [{ AttributeName: '_id', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: '_id', KeyType: 'HASH' }],
      })
    );
    for (let i = 0; i < 30; i += 1) {
      const d = await client.send(new DescribeTableCommand({ TableName: name }));
      if (d.Table?.TableStatus === 'ACTIVE') break;
      await new Promise((r) => setTimeout(r, 500));
    }
    console.log(`[DB] Created DynamoDB table ${name}`);
  }
}
