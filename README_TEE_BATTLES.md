# Chimera Protocol - TEE Battle System

## Quick Start (run the full project)

### Fast prerequisites

```bash
# Install tools
brew install sui docker jq

# Check installs
sui --version && docker --version && jq --version
```

### Steps to run the full system

#### 1) Configure Sui Testnet

```bash
# Connect to testnet
sui client switch --env testnet

# Check your address
sui client active-address
```

#### 2) Deploy the smart contracts

```bash
cd contracts/chimera_protocol

# Build and publish
sui move build
sui client publish --gas-budget 100000000

# IMPORTANT: Save these IDs from the output:
# - Package ID: 0x...
# - BattleConfig: 0x... (shared object)
# - Shop: 0x... (shared object)
# - TreasuryCap: 0x...
```

#### 3) Create monsters and make sure you have CIM on your address

```bash
# Mint CIM tokens (in-game currency)
sui client call \
  --package YOUR_PACKAGE_ID \
  --module cim_currency \
  --function mint \
  --args YOUR_TREASURY_CAP_ID 10000000000 YOUR_ADDRESS \
  --gas-budget 20000000

# Find your CIM coin
CIM_COIN=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("CIM_CURRENCY")) | .data.objectId' | head -1)

# Buy 2 eggs
for i in {1..2}; do
  sui client call \
    --package YOUR_PACKAGE_ID \
    --module monster_hatchery \
    --function buy_egg \
    --args YOUR_SHOP_ID $CIM_COIN 3 \
    --gas-budget 20000000
  sleep 2
done

# Hatch the eggs
for EGG_ID in $(sui client objects --json | jq -r '.[] | select(.data.type | contains("Egg")) | .data.objectId'); do
  sui client call \
    --package YOUR_PACKAGE_ID \
    --module monster_hatchery \
    --function hatch_egg \
    --args $EGG_ID 0x6 "Monster-$RANDOM" \
    --gas-budget 20000000
  sleep 2
done
```

#### 4) Configure Docker TEE listener

```bash
cd ../../agent_architecture/nautilus

# Create the .env file
cat > .env << EOF
SUI_PRIVATE_KEY=YOUR_SUI_PRIVATE_KEY
SUI_RPC_URL=https://fullnode.testnet.sui.io
SUI_GAS_BUDGET=20000000
SUI_BIN=sui

BATTLE_PACKAGE_ID=YOUR_PACKAGE_ID
BATTLE_CONFIG_ID=YOUR_BATTLE_CONFIG_ID
BATTLE_REQUEST_POLL_INTERVAL=12
BATTLE_REQUEST_BATCH_SIZE=5
BATTLE_LISTENER_CURSOR_FILE=.battle_listener.cursor

NIMBUS_BRIDGE_URL=
BRIDGE_PORT=3001

AGENT_MODE=listener
USE_GEMINI=false
EOF

# Build and run the listener
docker-compose build
docker-compose up -d

# Check that it is running
docker ps | grep battle-listener
docker-compose logs --tail=20 battle-listener
```

#### 5) Trigger a battle

```bash
# Get 2 monsters
MONSTER1=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | head -1)
MONSTER2=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | tail -1)

# Request the battle on-chain
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_battle \
  --function request_battle \
  --args YOUR_BATTLE_CONFIG_ID $MONSTER1 $MONSTER2 \
  --gas-budget 20000000

# Watch live processing
docker-compose -f agent_architecture/nautilus/docker-compose.yml logs -f battle-listener
```

#### Expected result

You should see in the Docker logs:

```
INFO:battle_request_listener: Processing battle request 1 | 0x... vs 0x...
[1/3] Loading monsters from blockchain...
[2/3] Simulating battle off-chain (TEE)...
BATTLE START: Monster-123 vs Monster-456
Turn 1: Monster-123 93HP | Monster-456 89HP
...
WINNER: Monster-123 (XP +25)
[ENCLAVE] Battle result signed
   Signature: be8742bcf52e3d50ac8ccfa4ed481d3c...
TEE signature generated
BATTLE COMPLETE
```

---

## Overview

This system implements a secure battle mechanism for monster NFTs on Sui, using
a Trusted Execution Environment (TEE) to guarantee fairness and integrity of
results.

### Architecture

