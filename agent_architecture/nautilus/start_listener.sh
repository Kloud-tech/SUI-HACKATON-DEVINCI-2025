#!/bin/bash
set -e

echo "🚀 Chimera Battle Listener - Startup Script"
echo "============================================"

# Check .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure:"
    echo "  - BATTLE_PACKAGE_ID"
    echo "  - BATTLE_CONFIG_ID"
    echo "  - SUI_PRIVATE_KEY"
    exit 1
fi

# Source environment
source .env

# Validate required variables
if [ -z "$BATTLE_PACKAGE_ID" ] || [ "$BATTLE_PACKAGE_ID" = "0xYOUR_PACKAGE_ID" ]; then
    echo "❌ Error: BATTLE_PACKAGE_ID not configured in .env"
    exit 1
fi

if [ -z "$BATTLE_CONFIG_ID" ] || [ "$BATTLE_CONFIG_ID" = "0xYOUR_BATTLE_CONFIG_OBJECT" ]; then
    echo "❌ Error: BATTLE_CONFIG_ID not configured in .env"
    exit 1
fi

echo "✅ Configuration validated"
echo "   Package ID: ${BATTLE_PACKAGE_ID:0:20}..."
echo "   Config ID: ${BATTLE_CONFIG_ID:0:20}..."
echo ""

# Build and start Docker
echo "🐳 Building Docker image..."
docker-compose build

echo ""
echo "🎯 Starting Battle Listener..."
docker-compose up -d

echo ""
echo "✅ Battle Listener is running!"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f battle-listener"
echo ""
echo "🛑 Stop listener:"
echo "   docker-compose down"
echo ""
echo "🧪 Test with:"
echo "   sui client call --package $BATTLE_PACKAGE_ID \\"
echo "     --module monster_battle \\"
echo "     --function request_battle \\"
echo "     --args $BATTLE_CONFIG_ID <MONSTER1_ID> <MONSTER2_ID> \\"
echo "     --gas-budget 20000000"
