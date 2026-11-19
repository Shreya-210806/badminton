# AWS Deployment Guide — ShuttlePulse

Architecture: **Amplify** (React client) → **Elastic Beanstalk** (Express API) → **DynamoDB** (data).
**Parameter Store** holds secrets; **SES** sends email. Pick one region (examples use `ap-south-1`) for everything.

> Order matters: do steps 1 → 5 in sequence.

---

## 1. Systems Manager Parameter Store (secrets)

Console → Systems Manager → Parameter Store → Create parameter. Type **SecureString**.

| Name | Value |
|---|---|
| `/shuttlepulse/prod/JWT_SECRET` | any long random string (64+ chars) |
| `/shuttlepulse/prod/CLIENT_URL` | your Amplify URL, e.g. `https://main.xxxx.amplifyapp.com` (add after step 4, then restart the EB environment) |

The API reads everything under `SSM_PARAMETER_PATH` at startup and puts it in `process.env`.

## 2. Amazon SES (email)

1. SES → Verified identities → **Create identity** → Email address (e.g. your own email) → click the verification link.
2. In a new account SES is in **sandbox**: it can only send **to verified addresses**. For the demo, verify the recipient emails you will test with (or request production access).
3. The verified address is `SES_FROM_EMAIL` below.

## 3. Elastic Beanstalk (API) + DynamoDB

DynamoDB needs no manual setup: the API creates its 11 tables on first start and seeds demo data.

**3a. IAM permissions.** IAM → Policies → Create policy → JSON → paste `deploy/iam-policy.json` → name it `ShuttlePulseAppPolicy`.
Then attach it to the role **`aws-elasticbeanstalk-ec2-role`** (create the default EB instance profile if it doesn't exist).

**3b. Create the environment.**
1. Elastic Beanstalk → Create application → platform **Node.js** (latest), sample code not needed.
2. Upload `badminton-crm-api-eb.zip` (server bundle, provided) as the application version.
3. Presets: *Single instance* is the cheapest. 
4. Configuration → Updates, monitoring and logging → **Environment properties**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `AWS_REGION` | `ap-south-1` |
| `SSM_PARAMETER_PATH` | `/shuttlepulse/prod/` |
| `SES_FROM_EMAIL` | your verified SES address |
| `DYNAMODB_AUTO_CREATE_TABLES` | `true` |

   Do **not** set `DYNAMODB_ENDPOINT` (that is only for local development). `PORT` is set by Beanstalk automatically.
5. Open the environment URL + `/api/health` — you should see `"database":{"connected":true,"mode":"dynamodb"...}`.
6. Log in test: `POST /api/auth/login` with `admin@shuttlepulse.org` / `Admin@123`.

## 4. Amplify Hosting (React client)

1. Push this project to GitHub/GitLab/CodeCommit.
2. Amplify → Create new app → connect the repo/branch. It detects `amplify.yml` (monorepo, `appRoot: client`).
3. Environment variables: `VITE_API_URL` = `/api` (keep the default; see the rewrite below).
4. **Rewrites and redirects** (App settings) — add in this order:

| Source | Target | Type |
|---|---|---|
| `/api/<*>` | `http://<your-eb-environment-url>/api/<*>` | 200 (Rewrite) |
| `</^[^.]+$\|\.(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

The first rule lets the HTTPS site talk to the API without mixed-content errors.
If the browser still blocks it, use the alternative below.

**Alternative (HTTPS directly on the API):** you need a domain. Request a free ACM certificate, give the Beanstalk environment a load balancer (Configuration → Capacity → Load balanced), add an HTTPS :443 listener with the certificate, point a DNS name at it, then set `VITE_API_URL=https://api.yourdomain.com/api` in Amplify and redeploy.

## 5. Final checks

- Set `CLIENT_URL` in Parameter Store to the Amplify URL, then in EB: Actions → Restart app server(s).
- Visit the Amplify URL → public pages load → sign in as admin → Communications → send an announcement (emails go out via SES to verified addresses).
- "Forgot password" sends the reset code by SES email when `SES_FROM_EMAIL` is set.

## Notes

- **Data access:** queries use DynamoDB Scan with in-memory filtering (`server/src/db/odm.js`). That is fine for demo/small tournaments; for large data add GSIs and Query calls.
- **Local development:** `cd server && npm run dev:local-db` starts a DynamoDB emulator on port 8000; with `DYNAMODB_ENDPOINT=http://localhost:8000` in `server/.env` the API runs with no AWS account.
- **Cost:** DynamoDB on-demand + EB single instance (t3.micro) + Amplify are low-cost for a demo. Delete the EB environment and Amplify app when done.
- **Demo data:** the API seeds demo data when the User table is empty. Set `SEED_ON_STARTUP=false` to disable.