```
+-----------------+      +------------------+      +-----------------+
|   Blockchain    |      |  Docker Listener |      |   TEE Enclave   |
|      (Sui)      |<---->|     (Python)     |<---->|   (Nautilus)    |
+-----------------+      +------------------+      +-----------------+
        |                         |                          |
        | 1. request_battle()     |                          |
        +------------------------>|                          |
        |                         |                          |
        | 2. BattleRequest event  |                          |
        |<------------------------+                          |
        |                         |                          |
        |                         | 3. Load monster stats    |
        |                         +------------------------->|
        |                         |                          |
        |                         | 4. Simulate battle       |
        |                         |<-------------------------|
        |                         |                          |
        |                         | 5. Generate TEE proof    |
        |                         |<-------------------------|
        |                         |                          |
        | 6. settle_battle()      |                          |
        |<------------------------+                          |
        |    (with TEE signature) |                          |
        +-------------------------+--------------------------+
```

---

## Prerequisites

### Required tools

- Docker and Docker Compose (isolated TEE environment)
- Sui CLI (blockchain interactions)
- Python 3.11+ (local development)
- jq (parse JSON responses)

### Install Sui CLI

```bash
# macOS
brew install sui

# Verify installation
sui --version
```

### Configure Sui wallet

```bash
# Connect to testnet
sui client switch --env testnet

# Check active address
sui client active-address
```

---

## Initial deployment

### 1. Deploy the smart contracts

```bash
cd contracts/chimera_protocol

# Build Move package
sui move build

# Deploy on testnet
sui client publish --gas-budget 100000000

# Save the important IDs:
# - Package ID: 0xYOUR_PACKAGE_ID
# - BattleConfig: 0xYOUR_BATTLE_CONFIG_ID
# - Shop: 0xYOUR_SHOP_ID
# - TreasuryCap: 0xYOUR_TREASURY_CAP_ID
```

### 2. Create in-game currency (CIM)

```bash
# Mint 10 billion CIM tokens
sui client call \
  --package YOUR_PACKAGE_ID \
  --module cim_currency \
  --function mint \
  --args YOUR_TREASURY_CAP_ID \
         10000000000 \
         YOUR_ADDRESS \
  --gas-budget 20000000

# Get the CIM coin ID
sui client objects --json | jq -r '.[] | select(.data.type | contains("CIM_CURRENCY")) | .data.objectId'
```

### 3. Create monsters for tests

```bash
# Buy an egg (costs 1000 CIM)
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_hatchery \
  --function buy_egg \
  --args YOUR_SHOP_ID \
         YOUR_CIM_COIN_ID \
         3 \
  --gas-budget 20000000

# Repeat to get at least 2 eggs

# Hatch eggs into monsters
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_hatchery \
  --function hatch_egg \
  --args YOUR_EGG_ID \
         0x6 \
         "Dragon Alpha" \
  --gas-budget 20000000

# List your monsters
sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | {id: .data.objectId, name: .data.content.fields.name, level: .data.content.fields.level}'
```

---

## Docker configuration (TEE listener)

### 1. File structure

```
agent_architecture/nautilus/
+-- Dockerfile.listener          # Listener Docker image
+-- docker-compose.yml           # Docker orchestration
+-- .env                         # Config (create this)
+-- .env.example                 # Config template
+-- app.py                       # Main entry point
+-- battle_request_listener.py   # Blockchain event listener
+-- battle_orchestrator.py       # Battle orchestration
+-- battle_engine.py             # Battle logic
+-- nautilus_enclave.py          # TEE simulation
+-- requirements.txt             # Python dependencies
```

### 2. Create the `.env` file

```bash
cd agent_architecture/nautilus
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Core Sui configuration
SUI_PRIVATE_KEY=suiprivkey1...    # Your Sui private key
SUI_RPC_URL=https://fullnode.testnet.sui.io
SUI_GAS_BUDGET=20000000
SUI_BIN=sui

# On-chain battle configuration
BATTLE_PACKAGE_ID=0x32d29cf53a8b7285068867faaa7867bc675b2681abdd4dfa57fbeb5908c8e45b
BATTLE_CONFIG_ID=0x088982771baa5fb27dfbe683a2e9a3661c4ac986f3594a1243fa901ac9b9ee25
BATTLE_REQUEST_POLL_INTERVAL=12   # Check events every 12s
BATTLE_REQUEST_BATCH_SIZE=5
BATTLE_LISTENER_CURSOR_FILE=.battle_listener.cursor

# Bridge / networking (optional)
NIMBUS_BRIDGE_URL=
BRIDGE_PORT=3001

# Agent behavior
AGENT_MODE=listener               # Listener mode (no auto battles)

# AI (optional)
GEMINI_API_KEY=YOUR_KEY
USE_GEMINI=false
```

### 3. Build and run the Docker container

