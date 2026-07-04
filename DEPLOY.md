# Deploying for free on Oracle Cloud (Always Free)

This guide takes the app from GitHub to a public HTTPS URL at zero
monthly cost:

- **Server**: Oracle Cloud "Always Free" ARM VM (up to 4 CPU / 24 GB
  RAM, free forever — needs a credit card for identity verification at
  signup, but is not charged).
- **Database**: MongoDB runs on the same VM via docker compose (data on
  the VM's disk, no external DB service needed).
- **Domain + HTTPS**: a free `*.duckdns.org` subdomain, with Let's
  Encrypt certificates obtained and renewed automatically by Caddy.

Total time: roughly 30–45 minutes, most of it Oracle signup.

---

## 1. Create the free VM

1. Sign up at <https://signup.cloud.oracle.com> (pick a home region
   close to your users, e.g. India West/South — the region cannot be
   changed later).
2. Console → **Compute → Instances → Create instance**:
   - Image: **Ubuntu 24.04** (aarch64).
   - Shape: **Ampere → VM.Standard.A1.Flex**, e.g. 2 OCPU / 12 GB RAM
     (anything within 4 OCPU / 24 GB total stays free).
   - Networking: create the default VCN with a public subnet; make sure
     **Assign a public IPv4 address** is checked.
   - Add your SSH public key.
3. Open the firewall for web traffic. Console → your instance's
   **Virtual Cloud Network → Security Lists → Default Security List →
   Add Ingress Rules**:
   - Source `0.0.0.0/0`, protocol TCP, destination port `80`
   - Source `0.0.0.0/0`, protocol TCP, destination port `443`
4. (Recommended) Make the public IP permanent: instance → attached VNIC
   → IPv4 addresses → edit → change *Ephemeral* to **Reserved public
   IP** (also free). This stops the IP changing if the instance is ever
   stopped.

## 2. Get a free domain (DuckDNS)

1. Sign in at <https://www.duckdns.org> (GitHub/Google login).
2. Create a subdomain, e.g. `myjeeprep` → gives you
   `myjeeprep.duckdns.org`.
3. Set its IP to the VM's public IPv4 address and click *update ip*.

## 3. Install Docker on the VM

SSH in (`ssh ubuntu@<public-ip>`) and run:

```bash
# Docker Engine + compose plugin (official convenience script)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# log out and back in so the group change applies
exit
```

Ubuntu on Oracle also runs its own iptables rules; the security list
rules from step 1.3 plus Docker's published ports are enough for this
stack, but if ports 80/443 seem unreachable, allow them locally too:

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 4. Deploy the app

```bash
git clone https://github.com/vjauhari-work/jee.git
cd jee

# Create the environment file and fill in real values
cp .env.example .env
nano .env
```

Set in `.env`:

- `MONGO_INITDB_ROOT_PASSWORD` and the matching password inside
  `MONGO_URI` — generate with `openssl rand -hex 16`
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `ADMIN_PASSWORD` — the admin login for the site
- `COOKIE_SECURE=true` (we serve over HTTPS)
- `DOMAIN=myjeeprep.duckdns.org` (your DuckDNS name, uncommented)
- `ACME_EMAIL=you@example.com` (uncommented)

Then start everything:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The first build takes a few minutes on the ARM VM. Caddy requests the
Let's Encrypt certificate on first start; within a minute or so,

```
https://myjeeprep.duckdns.org
```

serves the site with a valid certificate, and HTTP redirects to HTTPS.

## 5. Verify

```bash
docker compose ps                        # all services healthy
curl -I https://<your-domain>/           # 200, security headers present
```

Log in with the admin account, or register a test student account.
Import questions with the PDF importer (see CLAUDE.md) — run it on the
VM, or locally against a temporary SSH tunnel:
`ssh -L 27017:localhost:27017 ubuntu@<public-ip>`.

## 6. Updates and operations

**Deploy a new version** (after merging to main):

```bash
cd ~/jee && git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**Nightly database backup** (keeps 14 days, stored in ~/backups —
consider also copying these off the VM occasionally):

```bash
mkdir -p ~/backups
crontab -e   # add:
0 3 * * * docker compose -f ~/jee/docker-compose.yml exec -T mongodb mongodump --archive --gzip -u admin -p "$(grep ^MONGO_INITDB_ROOT_PASSWORD ~/jee/.env | cut -d= -f2-)" > ~/backups/mongo-$(date +\%F).gz 2>/dev/null && find ~/backups -name 'mongo-*.gz' -mtime +14 -delete
```

**Logs**: `docker compose logs -f backend` (or `web`, `caddy`,
`mongodb`).

## Notes

- Do not start the `debug` profile (mongo-express) on the server.
- MongoDB and the backend API stay bound to the VM's loopback; only
  Caddy's ports 80/443 are public.
- Everything here also works on any other Ubuntu/Debian VPS — only
  step 1 is Oracle-specific.
