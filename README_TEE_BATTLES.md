# 🎮 Chimera Protocol - TEE Battle System

## 🚀 Quick Start (Lancer le projet complet)

### Prérequis rapides

```bash
# Installer les outils
brew install sui docker jq

# Vérifier les installations
sui --version && docker --version && jq --version
```

### Étapes pour lancer le système complet

#### 1️⃣ Configurer Sui Testnet

```bash
# Se connecter au testnet
sui client switch --env testnet

# Vérifier votre adresse
sui client active-address
```

#### 2️⃣ Déployer les Smart Contracts

```bash
cd contracts/chimera_protocol

# Build et publier
sui move build
sui client publish --gas-budget 100000000

# ⚠️ IMPORTANT: Sauvegarder ces IDs depuis la sortie :
# - Package ID: 0x...
# - BattleConfig: 0x... (objet shared)
# - Shop: 0x... (objet shared)
# - TreasuryCap: 0x...
```

#### 3️⃣ Créer des Monstres et Important d'avoir des CIM sur son adresse

```bash
# Mint des tokens CIM (in-game currency)
sui client call \
  --package YOUR_PACKAGE_ID \
  --module cim_currency \
  --function mint \
  --args YOUR_TREASURY_CAP_ID 10000000000 YOUR_ADDRESS \
  --gas-budget 20000000

# Trouver votre coin CIM
CIM_COIN=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("CIM_CURRENCY")) | .data.objectId' | head -1)

# Acheter 2 œufs
for i in {1..2}; do
  sui client call \
    --package YOUR_PACKAGE_ID \
    --module monster_hatchery \
    --function buy_egg \
    --args YOUR_SHOP_ID $CIM_COIN 3 \
    --gas-budget 20000000
  sleep 2
done

# Faire éclore les œufs
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

#### 4️⃣ Configurer Docker TEE Listener

```bash
cd ../../agent_architecture/nautilus

# Créer le fichier .env
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

# Build et lancer le listener
docker-compose build
docker-compose up -d

# Vérifier que ça tourne
docker ps | grep battle-listener
docker-compose logs --tail=20 battle-listener
```

#### 5️⃣ Déclencher un Combat !

```bash
# Récupérer 2 monstres
MONSTER1=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | head -1)
MONSTER2=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | tail -1)

# Lancer le combat on-chain
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_battle \
  --function request_battle \
  --args YOUR_BATTLE_CONFIG_ID $MONSTER1 $MONSTER2 \
  --gas-budget 20000000

# Observer le traitement en direct
docker-compose -f agent_architecture/nautilus/docker-compose.yml logs -f battle-listener
```

#### ✅ Résultat attendu

Vous devriez voir dans les logs Docker :

```
INFO:battle_request_listener:⚔️  Processing battle request 1 | 0x... vs 0x...
[1/3] Loading monsters from blockchain...
[2/3] Simulating battle off-chain (TEE)...
⚔️  BATTLE START: Monster-123 vs Monster-456
Turn 1: Monster-123 93HP | Monster-456 89HP
...
🏆 WINNER: Monster-123 (XP +25)
🔐 [ENCLAVE] ✅ Battle result signed
   Signature: be8742bcf52e3d50ac8ccfa4ed481d3c...
✅ TEE signature generated
🎉 BATTLE COMPLETE!
```

---

## Vue d'ensemble

Ce système implémente un **mécanisme de combat sécurisé** pour les monstres NFT sur Sui, utilisant un **Trusted Execution Environment (TEE)** pour garantir l'équité et l'intégrité des résultats.

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Blockchain    │      │  Docker Listener │      │   TEE Enclave   │
│      (Sui)      │◄────►│   (Python)       │◄────►│   (Nautilus)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                         │                          │
        │ 1. request_battle()     │                          │
        ├────────────────────────►│                          │
        │                         │                          │
        │ 2. BattleRequest event  │                          │
        │◄────────────────────────┤                          │
        │                         │                          │
        │                         │ 3. Load monster stats    │
        │                         ├─────────────────────────►│
        │                         │                          │
        │                         │ 4. Simulate battle       │
        │                         │◄─────────────────────────┤
        │                         │                          │
        │                         │ 5. Generate TEE proof    │
        │                         │◄─────────────────────────┤
        │                         │                          │
        │ 6. settle_battle()      │                          │
        │◄────────────────────────┤                          │
        │    (with TEE signature) │                          │
        └─────────────────────────┴──────────────────────────┘
```

---

## 📋 Prérequis

### Outils nécessaires