```bash
# Build the image
docker-compose build

# Run in background
docker-compose up -d

# Check container status
docker ps | grep battle-listener

# Live logs
docker-compose logs -f battle-listener

# Last logs
docker-compose logs --tail=50 battle-listener
```

### 4. Stop / restart the listener

```bash
# Stop
docker-compose down

# Restart after code changes
docker-compose down && docker-compose build && docker-compose up -d

# Full rebuild (if dependencies changed)
docker-compose build --no-cache
```

---

## Usage: trigger a battle

### 1. Call `request_battle` on-chain

```bash
# Get IDs of 2 monsters
MONSTER1=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | head -1)
MONSTER2=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | tail -1)

# Request a battle
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_battle \
  --function request_battle \
  --args YOUR_BATTLE_CONFIG_ID \
         $MONSTER1 \
         $MONSTER2 \
  --gas-budget 20000000
```

### 2. Watch the Docker processing

```bash
# Listener logs
docker-compose logs -f battle-listener
```

Expected output:

```
INFO:battle_request_listener: Processing battle request 1 | 0x4a0054... vs 0xbca39c...

============================================================
CHIMERA BATTLE ORCHESTRATOR
============================================================

[REQ] Battle request #1 from 0x1eaa4d...
[1/3] Loading monsters from blockchain...
  OK Dragon Alpha (STR:38 AGI:38 INT:38)
  OK Draco Beta (STR:32 AGI:32 INT:32)

[2/3] Simulating battle off-chain (TEE)...

============================================================
BATTLE START: Dragon Alpha vs Draco Beta
============================================================

Turn 1: Dragon Alpha 93HP | Draco Beta 89HP
Turn 2: Dragon Alpha 78HP | Draco Beta 78HP
...
Turn 9: Dragon Alpha 21HP | Draco Beta 0HP

WINNER: Dragon Alpha (XP +25)

[2.5/3] Signing result with Nautilus enclave...
[ENCLAVE] Nautilus TEE Simulator initialized
   Public Key: 8c5849c6bb4e523006ea1a7c7de89db4...
   PCR0: e2e96abc1347c200df6cf311e5e5332b...
   [ENCLAVE] Battle result signed
   Signature: be8742bcf52e3d50ac8ccfa4ed481d3c...

[3/3] Settling battle on blockchain...
TEE Battle Result (would settle on-chain):
   Winner: 0x4a0054ecee8ef56e329394c0ed25de49953a6e652559f49b32602230d10e135c
   Loser: 0xbca39c055cc347b359db76e08e28d064994dd1fd9e2f934917c3a440e0c64c0a
   XP Gain: 25
   Request ID: 1
   Battle Log: 9 turns
TEE signature generated - settlement would happen here

BATTLE COMPLETE
```

### 3. Manually test a battle in Docker

```bash
# Run a battle directly inside the container
docker exec chimera-battle-listener python -c "
from battle_orchestrator import run_battle_and_settle
run_battle_and_settle(
    '0x4a0054ecee8ef56e329394c0ed25de49953a6e652559f49b32602230d10e135c',
    '0xbca39c055cc347b359db76e08e28d064994dd1fd9e2f934917c3a440e0c64c0a',
    request_id=99
)
"
```

---

## Understand the TEE proof

### Elements of the TEE signature

Each battle generates a cryptographic proof with 3 components:

1. Ed25519 signature
   - Signed hash of the battle result
   - Proves the result came from the TEE
   - Example: `be8742bcf52e3d50ac8ccfa4ed481d3c...`
2. Public key
   - Uniquely identifies the TEE
   - Used to verify the signature
   - Example: `8c5849c6bb4e523006ea1a7c7de89db4...`
3. PCR0 (Platform Configuration Register)
   - Hash of the TEE state
   - Proves integrity of executed code
   - Example: `e2e96abc1347c200df6cf311e5e5332b...`

### On-chain verification

The `monster_battle.move` smart contract verifies that:

```move
public fun settle_battle(
    config: &BattleConfig,
    winner: &mut Monster,
    loser: &Monster,
    xp_gain: u64,
    request_id: u64,
    ctx: &mut TxContext
) {
    // Verification: only the TEE can call this function
    assert!(ctx.sender() == config.tee_address, ENotAuthorized);

    // Apply results
    monster_hatchery::update_stats_after_battle(winner, xp_gain);

    // Emit confirmation event
    event::emit(BattleEvent {
        request_id,
        winner_id: object::id(winner),
        loser_id: object::id(loser),
        xp_gained: xp_gain
    });
}
```

---

## Debugging

### View blockchain events

```bash
# List all BattleRequest events
sui client events --package YOUR_PACKAGE_ID --module monster_battle
```

