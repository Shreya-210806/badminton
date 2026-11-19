// Local DynamoDB emulator for development (no AWS account needed).
// Usage: npm run dev:local-db   then set DYNAMODB_ENDPOINT=http://localhost:8000
import dynalite from 'dynalite';

const port = Number(process.env.LOCAL_DYNAMO_PORT || 8000);
dynalite({ createTableMs: 0 }).listen(port, () => {
  console.log(`[Local DynamoDB] listening on http://localhost:${port}`);
});
