# ShuttlePulse AWS deployment

This repository already contains application-side integrations for Amplify, Elastic
Beanstalk, DynamoDB, and S3. Repository configuration does **not** prove that an AWS
resource exists or is currently working. This workspace has no AWS CLI or configured
AWS identity, so confirm the live account state in the AWS Console before making
changes.

The steps below are intentionally gated: do not create an app/environment, change
IAM, enable billable monitoring/logging, or deploy until the owner approves those
actions. Keep the Console region set to **Asia Pacific (Mumbai), `ap-south-1`**.
Never use table-creation, seed, bucket-creation, or deletion steps against existing
production data.

## Status from repository inspection

| Service | Repository evidence | What remains to verify in AWS |
|---|---|---|
| AWS Amplify | `amplify.yml` builds the Vite app in `client/`. | Whether an Amplify app is already connected to this GitHub repo/branch and has a successful deployment. |
| Elastic Beanstalk | `server/Procfile` starts the Express backend; the health route is `/api/health`. | Whether an application/environment exists, its URL, platform version, health, and attached instance profile. |
| DynamoDB | AWS SDK and document mapper use `${DYNAMODB_TABLE_PREFIX}_${model}`; the configured prefix must be `shuttlepulse`. | Confirm the 11 expected `shuttlepulse_<Model>` tables exist in `ap-south-1`, and review their data before deployment. |
| S3 | The authenticated upload route writes to `shuttlepulse-badminton-storage` by default. | Confirm that bucket exists in `ap-south-1`, its ownership/encryption/block-public-access settings, and the EB role's scoped write permission. |
| CloudWatch | The Express app writes application and request logs to stdout/stderr. No CloudWatch configuration is in this repo. | Check whether EB log streaming/monitoring is already enabled. Enabling log storage/metrics may incur charges. |

If a resource already exists, inspect and reuse it; do not create a duplicate. Create a
missing resource only after approval and after checking whether doing so incurs cost.

## Existing application integration and production behavior

- **Amplify:** `amplify.yml` sets `appRoot: client`, runs `npm ci` and `npm run build`,
  and publishes `client/dist`.
- **Elastic Beanstalk:** upload a bundle whose root contains `Procfile`, `package.json`,
  `package-lock.json`, and `src/`. EB supplies `PORT`.
- **DynamoDB:** table names are `shuttlepulse_User`, `shuttlepulse_Player`,
  `shuttlepulse_Tournament`, `shuttlepulse_Team`, `shuttlepulse_Registration`,
  `shuttlepulse_Match`, `shuttlepulse_Payment`, `shuttlepulse_Notification`,
  `shuttlepulse_AuditLog`, `shuttlepulse_OrganizationSetting`, and
  `shuttlepulse_TournamentUpdate`. Verify exact names before deploying.
- **S3:** the app accepts authenticated JPG, PNG, WEBP, and PDF uploads (maximum 5 MB)
  under `player-photos/`, `tournament-images/`, `team-logos/`, and `certificates/`.
  The backend writes objects; it does not make the bucket public.
- **Production safeguards:** with `NODE_ENV=production`, the app validates that
  expected DynamoDB tables exist and will not create missing tables or seed demo
  records. A missing table causes startup to fail explicitly. Local development keeps
  its current table-creation/seeding defaults.
- **Secrets:** the backend can load values from SSM Parameter Store when
  `SSM_PARAMETER_PATH` is set. Environment variables already set on EB take precedence.

Do not run `npm run seed` against production: the standalone seed command forcibly
clears and recreates application records.

## 1. Inspect AWS Console before deployment

1. Sign in to the AWS Console and select **Asia Pacific (Mumbai) `ap-south-1`** in the
   region selector.
2. Open **DynamoDB → Tables** and search for `shuttlepulse_`. Confirm all 11 exact
   table names listed above are present. Open each table and confirm its partition key
   is `_id` (String). Do not click **Create table**.
3. Open **Amazon S3 → Buckets** and search for
   `shuttlepulse-badminton-storage`. Confirm the bucket's Region is Mumbai. Do not
   click **Create bucket**, change its public-access block, or replace its data.