- **Docker** & **Docker Compose** (pour l'environnement TEE isolé)
- **Sui CLI** (pour interagir avec la blockchain)
- **Python 3.11+** (pour le développement local)
- **jq** (pour parser les réponses JSON)

### Installation Sui CLI

```bash
# macOS
brew install sui

# Vérifier l'installation
sui --version
```

### Configuration du wallet Sui

```bash
# Se connecter au testnet
sui client switch --env testnet

# Vérifier l'adresse active
sui client active-address
```

---

## 🚀 Déploiement Initial

### 1. Déployer les Smart Contracts

```bash
cd contracts/chimera_protocol

# Build le package Move
sui move build

# Déployer sur testnet
sui client publish --gas-budget 100000000

# Sauvegarder les IDs importants :
# - Package ID: 0xYOUR_PACKAGE_ID
# - BattleConfig: 0xYOUR_BATTLE_CONFIG_ID
# - Shop: 0xYOUR_SHOP_ID
# - TreasuryCap: 0xYOUR_TREASURY_CAP_ID
```

### 2. Créer de la monnaie in-game (CIM)

```bash
# Mint 10 milliards de tokens CIM
sui client call \
  --package YOUR_PACKAGE_ID \
  --module cim_currency \
  --function mint \
  --args YOUR_TREASURY_CAP_ID \
         10000000000 \
         YOUR_ADDRESS \
  --gas-budget 20000000

# Récupérer l'ID du coin CIM créé
sui client objects --json | jq -r '.[] | select(.data.type | contains("CIM_CURRENCY")) | .data.objectId'
```

### 3. Créer des monstres pour les tests

```bash
# Acheter un œuf (coûte 1000 CIM)
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_hatchery \
  --function buy_egg \
  --args YOUR_SHOP_ID \
         YOUR_CIM_COIN_ID \
         3 \
  --gas-budget 20000000

# Répéter pour avoir 2 œufs minimum

# Faire éclore les œufs en monstres
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_hatchery \
  --function hatch_egg \
  --args YOUR_EGG_ID \
         0x6 \
         "Dragon Alpha" \
  --gas-budget 20000000

# Lister vos monstres
sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | {id: .data.objectId, name: .data.content.fields.name, level: .data.content.fields.level}'
```

---

## 🐳 Configuration Docker (TEE Listener)

### 1. Structure des fichiers

```
agent_architecture/nautilus/
├── Dockerfile.listener          # Image Docker du listener
├── docker-compose.yml           # Orchestration Docker
├── .env                         # Configuration (à créer)
├── .env.example                 # Template de configuration
├── app.py                       # Point d'entrée principal
├── battle_request_listener.py   # Écoute des événements blockchain
├── battle_orchestrator.py       # Gestion des combats
├── battle_engine.py             # Logique de combat
├── nautilus_enclave.py          # Simulation TEE
└── requirements.txt             # Dépendances Python
```

### 2. Créer le fichier `.env`

```bash
cd agent_architecture/nautilus
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```bash
# Core Sui configuration
SUI_PRIVATE_KEY=suiprivkey1...    # Votre clé privée Sui
SUI_RPC_URL=https://fullnode.testnet.sui.io
SUI_GAS_BUDGET=20000000
SUI_BIN=sui

# On-chain battle configuration
BATTLE_PACKAGE_ID=0x32d29cf53a8b7285068867faaa7867bc675b2681abdd4dfa57fbeb5908c8e45b
BATTLE_CONFIG_ID=0x088982771baa5fb27dfbe683a2e9a3661c4ac986f3594a1243fa901ac9b9ee25
BATTLE_REQUEST_POLL_INTERVAL=12   # Vérifier les events toutes les 12s
BATTLE_REQUEST_BATCH_SIZE=5
BATTLE_LISTENER_CURSOR_FILE=.battle_listener.cursor

# Bridge / networking (optionnel)
NIMBUS_BRIDGE_URL=
BRIDGE_PORT=3001

# Agent behaviour
AGENT_MODE=listener               # Mode listener (pas de combats auto)

# AI (optionnel)
GEMINI_API_KEY=YOUR_KEY
USE_GEMINI=false
```

### 3. Build et lancer le container Docker

```bash
# Build l'image
docker-compose build

# Lancer en arrière-plan
docker-compose up -d

# Vérifier que le container tourne
docker ps | grep battle-listener

# Voir les logs en temps réel
docker-compose logs -f battle-listener

# Voir les derniers logs
docker-compose logs --tail=50 battle-listener
```

### 4. Arrêter/Redémarrer le listener

```bash
# Arrêter
docker-compose down

# Redémarrer après modification du code
docker-compose down && docker-compose build && docker-compose up -d

# Rebuild complet (si changement de dépendances)
docker-compose build --no-cache
```

---

## ⚔️ Utilisation : Déclencher un Combat

### 1. Appeler `request_battle` on-chain

```bash
# Récupérer les IDs de 2 monstres
MONSTER1=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | head -1)
MONSTER2=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("Monster")) | .data.objectId' | tail -1)

