# 🎯 Intégration Frontend ↔ Backend - Guide Complet

## 📋 Vue d'ensemble

Ce document explique comment **frontend Next.js** et **backend Docker TEE** communiquent pour créer un système de combat complet et sécurisé.

---

## 🔗 Architecture de l'intégration

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js - Port 3000)                                 │
├─────────────────────────────────────────────────────────────────┤
│  /battle page                                                   │
│  ├─ useWalletMonsters() → Charge les monstres via RPC          │
│  ├─ User sélectionne 2 monstres                                │
│  └─ buildRequestBattleTx() → Crée la transaction               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ signAndExecuteTransaction()
┌─────────────────────────────────────────────────────────────────┐
│  SUI BLOCKCHAIN (Testnet)                                       │
├─────────────────────────────────────────────────────────────────┤
│  Smart Contract: monster_battle.move                            │
│  ├─ request_battle(config, monster1, monster2)                  │
│  ├─ Incrémente next_request_id                                  │
│  └─ Émet event::emit(BattleRequest { ... })                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Event emitted
┌─────────────────────────────────────────────────────────────────┐
│  DOCKER TEE LISTENER (Python Container)                         │
├─────────────────────────────────────────────────────────────────┤
│  battle_request_listener.py                                     │
│  ├─ Polling suix_queryEvents toutes les 12s                     │
│  ├─ Détecte BattleRequest event                                │
│  └─ Appelle battle_orchestrator.run_battle_and_settle()         │
│                                                                  │
│  battle_orchestrator.py                                         │
│  ├─ fetch_monster_from_chain() via sui_getObject RPC            │
│  ├─ battle_engine.simulate_battle()                             │
│  └─ nautilus_enclave.sign_result() → Signature TEE              │
│                                                                  │
│  [RÉSULTAT]                                                      │
│  └─ settle_battle() ou log avec signature                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ settle_battle() call
┌─────────────────────────────────────────────────────────────────┐
│  SUI BLOCKCHAIN (Testnet)                                       │
├─────────────────────────────────────────────────────────────────┤
│  Smart Contract: monster_battle.move                            │
│  ├─ settle_battle(config, winner, loser, xp, request_id)        │
│  ├─ Vérifie sender == tee_address                              │
│  ├─ Applique XP au winner                                      │
│  └─ Émet event::emit(BattleEvent { ... })                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Event emitted
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                             │
├─────────────────────────────────────────────────────────────────┤
│  /battle page                                                   │
│  ├─ useBattleEvents() polling toutes les 15s                    │
│  ├─ Détecte nouveau BattleEvent                                │
│  └─ Affiche résultat dans "Recent Battles"                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Fichiers clés

### Frontend (`/front`)

| Fichier | Rôle |
|---------|------|
| `app/battle/page.tsx` | Page principale du système de combat |
| `src/hooks/useWalletMonsters.ts` | Hook pour charger les monstres du wallet |
| `src/hooks/useBattleEvents.ts` | Hook pour écouter les BattleEvent |
| `src/lib/buildRequestBattleTx.ts` | Builder de transaction request_battle |
| `src/config/chimera.ts` | Configuration des IDs on-chain |

### Backend (`/agent_architecture/nautilus`)

| Fichier | Rôle |
|---------|------|
| `battle_request_listener.py` | Écoute les BattleRequest events |
| `battle_orchestrator.py` | Orchestre le combat et settlement |
| `battle_engine.py` | Logique de simulation de combat |
| `nautilus_enclave.py` | Génération de signature TEE |
| `.env` | Configuration (PACKAGE_ID, RPC_URL, etc.) |
| `docker-compose.yml` | Orchestration Docker |

### Smart Contracts (`/contracts/chimera_protocol`)

| Fichier | Rôle |
|---------|------|
| `sources/monster_battle.move` | Contract de combat principal |
| `sources/monster_hatchery.move` | Gestion des monstres/eggs |
| `sources/cim_currency.move` | Monnaie in-game |

---

## 🔧 Configuration synchronisée

### ⚠️ IMPORTANT : Les IDs doivent correspondre

