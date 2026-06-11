#!/usr/bin/env bash
# =============================================================
#  AlertMNS — Script de déploiement
#  VM : mns-vmd-cda5-037.mns.lan (192.168.23.28)
#  Usage : bash deploy.sh
# =============================================================
set -e

REPO="https://github.com/demonhunter57/alertmns.git"
APP_DIR="/opt/alertmns"
WWW_DIR="/var/www/alertmns"
SERVICE="alertmns"

echo "=============================================="
echo "  AlertMNS — Déploiement"
echo "=============================================="

# ── 1. Mise à jour système ──────────────────────────────────
echo "[1/8] Mise à jour des paquets..."
sudo apt-get update -qq

# ── 2. Java 21 ─────────────────────────────────────────────
echo "[2/8] Installation Java 21..."
if ! java -version 2>&1 | grep -q "21"; then
    sudo apt-get install -y openjdk-21-jdk-headless
fi
java -version

# ── 3. Maven ───────────────────────────────────────────────
echo "[3/8] Installation Maven..."
if ! command -v mvn &>/dev/null; then
    sudo apt-get install -y maven
fi
mvn -version

# ── 4. Node.js 20 + npm ────────────────────────────────────
echo "[4/8] Installation Node.js 20..."
if ! node -v 2>/dev/null | grep -q "v20"; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
node -v && npm -v

# ── 5. Nginx ───────────────────────────────────────────────
echo "[5/8] Installation Nginx..."
if ! command -v nginx &>/dev/null; then
    sudo apt-get install -y nginx
fi

# ── 6. Cloner / mettre à jour le dépôt ─────────────────────
echo "[6/8] Récupération du code source..."
if [ -d "$APP_DIR/.git" ]; then
    echo "  → Mise à jour du dépôt existant"
    git -C "$APP_DIR" pull origin master
else
    echo "  → Clonage du dépôt"
    sudo git clone "$REPO" "$APP_DIR"
    sudo chown -R tmichel:tmichel "$APP_DIR"
fi

# ── 7. Build Backend (Spring Boot → JAR) ───────────────────
echo "[7/8] Build du backend Spring Boot..."
cd "$APP_DIR/alertmns-backend"
mvn clean package -DskipTests -q
cp target/alertmns-backend-*.jar "$APP_DIR/alertmns-backend.jar"
echo "  ✔ JAR généré : $APP_DIR/alertmns-backend.jar"

# ── 8. Build Frontend (Angular → static files) ─────────────
echo "[8/8] Build du frontend Angular..."
cd "$APP_DIR/alertmns-frontend"
npm ci --silent
npx ng build --configuration=production
echo "  ✔ Frontend buildé"

# ── Déploiement Nginx ──────────────────────────────────────
echo "Déploiement des fichiers statiques Angular..."
sudo mkdir -p "$WWW_DIR"
sudo cp -r "$APP_DIR/alertmns-frontend/dist/alertmns-frontend/browser/." "$WWW_DIR/"
sudo chown -R www-data:www-data "$WWW_DIR"
echo "  ✔ Fichiers copiés dans $WWW_DIR"

# ── Configuration Nginx ────────────────────────────────────
echo "Configuration Nginx..."
sudo cp "$APP_DIR/deploy/nginx-alertmns.conf" /etc/nginx/sites-available/alertmns
sudo ln -sf /etc/nginx/sites-available/alertmns /etc/nginx/sites-enabled/alertmns
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
echo "  ✔ Nginx configuré"

# ── Service systemd ────────────────────────────────────────
echo "Configuration du service systemd..."
sudo cp "$APP_DIR/deploy/alertmns.service" /etc/systemd/system/alertmns.service
sudo systemctl daemon-reload
sudo systemctl enable alertmns
sudo systemctl restart alertmns
sleep 3
sudo systemctl status alertmns --no-pager
echo "  ✔ Service alertmns démarré"

echo ""
echo "=============================================="
echo "  DÉPLOIEMENT TERMINÉ ✔"
echo "  Application : http://mns-vmd-cda5-037.mns.lan"
echo "  IP directe  : http://192.168.23.28"
echo "=============================================="
