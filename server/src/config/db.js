import './../models/index.js';
import { modelNames } from '../db/odm.js';
import { ensureTables } from '../db/dynamo.js';
import { seedDatabase } from '../seed/seedData.js';

let state = { connected: false, mode: 'dynamodb', region: null, endpoint: null };

export const getDbInfo = () => state;

export const connectDB = async () => {
  const region = process.env.AWS_REGION || 'ap-south-1';
  const endpoint = process.env.DYNAMODB_ENDPOINT || null;
  if (process.env.DYNAMODB_AUTO_CREATE_TABLES !== 'false') {
    await ensureTables(modelNames());
  }
  state = { connected: true, mode: endpoint ? 'dynamodb-local' : 'dynamodb', region, endpoint };
  console.log(`[DB] DynamoDB ready (${state.mode}, region ${region})`);
  if (process.env.SEED_ON_STARTUP !== 'false') {
    await seedDatabase({ force: false });
  }
  return state;
};

export const disconnectDB = async () => {};