#### Frontend (`front/src/config/chimera.ts`)
```typescript
export const PACKAGE_ID = "0x32d29cf53a8b7285...";
export const SHOP_ID = "0x881fb49e959b1f2a...";
export const BATTLE_CONFIG_ID = "0x088982771baa...";
```

#### Backend (`.env`)
```bash
BATTLE_PACKAGE_ID=0x32d29cf53a8b7285...  # = PACKAGE_ID
BATTLE_CONFIG_ID=0x088982771baa...       # = BATTLE_CONFIG_ID
SUI_RPC_URL=https://fullnode.testnet.sui.io
```

#### Vérification
```bash
./test_integration.sh
```

---

## 🚀 Lancer l'application complète

### Terminal 1 : Docker TEE
```bash
cd agent_architecture/nautilus
docker-compose up -d
docker-compose logs -f battle-listener
```

### Terminal 2 : Frontend
```bash
cd front
npm install  # Si pas encore fait
npm run dev
```

### Terminal 3 : Tests (optionnel)
```bash
# Vérifier les monstres disponibles
sui client objects --json | jq '.[] | select(.data.type | contains("Monster"))'

# Demander un combat manuellement
sui client call \
  --package 0x32d29cf53a8b7285... \
  --module monster_battle \
  --function request_battle \
  --args BATTLE_CONFIG_ID MONSTER1_ID MONSTER2_ID \
  --gas-budget 20000000
```

---

## 📊 Flux de données détaillé

### 1. User Action (Frontend)

```typescript
// Page /battle
const handleRequestBattle = async () => {
  const tx = buildRequestBattleTx(monster1.id, monster2.id);
  const result = await signAndExecuteTransaction({ transaction: tx });
  
  // result.digest = "5VooyF5aw6MFk..."
};
```

**Sortie** : Transaction digest + BattleRequest event émis

---

### 2. Event Detection (Docker)

```python
# battle_request_listener.py
def _pull_requests():
    params = [{
        "query": {
            "MoveEventType": f"{PACKAGE_ID}::monster_battle::BattleRequest"
        },
        "cursor": self.cursor,
        "limit": self.batch_size,
        "descending_order": False
    }]
    
    response = requests.post(RPC_URL, json=payload)
    # Retourne les nouveaux événements
```

**Sortie** : Liste des BattleRequest events non traités

---

### 3. Battle Simulation (Docker TEE)

```python
# battle_orchestrator.py
def run_battle_and_settle(monster1_id, monster2_id, request_id):
    # 1. Charger les stats
    m1 = fetch_monster_from_chain(monster1_id)
    m2 = fetch_monster_from_chain(monster2_id)
    
    # 2. Simuler
    winner, loser, xp, log = simulate_battle(m1, m2)
    
    # 3. Signer avec TEE
    enclave = get_enclave()
    signature = enclave.sign_battle_result(winner.id, loser.id, xp)
    
    # 4. Settler on-chain
    settle_battle_on_chain(winner.id, loser.id, xp, log, request_id)
```

**Sortie** : 
- Battle log (turns, HP, winner)
- TEE signature (Ed25519)
- settle_battle transaction digest

---

### 4. Result Display (Frontend)

```typescript
// useBattleEvents hook
const { data } = useSuiClientQuery('queryEvents', {
  query: {
    MoveEventType: `${PACKAGE_ID}::monster_battle::BattleEvent`
  },
  order: 'descending'
});

// Auto-refresh toutes les 15s
// Affiche dans "Recent Battles" section
```

**Sortie** : UI mise à jour avec les résultats

---

## 🎮 Exemple de session complète

### Étape 1 : Mint et Hatch
```bash
# 1. Mint CIM
sui client call --module cim_currency --function mint ...

# 2. Buy eggs
sui client call --module monster_hatchery --function buy_egg ...

# 3. Hatch eggs
sui client call --module monster_hatchery --function hatch_egg ...
```

### Étape 2 : Lancer un combat (Frontend)

1. Ouvrir http://localhost:3000/battle
2. Connecter wallet Sui
3. Voir la liste de vos monstres s'afficher
4. Cliquer sur 2 monstres différents
5. Cliquer "Request Battle"
6. Signer la transaction

### Étape 3 : Observer le traitement (Docker)

