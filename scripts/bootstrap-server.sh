#!/usr/bin/env bash
# Veloura — VPS bootstrap script
#
# Idempotent setup for a fresh Ubuntu 24.04 host so it can run the
# Veloura production stack. Re-running is safe — every step validates
# its current state before changing anything.
#
# What this script DOES
#   1. Installs OS packages: docker, git, ufw, fail2ban, jq, etc.
#   2. Installs Node.js 20.x (host-side prebuild — see Dockerfile)
#   3. Creates a non-root `deploy` user in the docker group
#   4. Hardens sshd (no password auth, no root password login)
#   5. Configures UFW firewall (22, 80, 443 only)
#   6. Enables fail2ban for SSH brute-force protection
#   7. Sets vm.overcommit_memory=1 (required by Redis)
#   8. Configures timezone + NTP
#   9. Disables Netdata's postgres auto-discovery if Netdata is present
#
# What this script DOES NOT do
#   - Provision the VPS itself (run on an existing Ubuntu host)
#   - Clone the Veloura repo (do that as `deploy` afterwards)
#   - Create .env.prod with production secrets
#   - Restore DB / MinIO backups
#   - Generate SSH deploy keys (see step-by-step at the end)
#   - Restart sshd (deliberate — caller must verify key auth first)
#
# Usage (from a fresh root SSH session on the new VPS)
#   scp scripts/bootstrap-server.sh root@NEW_IP:/tmp/
#   ssh root@NEW_IP 'bash /tmp/bootstrap-server.sh'
#
# Tested on Ubuntu 24.04 LTS.

set -euo pipefail