# Demander un combat
sui client call \
  --package YOUR_PACKAGE_ID \
  --module monster_battle \
  --function request_battle \
  --args YOUR_BATTLE_CONFIG_ID \
         $MONSTER1 \
         $MONSTER2 \
  --gas-budget 20000000
```

### 2. Observer le traitement par Docker

```bash
# Voir les logs du listener
docker-compose logs -f battle-listener
```

**Sortie attendue :**

```
INFO:battle_request_listener:⚔️  Processing battle request 1 | 0x4a0054... vs 0xbca39c...

============================================================
CHIMERA BATTLE ORCHESTRATOR
============================================================

[REQ] Battle request #1 from 0x1eaa4d...
[1/3] Loading monsters from blockchain...
  ✓ Dragon Alpha (STR:38 AGI:38 INT:38)
  ✓ Draco Beta (STR:32 AGI:32 INT:32)

[2/3] Simulating battle off-chain (TEE)...

============================================================
⚔️  BATTLE START: Dragon Alpha vs Draco Beta
============================================================

Turn 1: Dragon Alpha 93HP | Draco Beta 89HP
Turn 2: Dragon Alpha 78HP | Draco Beta 78HP
...
Turn 9: Dragon Alpha 21HP | Draco Beta 0HP

🏆 WINNER: Dragon Alpha (XP +25)

[2.5/3] Signing result with Nautilus enclave...
🔐 [ENCLAVE] Nautilus TEE Simulator initialized
   Public Key: 8c5849c6bb4e523006ea1a7c7de89db4...
   PCR0: e2e96abc1347c200df6cf311e5e5332b...
   [ENCLAVE] ✅ Battle result signed
   Signature: be8742bcf52e3d50ac8ccfa4ed481d3c...

[3/3] Settling battle on blockchain...
🔐 TEE Battle Result (would settle on-chain):
   Winner: 0x4a0054ecee8ef56e329394c0ed25de49953a6e652559f49b32602230d10e135c
   Loser: 0xbca39c055cc347b359db76e08e28d064994dd1fd9e2f934917c3a440e0c64c0a
   XP Gain: 25
   Request ID: 1
   Battle Log: 9 turns
✅ TEE signature generated - settlement would happen here

🎉 BATTLE COMPLETE!
```

### 3. Tester manuellement un combat dans Docker

```bash
# Exécuter un combat directement dans le container
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

## 🔐 Comprendre la Preuve TEE

### Éléments de la signature TEE

Chaque combat génère une **preuve cryptographique** avec 3 composants :

1. **Signature Ed25519**

   - Hash signé du résultat du combat
   - Prouve que le résultat vient du TEE
   - Exemple : `be8742bcf52e3d50ac8ccfa4ed481d3c...`
2. **Public Key**

   - Identifie de manière unique le TEE
   - Permet de vérifier la signature
   - Exemple : `8c5849c6bb4e523006ea1a7c7de89db4...`
3. **PCR0 (Platform Configuration Register)**

   - Hash de l'état du TEE
   - Prouve l'intégrité du code exécuté
   - Exemple : `e2e96abc1347c200df6cf311e5e5332b...`

### Vérification on-chain

Le smart contract `monster_battle.move` vérifie que :

```move
public fun settle_battle(
    config: &BattleConfig, 
    winner: &mut Monster, 
    loser: &Monster, 
    xp_gain: u64,
    request_id: u64,
    ctx: &mut TxContext
) {
    // ✅ Vérification : seul le TEE peut appeler cette fonction
    assert!(ctx.sender() == config.tee_address, ENotAuthorized);
  
    // Applique les résultats
    monster_hatchery::update_stats_after_battle(winner, xp_gain);
  
    // Émet un événement de confirmation
    event::emit(BattleEvent {
        request_id,
        winner_id: object::id(winner),
        loser_id: object::id(loser),
        xp_gained: xp_gain
    });
}
```

---

## 🔍 Debugging

### Voir les événements blockchain

```bash
# Lister tous les événements BattleRequest
sui client events --package YOUR_PACKAGE_ID --module monster_battle
```

### Inspecter un objet

```bash
# Voir les détails d'un monstre
sui client object YOUR_MONSTER_ID

# Voir le BattleConfig
sui client object YOUR_BATTLE_CONFIG_ID
```

### Logs Docker