4. Open **Elastic Beanstalk → Applications** and **AWS Amplify → All apps**. Search
   for an existing ShuttlePulse app/environment. Record its region, name, URL, source
   branch, and health. Reuse an existing healthy deployment.
5. In **CloudWatch → Logs → Log groups**, search for `/aws/elasticbeanstalk/`. This
   helps identify existing log streaming; retain existing groups and data.

## 2. IAM permissions (approval required before applying)

Do not attach new permissions until explicitly approved. Inspect the EB environment's
EC2 instance profile in **Elastic Beanstalk → Environment → Configuration → Security**
and **IAM → Roles** first. Preserve existing policies and add only scoped permissions
needed for the integrations.

The backend role needs:

- DynamoDB `ListTables`, `DescribeTable`, `GetItem`, `PutItem`, `UpdateItem`,
  `DeleteItem`, `Scan`, `Query`, `BatchGetItem`, and `BatchWriteItem` on
  `arn:aws:dynamodb:ap-south-1:<ACCOUNT_ID>:table/shuttlepulse_*`.
- S3 `PutObject` on
  `arn:aws:s3:::shuttlepulse-badminton-storage/*`.
- If SSM is used: `ssm:GetParametersByPath`, `ssm:GetParameters`, and
  `ssm:GetParameter` on
  `arn:aws:ssm:ap-south-1:<ACCOUNT_ID>:parameter/shuttlepulse/prod/*`.
- If existing SES email features are used, retain only the SES send permissions they
  already need.
- To stream EB logs, scoped CloudWatch Logs permissions for the EB log groups. Use
  the current AWS-managed Elastic Beanstalk web-tier policy/role setup or an
  account-specific custom policy after reviewing its exact scope.

Replace `<ACCOUNT_ID>` before applying any policy. Do **not** grant
`dynamodb:CreateTable`, S3 bucket-wide/public access, or permissions on unrelated
tables/buckets. Enabling log streaming and CloudWatch metrics can incur charges; get
approval first.

## 3. Prepare the backend bundle

From the repository root, after confirming the environment is safe to update:

```bash
cd server
zip -r ../shuttlepulse-api.zip Procfile package.json package-lock.json src \
  -x 'src/**/*.log'
cd ..
```

The archive must have `Procfile`, `package.json`, and `src/` at its root, not inside
an extra `server/` directory. Do not include `.env`, credentials, or
`node_modules/`.

## 4. Deploy/reuse Elastic Beanstalk

Only create an EB application/environment if none exists and that creation is
approved. If reusing one:

1. In **Elastic Beanstalk → Applications → [existing app] → [existing environment]**,
   verify **Region: ap-south-1**, current health, platform (**Node.js**), and instance
   profile before updating it.
2. Open **Upload and deploy**, select `shuttlepulse-api.zip`, give the application
   version a descriptive label, then deploy only with approval.
3. In **Configuration → Updates, monitoring, and logging → Software → Environment
   properties** (wording can vary by platform version), set:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `AWS_REGION` | `ap-south-1` |
   | `DYNAMODB_TABLE_PREFIX` | `shuttlepulse` |
   | `DYNAMODB_AUTO_CREATE_TABLES` | `false` |
   | `SEED_ON_STARTUP` | `false` |
   | `S3_BUCKET_NAME` | `shuttlepulse-badminton-storage` |
   | `SSM_PARAMETER_PATH` | `/shuttlepulse/prod/` if using Parameter Store; otherwise omit |
   | `CLIENT_URL` | Exact Amplify HTTPS origin, with no trailing slash |

   Do not set `DYNAMODB_ENDPOINT` in AWS. `PORT` is supplied by EB. Set
   `JWT_SECRET` as a SecureString in SSM or as a protected EB environment property;
   never commit it or put it in Amplify's frontend environment.
4. In **Configuration → Security**, retain the current instance profile if correct.
   Change/attach permissions only after approval. In **Configuration → Capacity**,
   do not select a paid or higher-capacity option without approval.
5. When the deployment reports healthy, open
   `https://<environment-host>/api/health` (or `http://` if no TLS endpoint exists).
   Confirm `success: true`, `database.connected: true`, and the correct AWS region.