# ── Helpers ─────────────────────────────────────────────────────────
log()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[1;33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

require_root() {
  if [ "$(id -u)" != "0" ]; then
    die "This script must run as root (use sudo)."
  fi
}

# ── 0. Preflight ────────────────────────────────────────────────────
require_root

if [ ! -f /etc/os-release ] || ! grep -q "Ubuntu" /etc/os-release; then
  warn "Not Ubuntu — script tested on Ubuntu 24.04. Continuing anyway."
fi

# ── 1. Base packages ────────────────────────────────────────────────
log "Installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -yq \
  ca-certificates \
  curl \
  wget \
  git \
  ufw \
  fail2ban \
  openssl \
  unzip \
  jq \
  htop \
  vim \
  gnupg \
  lsb-release
ok "Base packages installed"

# ── 2. Docker (official upstream repo) ─────────────────────────────
log "Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -yq \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin
  systemctl enable --now docker
  ok "Docker installed ($(docker --version))"
else
  systemctl enable --now docker || true
  ok "Docker already installed ($(docker --version))"
fi

# ── 3. Node.js 20 (host prebuild — see Dockerfile header) ──────────
log "Installing Node.js 20"
if ! command -v node >/dev/null 2>&1 || ! node --version | grep -qE "^v20\."; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -yq nodejs
  ok "Node $(node --version) installed"
else
  ok "Node already installed ($(node --version))"
fi

# ── 4. `deploy` user ────────────────────────────────────────────────
log "Creating deploy user"
if ! id deploy >/dev/null 2>&1; then
  useradd -m -s /bin/bash -G docker deploy
  ok "User 'deploy' created"
else
  usermod -aG docker deploy || true
  ok "User 'deploy' already exists (ensured docker group membership)"
fi

# Make sure ~deploy/.ssh has the right perms even if user existed.
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
install -d -m 755 -o deploy -g deploy /home/deploy/apps
ok "/home/deploy/.ssh and /home/deploy/apps ready"

# ── 5. sshd hardening ──────────────────────────────────────────────
log "Hardening sshd_config"
SSHD_CONFIG=/etc/ssh/sshd_config
# Idempotent in-place edits — only changes lines that don't already match.
sed -i \
  -e 's/^#*\s*PasswordAuthentication.*/PasswordAuthentication no/' \
  -e 's/^#*\s*PermitRootLogin.*/PermitRootLogin prohibit-password/' \
  -e 's/^#*\s*PermitEmptyPasswords.*/PermitEmptyPasswords no/' \
  -e 's/^#*\s*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' \
  "$SSHD_CONFIG"
ok "sshd_config patched"
warn "sshd NOT restarted automatically — reload it manually AFTER you verify"
warn "you can ssh as 'deploy' with an SSH key:"
warn "    sudo systemctl reload sshd"

# ── 6. UFW firewall ────────────────────────────────────────────────
log "Configuring UFW"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp comment SSH >/dev/null
ufw allow 80/tcp comment HTTP >/dev/null
ufw allow 443/tcp comment HTTPS >/dev/null
yes | ufw enable >/dev/null
ok "UFW active: 22, 80, 443 allowed in"

# ── 7. fail2ban ────────────────────────────────────────────────────
log "Enabling fail2ban"
systemctl enable --now fail2ban
ok "fail2ban active ($(fail2ban-client status 2>/dev/null | grep -c sshd || echo 0) sshd jail)"

# ── 8. Sysctl: vm.overcommit_memory=1 (Redis requirement) ──────────
log "Setting vm.overcommit_memory=1"
SYSCTL_FILE=/etc/sysctl.d/99-veloura.conf
cat > "$SYSCTL_FILE" <<'EOF'
# Veloura: required by Redis to avoid BGSAVE failures under low memory.
# Without this, redis logs:
#   WARNING Memory overcommit must be enabled! Without it, a background
#   save or replication may fail under low memory condition.
vm.overcommit_memory = 1
EOF
sysctl --system >/dev/null
ok "vm.overcommit_memory=$(sysctl -n vm.overcommit_memory)"

# ── 9. Time / NTP ──────────────────────────────────────────────────
log "Configuring time + NTP"
timedatectl set-timezone America/Lima
timedatectl set-ntp true
ok "Timezone=$(timedatectl show -p Timezone --value), NTP=$(timedatectl show -p NTP --value)"

# ── 10. Netdata postgres collector (disable if Netdata is installed) ─
log "Configuring Netdata (if present)"
if [ -d /etc/netdata ]; then
  cat > /etc/netdata/go.d.conf <<'EOF'
# Veloura: disable postgres auto-discovery to stop auth-failure noise
# in postgres logs. The default credentials Netdata tries don't match
# our scram-sha-256-protected veloura postgres. Re-enable later if you
# want real monitoring with a configured netdata user + password.
modules:
  postgres: no
EOF
  systemctl is-active netdata >/dev/null 2>&1 && systemctl reload netdata 2>/dev/null || true
  ok "Netdata postgres collector disabled"
else
  ok "Netdata not installed (skipping)"
fi

# ── 11. Final summary + next steps ─────────────────────────────────
log "Bootstrap complete"

cat <<'NEXT_STEPS'

──────────────────────────────────────────────────────────────────────
NEXT STEPS (perform as the `deploy` user unless noted)
──────────────────────────────────────────────────────────────────────

  1. Copy your SSH public key into /home/deploy/.ssh/authorized_keys
     (do this BEFORE the next step or you will lock yourself out):
         echo "ssh-ed25519 AAAA..." >> /home/deploy/.ssh/authorized_keys

  2. From your laptop, verify you can ssh as `deploy` with the key.

  3. As root, reload sshd to apply the hardened config:
         sudo systemctl reload sshd

  4. Switch to the deploy user and generate a GitHub deploy key:
         sudo -iu deploy
         ssh-keygen -t ed25519 -C "deploy@$(hostname)" \
           -f /home/deploy/.ssh/veloura_deploy -N ""
         cat /home/deploy/.ssh/veloura_deploy.pub
     Paste the public key into the GitHub repo:
       Settings → Deploy keys → Add → check "Allow write access"

  5. Configure ~/.ssh/config so git uses the deploy key:
         cat > /home/deploy/.ssh/config <<'CFG'
         Host github.com
             HostName github.com
             User git
             IdentityFile /home/deploy/.ssh/veloura_deploy
             IdentitiesOnly yes
         CFG
         chmod 600 /home/deploy/.ssh/config
         ssh -T git@github.com   # should say "Hi <repo-name>!"

  6. Clone the Veloura repo:
         cd /home/deploy/apps
         git clone git@github.com:luisangel2895/veloura-backend.git veloura
         cd veloura

  7. Create .env.prod with production secrets (generate with openssl):
         cp .env.prod.example .env.prod
         # Edit .env.prod and fill in:
         #   POSTGRES_PASSWORD=$(openssl rand -hex 32)
         #   JWT_SECRET=$(openssl rand -hex 32)
         #   COOKIE_SECRET=$(openssl rand -hex 32)
         #   MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)
         #   STRIPE_API_KEY=sk_test_...
         #   MEDUSA_BACKEND_URL=http://<server-ip-or-domain>
         chmod 600 .env.prod

  8. (Optional) Restore the DB from a recent backup if you have one:
         ./scripts/restore-db.sh path/to/backup.sql.gz docker

  9. Pre-build Medusa artifacts on the host (see Dockerfile header):
         export MEDUSA_BACKEND_URL=$(grep ^MEDUSA_BACKEND_URL= .env.prod | cut -d= -f2-)
         npm ci --no-audit --no-fund
         npm run build
         rm -rf node_modules
         npm ci --omit=dev --no-audit --no-fund

 10. Bring up the full stack:
         docker compose -f docker-compose.prod.yml --env-file .env.prod \
           up -d --build

 11. Run migrations + seed + admin user (first deploy only):
         docker compose -f docker-compose.prod.yml --env-file .env.prod \
           run --rm --no-deps medusa npx medusa db:migrate
         docker compose -f docker-compose.prod.yml --env-file .env.prod \
           run --rm --no-deps medusa npx medusa exec ./src/scripts/seed.js
         docker exec veloura-medusa npx medusa user \
           --email admin@veloura.com --password 'CHANGE_ME'

 12. Schedule the nightly DB backup cron:
         (crontab -l 2>/dev/null | grep -v backup-db.sh; \
          echo "0 3 * * * cd /home/deploy/apps/veloura && ./scripts/backup-db.sh >> ./logs/backup.log 2>&1") \
           | crontab -

 13. Smoke test the stack:
         curl -s http://127.0.0.1/health
         curl -s http://127.0.0.1/caddyhealth
         curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/veloura

──────────────────────────────────────────────────────────────────────
NEXT_STEPS
