import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

/**
 * Loads configuration/secrets from AWS Systems Manager Parameter Store into process.env.
 * Enabled when SSM_PARAMETER_PATH is set (e.g. /shuttlepulse/prod/).
 * /shuttlepulse/prod/JWT_SECRET  ->  process.env.JWT_SECRET
 * Values already present in the environment are never overwritten.
 */
export async function loadSecrets() {
  const path = process.env.SSM_PARAMETER_PATH;
  if (!path) return { loaded: 0, source: 'env' };

  const client = new SSMClient({ region: process.env.AWS_REGION || 'ap-south-1' });
  const prefix = path.endsWith('/') ? path : `${path}/`;
  let loaded = 0;
  let nextToken;
  do {
    const out = await client.send(
      new GetParametersByPathCommand({ Path: prefix, Recursive: false, WithDecryption: true, NextToken: nextToken })
    );
    for (const p of out.Parameters || []) {
      const key = p.Name.slice(prefix.length);
      if (key && process.env[key] === undefined) {
        process.env[key] = p.Value;
        loaded += 1;
      }
    }
    nextToken = out.NextToken;
  } while (nextToken);

  console.log(`[Secrets] Loaded ${loaded} parameter(s) from AWS Parameter Store (${prefix})`);
  return { loaded, source: 'ssm' };
}
