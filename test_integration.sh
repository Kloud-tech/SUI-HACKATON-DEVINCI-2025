#!/bin/bash

# Test d'intégration Frontend ↔ Backend
# Ce script vérifie que tous les composants sont correctement configurés

set -e

echo "🧪 Testing Frontend ↔ Backend Integration"
echo "========================================"
echo ""

# 1. Vérifier que Docker tourne
echo "1️⃣  Checking Docker listener..."
if docker ps | grep -q "chimera-battle-listener"; then
    echo "   ✅ Docker listener is running"
else
    echo "   ❌ Docker listener is NOT running"
    echo "   → Run: cd agent_architecture/nautilus && docker-compose up -d"
    exit 1
fi

# 2. Vérifier les IDs dans la config frontend
echo ""
echo "2️⃣  Checking frontend config..."
FRONTEND_PKG=$(grep "PACKAGE_ID" front/src/config/chimera.ts | cut -d'"' -f2)
DOCKER_PKG=$(grep "BATTLE_PACKAGE_ID" agent_architecture/nautilus/.env | cut -d'=' -f2)

echo "   Frontend Package ID: $FRONTEND_PKG"
echo "   Docker Package ID:   $DOCKER_PKG"

if [ "$FRONTEND_PKG" = "$DOCKER_PKG" ]; then
    echo "   ✅ Package IDs match"
else
    echo "   ⚠️  Package IDs differ - make sure you're using the same deployment"
fi

# 3. Vérifier que le frontend est installé
echo ""
echo "3️⃣  Checking frontend dependencies..."
if [ -d "front/node_modules" ]; then
    echo "   ✅ node_modules exists"
else
    echo "   ❌ node_modules missing"
    echo "   → Run: cd front && npm install"
    exit 1
fi

# 4. Afficher les commandes pour lancer
echo ""
echo "4️⃣  Ready to launch!"
echo ""
echo "   Terminal 1 (Frontend):"
echo "   $ cd front && npm run dev"
echo ""
echo "   Terminal 2 (Docker logs):"
echo "   $ cd agent_architecture/nautilus && docker-compose logs -f battle-listener"
echo ""
echo "   Then open: http://localhost:3000/battle"
echo ""

# 5. Vérifier les derniers événements
echo "5️⃣  Recent battle events on-chain:"
docker exec chimera-battle-listener python -c "
import os
os.environ['BATTLE_PACKAGE_ID'] = '$DOCKER_PKG'
from battle_request_listener import BattleRequestListener
listener = BattleRequestListener()
events, _ = listener._pull_requests()
print(f'   Found {len(events)} pending battle requests')
for i, event in enumerate(events[:3]):
    req_id = event.get('parsedJson', {}).get('request_id', '?')
    print(f'   - Request #{req_id}')
" 2>/dev/null || echo "   (No events or Docker not accessible)"

echo ""
echo "✅ Integration check complete!"
echo ""
echo "🎮 WORKFLOW:"
echo "   1. Open http://localhost:3000/battle"
echo "   2. Connect your Sui wallet"
echo "   3. Select 2 monsters"
echo "   4. Click 'Request Battle'"
echo "   5. Watch Docker logs process the battle"
echo "   6. See results appear in 'Recent Battles' section"
echo ""