### Backend artifact command

The current Git remote is `https://github.com/Shreya-210806/badminton`; use the
existing repo/branch rather than creating another repository. For repeatable deploys,
you can also configure EB to consume the uploaded source bundle through the Console.
Do not put AWS credentials in the repository or GitHub.

## 5. Deploy/reuse Amplify Hosting

Only create an Amplify app if none exists and that creation is approved.

1. In **AWS Amplify → All apps**, select an existing app or click **New app → Host web
   app** only if creation is approved.
2. Choose **GitHub**, authorize the existing `Shreya-210806/badminton` repository if
   needed, and select the intended branch (normally `main`). Review the build settings
   before saving.
3. For this monorepo set `AMPLIFY_MONOREPO_APP_ROOT=client` if prompted/required by
   the Console. Confirm the build spec uses the checked-in `amplify.yml`, and that the
   artifact directory is `dist` relative to `client`.
4. Add frontend build variable `VITE_API_URL=/api`. This variable is public in the
   generated JavaScript; never put secrets or AWS credentials in a `VITE_` variable.
5. If the API has no public HTTPS endpoint, configure a **reverse proxy** under
   **App settings → Rewrites and redirects** (API rule first):

   | Source | Target | Type |
   |---|---|---|
   | `/api/<*>` | `http(s)://<EB-environment-host>/api/<*>` | `200 (Rewrite)` |
   | `/<*>` | `/index.html` | `200 (Rewrite)` |

   Use the EB host's actual scheme. Prefer HTTPS for the API. If using the API host
   directly instead of an Amplify proxy, set `VITE_API_URL` to
   `https://<api-domain>/api` and configure the EB CORS origin and TLS accordingly.
6. Save and deploy only with approval. Wait for the branch's build to succeed, then
   open the Amplify domain and verify direct navigation/reload of a nested route.
7. Update the backend's `CLIENT_URL` to the exact Amplify origin and restart/redeploy
   the EB app if it changed.

## 6. CloudWatch logs and monitoring (approval required)

First inspect existing EB logging. If not enabled and approved:

1. Open **Elastic Beanstalk → Applications → [app] → [environment] →
   Configuration → Updates, monitoring, and logging → Edit**.
2. Under **Log streaming to Amazon CloudWatch Logs**, enable streaming for instance
   logs. Keep the existing retention setting or choose a retention period only after
   approval; log ingestion/storage may be billable.
3. Leave any **delete logs on environment termination** option disabled so existing
   logs are preserved.
4. Under **Monitoring**, retain current settings. Enable enhanced health/extra
   CloudWatch metrics only after confirming the associated cost and obtaining
   approval.
5. Save changes, then check **CloudWatch → Logs → Log groups** for the EB environment
   and confirm new application stdout/stderr entries arrive. The Express app logs
   startup, request, and error messages there.

The application does not currently define custom CloudWatch metrics or alarms. To
add alarms (for example, unhealthy environment or elevated 5xx responses), agree on
thresholds and cost before creating them.

## 7. Deployment verification

Run these checks only after the owner has approved deployment and any relevant
billable/permission changes:

1. **Frontend:** open the Amplify URL; load the home page; directly navigate to and
   reload a nested route; check browser developer tools for failed API requests.
2. **API:** open `https://<api-host>/api/health` or request it through the Amplify
   `/api/health` proxy. Expect HTTP 200 and `database.connected: true`.
3. **DynamoDB:** use an existing read-only public endpoint (for example tournament
   listing) and confirm data is returned. Confirm the request does not create tables
   and no seed records were added. Do not write/delete test records in production
   without approval.
4. **S3:** authenticate with a test account, upload a small permitted image/PDF via
   the application's upload flow, and verify the returned object key in the
   pre-existing bucket under an allowed folder. Obtain approval before uploading
   test data; remove it only if explicitly approved.
5. **CloudWatch:** check the EB environment's log group for the API startup/request
   log and review the environment health status.

This workspace cannot run AWS-backed tests until account access is configured and
the above changes are approved. Do not report a service as deployed/working based
only on the presence of its client code or a repository config file.