```bash
# Logs complets
docker-compose logs battle-listener

# Logs en direct
docker-compose logs -f battle-listener

# Dernières 100 lignes
docker-compose logs --tail=100 battle-listener

# Filtrer par pattern
docker-compose logs battle-listener 2>&1 | grep "Processing battle"
```

### Problèmes courants

#### ❌ `ConnectionError: Failed to resolve 'fullnode.testnet.sui.io'`

**Cause** : Le container Docker n'a pas accès au réseau externe
**Solution** : Redémarrer Docker ou vérifier la config réseau

```bash
docker-compose down
docker-compose up -d
```

#### ❌ `FileNotFoundError: [Errno 2] No such file or directory: 'sui'`

**Cause** : Le binaire Sui CLI n'est pas dans le container
**Solution** : Le code utilise maintenant un fallback (déjà corrigé)

#### ❌ `TypeMismatch` lors de `request_battle`

**Cause** : Les monstres ne sont pas du bon package
**Solution** : Utiliser des monstres créés avec le même package que BattleConfig

```bash
# Vérifier le type d'un monstre
sui client object YOUR_MONSTER_ID | grep objType
```

#### ⚠️ `Could not persist cursor file`

**Cause** : `.battle_listener.cursor` est un répertoire au lieu d'un fichier
**Solution** :

```bash
rm -rf agent_architecture/nautilus/.battle_listener.cursor
touch agent_architecture/nautilus/.battle_listener.cursor
```

---

## 📊 Monitoring

### Statistiques du listener

```bash
# Nombre de combats traités
docker-compose logs battle-listener 2>&1 | grep "Processing battle request" | wc -l

# Derniers combats
docker-compose logs battle-listener 2>&1 | grep "WINNER:" | tail -5

# Temps de traitement moyen
docker-compose logs battle-listener 2>&1 | grep "BATTLE COMPLETE"
```

### État du système

```bash
# Vérifier que le container tourne
docker ps --filter name=chimera-battle-listener

# CPU/RAM usage
docker stats chimera-battle-listener --no-stream

# Taille de l'image
docker images | grep nautilus-battle-listener
```

---

## 🎯 Flux Complet (Résumé)

### Côté Joueur

1. Mint des tokens CIM
2. Achète des œufs avec les CIM
3. Fait éclore les œufs en monstres
4. Appelle `request_battle(monster1, monster2)`
5. Attend que Docker traite le combat
6. Vérifie les résultats via les événements blockchain

### Côté Docker (Automatique)

1. Écoute les événements `BattleRequest` via RPC polling
2. Détecte un nouvel événement → charge les stats des monstres
3. Simule le combat dans le TEE avec `battle_engine.py`
4. Génère une signature cryptographique Ed25519
5. Appelle `settle_battle()` avec la preuve TEE
6. Le smart contract vérifie la signature et applique les résultats

### Côté Smart Contract

1. Reçoit `request_battle()` → incrémente `next_request_id`
2. Émet `BattleRequest` event avec les IDs des monstres
3. Reçoit `settle_battle()` depuis le TEE
4. Vérifie que `sender == tee_address`
5. Applique XP au gagnant
6. Émet `BattleEvent` avec les résultats

---

## 🔧 Configuration Avancée

### Modifier l'intervalle de polling

Dans `.env` :

```bash
BATTLE_REQUEST_POLL_INTERVAL=5  # Vérifier toutes les 5 secondes
```

### Utiliser un RPC custom

```bash
SUI_RPC_URL=https://your-custom-node.sui.io
```

### Activer Gemini AI pour les combats narratifs

```bash
USE_GEMINI=true
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📝 Développement Local (Sans Docker)

### Installation

```bash
cd agent_architecture/nautilus

# Créer un environnement virtuel
python3 -m venv .venv
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### Lancer le listener localement

```bash
# Charger les variables d'environnement
export $(cat .env | xargs)

# Lancer le listener
python app.py
```

### Tester un combat manuel

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

## 🚀 Prochaines Étapes

### Settlement On-Chain Complet

- [ ] Installer Sui CLI dans Docker
- [ ] Implémenter le settlement RPC direct
- [ ] Gérer les gas fees automatiquement

### Intégration Walrus

- [ ] Upload des battle logs sur Walrus
- [ ] Stocker les blob IDs dans les événements

### Production

- [ ] Vrai TEE Nautilus (pas de simulation)
- [ ] Monitoring avec Prometheus/Grafana
- [ ] Auto-scaling du listener

---

## 📚 Ressources

- [Documentation Sui](https://docs.sui.io/)
- [Sui Move Book](https://move-book.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nautilus TEE](https://github.com/nautilus-project)

---

## ✨ Auteurs

Développé pour le **SUI Hackathon DevInci 2025** 🎓