```bash
# Logs Docker en temps réel
docker-compose logs -f battle-listener

# Sortie attendue :
# INFO:battle_request_listener:⚔️  Processing battle request 1 | 0x4a00... vs 0xbca3...
# [1/3] Loading monsters from blockchain...
#   ✓ Dragon Alpha (STR:38 AGI:38 INT:38)
#   ✓ Draco Beta (STR:32 AGI:32 INT:32)
# [2/3] Simulating battle off-chain (TEE)...
# Turn 1: Dragon Alpha 93HP | Draco Beta 89HP
# ...
# 🏆 WINNER: Dragon Alpha (XP +25)
# 🔐 [ENCLAVE] ✅ Battle result signed
# ✅ TEE signature generated
```

### Étape 4 : Voir les résultats (Frontend)

- La section "Recent Battles" se met à jour automatiquement
- Affiche : Battle #1, Winner: Dragon Alpha, +25 XP
- Lien vers Sui Explorer pour la transaction

---

## 🔍 Debugging

### Frontend ne voit pas les monstres
```typescript
// Vérifier la connexion wallet
const account = useCurrentAccount();
console.log('Connected:', account?.address);

// Vérifier les monstres
const { monsters, error } = useWalletMonsters();
console.log('Monsters:', monsters, 'Error:', error);
```

### Docker ne détecte pas les events
```bash
# Vérifier les logs
docker-compose logs battle-listener | grep "BattleRequest"

# Vérifier la config
docker exec chimera-battle-listener env | grep BATTLE_PACKAGE_ID

# Tester manuellement
docker exec chimera-battle-listener python -c "
from battle_request_listener import BattleRequestListener
listener = BattleRequestListener()
events, _ = listener._pull_requests()
print(f'Events: {len(events)}')
"
```

### Transaction échoue
```bash
# Vérifier le type des monstres
sui client object MONSTER_ID | grep objType

# Doit être : PACKAGE_ID::monster_hatchery::Monster

# Vérifier le balance CIM
sui client objects --json | jq '.[] | select(.data.type | contains("CIM"))'
```

---

## 📈 Métriques de performance

### Latence moyenne par étape

| Étape | Temps | Optimisation possible |
|-------|-------|----------------------|
| User → TX confirmée | ~2-5s | Dépend du réseau Sui |
| Event emission | ~1s | Instantané |
| Docker détection | 0-12s | BATTLE_REQUEST_POLL_INTERVAL |
| Battle simulation | ~0.1s | Déjà rapide |
| TEE signature | ~0.05s | Déjà rapide |
| settle_battle TX | ~2-5s | Dépend du réseau Sui |
| Frontend refresh | 0-15s | Auto-refresh interval |

**Total** : **5-40 secondes** entre request et affichage du résultat

### Optimisations possibles

1. **WebSocket au lieu de polling** → Latence réduite à ~5s
2. **Frontend optimistic UI** → Affichage immédiat (en attente)
3. **Batch settlements** → Plusieurs combats en une TX
4. **Sui GraphQL subscriptions** → Push au lieu de pull

---

## 🎯 Prochaines améliorations

### Court terme
- [x] Page Battle fonctionnelle
- [x] Hooks pour monstres et événements
- [ ] Animations de combat CSS
- [ ] Toast notifications

### Moyen terme
- [ ] WebSocket pour events temps réel
- [ ] Battle replay avec Walrus blob
- [ ] Leaderboard intégré
- [ ] Équipements avec effets

### Long terme
- [ ] Battle simulator client-side (preview)
- [ ] Multi-signature battles (équipes)
- [ ] Cross-chain interoperability
- [ ] DAO governance

---

## 📚 Ressources

- **Frontend README** : `front/README_FRONTEND.md`
- **Backend README** : `README_TEE_BATTLES.md`
- **Script de test** : `./test_integration.sh`
- **Smart Contracts** : `contracts/chimera_protocol/`

---

✨ **L'intégration est complète et fonctionnelle !**

Tous les composants communiquent correctement :
- ✅ Frontend appelle la blockchain
- ✅ Docker écoute les événements
- ✅ TEE traite les combats
- ✅ Résultats affichés dans l'UI

**Démo ready !** 🚀

---

Développé pour le **SUI Hackathon DevInci 2025** 🎓⚡
