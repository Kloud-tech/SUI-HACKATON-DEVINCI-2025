#!/bin/bash
# Script pour créer 2 monstres de test et lancer un combat

set -e

PACKAGE_ID="0xc23f7f2e3e1f50d518e10e98bb57d6371db0a405e4768253b94f8d3db648bd73"
TREASURY_CAP="0x12fdc7dc1255258b304edd35c713a8fe6044844afa239ef61951b20bb099da4e"
SHOP_ID="0x881fb49e959b1f2ac3cc3c4d094485d78562cbbcf50dd208306727d377b27aac"
MY_ADDRESS="0x1eaa4d879ceb5d11bd7df658b6f61bf233c9744f466df25f5b85f5c5840ceab1"
BATTLE_CONFIG_ID="0x088982771baa5fb27dfbe683a2e9a3661c4ac986f3594a1243fa901ac9b9ee25"

echo "🪙 Step 1: Minting CIM tokens..."
sui client call \
  --package $PACKAGE_ID \
  --module cim_currency \
  --function mint \
  --args $TREASURY_CAP 10000000000 $MY_ADDRESS \
  --gas-budget 20000000

echo ""
echo "⏳ Waiting 5s for transaction..."
sleep 5

# Get CIM coin ID with balance
CIM_COIN=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("CIM_CURRENCY") and (.data.content.fields.balance | tonumber) > 1000) | .data.objectId' | head -1)
echo "✅ CIM Coin: $CIM_COIN"

if [ -z "$CIM_COIN" ]; then
  echo "❌ No CIM coin found! Exiting."
  exit 1
fi

echo ""
echo "🥚 Step 2: Buying first egg (Epic - rarity 3)..."
sui client call \
  --package $PACKAGE_ID \
  --module monster_hatchery \
  --function buy_egg \
  --args $SHOP_ID $CIM_COIN 3 \
  --gas-budget 20000000

echo ""
sleep 5

echo "🥚 Step 3: Buying second egg (Epic - rarity 3)..."
sui client call \
  --package $PACKAGE_ID \
  --module monster_hatchery \
  --function buy_egg \
  --args $SHOP_ID $CIM_COIN 3 \
  --gas-budget 20000000

echo ""
sleep 5

# Get egg IDs
EGGS=$(sui client objects --json | jq -r ".[] | select(.data.type | contains(\"Egg\")) | .data.objectId")
EGG1=$(echo "$EGGS" | sed -n 1p)
EGG2=$(echo "$EGGS" | sed -n 2p)

echo "✅ Egg 1: $EGG1"
echo "✅ Egg 2: $EGG2"

echo ""
echo "🐉 Step 4: Hatching first monster..."
CLOCK="0x6"
sui client call \
  --package $PACKAGE_ID \
  --module monster_hatchery \
  --function hatch_egg \
  --args $EGG1 $CLOCK "Dragon Alpha" \
  --gas-budget 20000000

echo ""
sleep 3

echo "🐉 Step 5: Hatching second monster..."
sui client call \
  --package $PACKAGE_ID \
  --module monster_hatchery \
  --function hatch_egg \
  --args $EGG2 $CLOCK "Dragon Beta" \
  --gas-budget 20000000

echo ""
sleep 3

# Get monster IDs
MONSTERS=$(sui client objects --json | jq -r ".[] | select(.data.type | contains(\"$PACKAGE_ID\") and .data.type | contains(\"Monster\")) | .data.objectId")
MONSTER1=$(echo "$MONSTERS" | sed -n 1p)
MONSTER2=$(echo "$MONSTERS" | sed -n 2p)

echo ""
echo "✅ Monster 1: $MONSTER1"
echo "✅ Monster 2: $MONSTER2"

echo ""
echo "⚔️  Step 6: Requesting battle on-chain..."
sui client call \
  --package $PACKAGE_ID \
  --module monster_battle \
  --function request_battle \
  --args $BATTLE_CONFIG_ID $MONSTER1 $MONSTER2 \
  --gas-budget 20000000

echo ""
echo "✅ Battle request sent!"
echo "📡 The Docker listener should pick it up and execute the battle..."
echo ""
echo "🔍 Check logs with: docker-compose logs -f battle-listener"