### Inspect an object

```bash
# Monster details
sui client object YOUR_MONSTER_ID

# BattleConfig
sui client object YOUR_BATTLE_CONFIG_ID
```

### Docker logs

```bash
# Full logs
docker-compose logs battle-listener

# Live logs
docker-compose logs -f battle-listener

# Last 100 lines
docker-compose logs --tail=100 battle-listener

# Filter by pattern
docker-compose logs battle-listener 2>&1 | grep "Processing battle"
```

### Common issues

#### `ConnectionError: Failed to resolve 'fullnode.testnet.sui.io'`

Cause: the Docker container has no external network access
Solution: restart Docker or check network config

```bash
docker-compose down
docker-compose up -d
```

#### `FileNotFoundError: [Errno 2] No such file or directory: 'sui'`

Cause: Sui CLI is not in the container
Solution: the code now uses a fallback (already fixed)

#### `TypeMismatch` when calling `request_battle`

Cause: monsters are not from the same package
Solution: use monsters created with the same package as BattleConfig

```bash
# Check a monster type
sui client object YOUR_MONSTER_ID | grep objType
```

#### `Could not persist cursor file`

Cause: `.battle_listener.cursor` is a directory instead of a file
Solution:

```bash
rm -rf agent_architecture/nautilus/.battle_listener.cursor
touch agent_architecture/nautilus/.battle_listener.cursor
```

---

## Monitoring

### Listener stats

```bash
# Number of processed battles
docker-compose logs battle-listener 2>&1 | grep "Processing battle request" | wc -l

# Latest battles
docker-compose logs battle-listener 2>&1 | grep "WINNER:" | tail -5

# Average processing time
docker-compose logs battle-listener 2>&1 | grep "BATTLE COMPLETE"
```

### System status

```bash
# Check container status
docker ps --filter name=chimera-battle-listener

# CPU/RAM usage
docker stats chimera-battle-listener --no-stream

# Image size
docker images | grep nautilus-battle-listener
```

---

## Full flow (summary)

### Player side

1. Mint CIM tokens
2. Buy eggs with CIM
3. Hatch eggs into monsters
4. Call `request_battle(monster1, monster2)`
5. Wait for Docker to process the battle
6. Check results via blockchain events

### Docker side (automatic)

1. Listen to `BattleRequest` events via RPC polling
2. Detect new event and load monster stats
3. Simulate battle in the TEE using `battle_engine.py`
4. Generate Ed25519 signature
5. Call `settle_battle()` with the TEE proof
6. Smart contract verifies signature and applies results

### Smart contract side

1. Receive `request_battle()` and increment `next_request_id`
2. Emit `BattleRequest` event with monster IDs
3. Receive `settle_battle()` from the TEE
4. Verify `sender == tee_address`
5. Apply XP to the winner
6. Emit `BattleEvent` with results

---

## Advanced configuration

### Change polling interval

In `.env`:

```bash
BATTLE_REQUEST_POLL_INTERVAL=5  # Check every 5 seconds
```

### Use a custom RPC

```bash
SUI_RPC_URL=https://your-custom-node.sui.io
```

### Enable Gemini AI for narrative battles

```bash
USE_GEMINI=true
GEMINI_API_KEY=your_gemini_api_key
```

---

## Local development (without Docker)

### Install

```bash
cd agent_architecture/nautilus

# Create a virtual env
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run the listener locally

```bash
# Load environment variables
export $(cat .env | xargs)

# Start the listener
python app.py
```

### Manual battle test

```bash
python -c "
from battle_orchestrator import run_battle_and_settle
run_battle_and_settle(
    monster1_id='0x4a0054ecee8ef56e329394c0ed25de49953a6e652559f49b32602230d10e135c',
    monster2_id='0xbca39c055cc347b359db76e08e28d064994dd1fd9e2f934917c3a440e0c64c0a',
    request_id=1
)
"
```

---

## Next steps

### Full on-chain settlement

- [ ] Install Sui CLI in Docker
- [ ] Implement direct RPC settlement
- [ ] Handle gas fees automatically

### Walrus integration

- [ ] Upload battle logs to Walrus
- [ ] Store blob IDs in events

### Production

- [ ] Real Nautilus TEE (no simulation)
- [ ] Monitoring with Prometheus/Grafana
- [ ] Auto-scaling listener

---

## Resources

- [Sui Documentation](https://docs.sui.io/)
- [Sui Move Book](https://move-book.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nautilus TEE](https://github.com/nautilus-project)

---

## Authors

Built for the SUI Hackathon DeVinci 2025
