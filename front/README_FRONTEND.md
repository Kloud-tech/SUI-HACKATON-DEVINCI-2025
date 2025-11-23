# 🎮 CryptoMonsters Frontend

Interface web Next.js pour le jeu CryptoMonsters sur Sui, avec intégration complète du système de combat TEE.

## 🚀 Quick Start

### Installation

```bash
cd front
npm install
```

### Configuration

Les IDs des smart contracts sont dans `src/config/chimera.ts` :

```typescript
export const PACKAGE_ID = "0x32d29cf53a8b7285..."; // Votre package déployé
export const SHOP_ID = "0x881fb49e959b1f2a...";    // Shop shared object
export const BATTLE_CONFIG_ID = "0x088982771baa..."; // BattleConfig shared object
```

### Lancer le dev server

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📱 Pages disponibles

### 🏠 Homepage (`/`)
- **Mint des œufs** (Common, Rare, Epic, Legendary)
- **Faire éclore les œufs** en monstres
- Présentation du projet

### ⚔️ Battle Arena (`/battle`)
**NOUVELLE PAGE - Intégration TEE complète**

#### Fonctionnalités :
1. **Sélection des monstres**
   - Affiche tous vos monstres avec leurs stats (STR, AGI, INT)
   - Sélection visuelle de 2 monstres pour le combat
   - Preview du match avec stats comparatives

2. **Request Battle (On-Chain)**
   - Appelle `request_battle()` sur la blockchain
   - Émet un événement `BattleRequest`
   - Docker TEE détecte automatiquement l'événement

3. **Battle Processing (TEE)**
   - Le listener Docker traite le combat
   - Génère une signature TEE Ed25519
   - Renvoie les résultats avec preuve cryptographique

4. **Historique des combats**
   - Liste des derniers combats terminés
   - Affiche winner, XP gained, timestamps
   - Liens vers Sui Explorer

### 👥 Team (`/team`)
- Voir tous vos monstres
- Gérer votre équipe

### 🏪 Marketplace (`/marketplace`)
- Acheter/vendre des monstres
- Transactions P2P

### 🏆 Leaderboard (`/leaderboard`)
- Classement des joueurs
- Top monstres

### 🧪 Lab (`/lab`)
- Génétique et breeding (à venir)

---

## 🔧 Architecture Technique

### Hooks personnalisés

#### `useWalletMonsters()`
Récupère tous les monstres du wallet connecté.

```typescript
const { monsters, isLoading, refetch } = useWalletMonsters();

// monsters: Monster[] avec { id, name, level, strength, agility, intelligence, rarity, experience }
```

#### `useBattleEvents(limit)`
Écoute les événements `BattleEvent` émis par le smart contract.

```typescript
const { events, isLoading, refetch } = useBattleEvents(20);

// events: BattleEvent[] avec { requestId, winnerId, loserId, xpGained, timestamp, txDigest }
```

### Transaction Builders

#### `buildRequestBattleTx(monster1Id, monster2Id)`
Construit la transaction pour demander un combat.

```typescript
import { buildRequestBattleTx } from '@/src/lib/buildRequestBattleTx';

const tx = buildRequestBattleTx(
  '0x4a0054ecee8ef56e...',  // Monster 1 Object ID
  '0xbca39c055cc347b3...'   // Monster 2 Object ID
);

const result = await signAndExecuteTransaction({ transaction: tx });
```

#### `buildBuyEggTx(rarity, coinObjectId)`
Acheter un œuf avec des tokens CIM.

```typescript
const tx = buildBuyEggTx('epic', cimCoinId);
```

#### `buildHatchEggTx(eggId, monsterName)`
Faire éclore un œuf en monstre.

```typescript
const tx = buildHatchEggTx(eggId, 'Dragon Alpha');
```

---

## 🎯 Workflow Battle Complet

### 1. Frontend : Request Battle
```typescript
// Page /battle
const tx = buildRequestBattleTx(monster1.id, monster2.id);
const result = await signAndExecuteTransaction({ transaction: tx });
```

### 2. Smart Contract : Emit Event
```move
// monster_battle.move
public entry fun request_battle(
    config: &mut BattleConfig,
    monster1: &Monster,
    monster2: &Monster,
    ctx: &mut TxContext
) {
    let request_id = config.next_request_id;
    config.next_request_id = request_id + 1;

    event::emit(BattleRequest {
        request_id,
        monster1_id: object::id(monster1),
        monster2_id: object::id(monster2),
        requester: ctx.sender()
    });
}
```

### 3. Docker TEE : Process Battle
```bash
# Logs Docker
INFO:battle_request_listener:⚔️  Processing battle request 1 | 0x4a0054... vs 0xbca39c...
[1/3] Loading monsters from blockchain...
[2/3] Simulating battle off-chain (TEE)...
🏆 WINNER: Dragon Alpha (XP +25)
🔐 [ENCLAVE] ✅ Battle result signed
   Signature: be8742bcf52e3d50ac8ccfa4ed481d3c...
✅ TEE signature generated
```

### 4. Frontend : Display Results
```typescript
// Hook useBattleEvents() détecte le BattleEvent
const { events } = useBattleEvents();

// Affiche automatiquement dans "Recent Battles"
events.map(e => (
  <div>Winner: {e.winnerId}, XP: {e.xpGained}</div>
))
```

---

## 🔌 Intégration avec le Backend TEE

### Variables d'environnement Docker
Le frontend communique avec la blockchain, Docker écoute les événements :

```bash
# agent_architecture/nautilus/.env
BATTLE_PACKAGE_ID=0x32d29cf53a8b7285...  # Même que PACKAGE_ID frontend
BATTLE_CONFIG_ID=0x088982771baa...       # Même que BATTLE_CONFIG_ID frontend
```

### Synchronisation
1. Frontend appelle `request_battle()` → tx confirmée
2. Docker polling détecte `BattleRequest` event (12s interval)
3. Docker simule combat + génère signature TEE
4. Docker appelle `settle_battle()` (ou log result)
5. Frontend écoute `BattleEvent` → affiche résultat

**Latence totale** : ~15-30s entre request et résultat visible

---

## 🎨 Design System

### Couleurs principales
- **Primary** : `#330df2` (violet électrique)
- **Background** : `#131022` (noir spatial)
- **Surface** : `#0f0c1b` avec opacité
- **Accents** : dégradés violet/bleu/jaune selon rareté

### Composants réutilisables
- `SiteHeader` : Navigation avec dropdown menu
- `WalletConnectButton` : Connexion Sui wallet (@mysten/dapp-kit)
- `EggMintGrid` : Grille de mint avec 4 raretés
- `HatchEggPanel` : Formulaire pour éclore les œufs

---

## 📊 État de l'application

### Gestion du state
- **@tanstack/react-query** pour cache des requêtes Sui
- **@mysten/dapp-kit** pour wallet state
- React hooks locaux pour UI state

### Rafraîchissement automatique
```typescript
// Hooks avec auto-refresh
useWalletMonsters()  // Toutes les 10s
useBattleEvents()    // Toutes les 15s
```

---

## 🐛 Debugging

### Vérifier la connexion wallet
```typescript
const account = useCurrentAccount();
console.log('Connected:', account?.address);
```

### Voir les monstres récupérés
```typescript
const { monsters } = useWalletMonsters();
console.log('Monsters:', monsters);
```

### Tester une transaction
```typescript
const tx = buildRequestBattleTx(monster1, monster2);
console.log('TX:', tx.serialize());
```

### Logs Docker en parallèle
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Docker logs
cd ../agent_architecture/nautilus
docker-compose logs -f battle-listener
```

---

## 🚀 Prochaines fonctionnalités

### Court terme
- [ ] Afficher le replay du combat (via Walrus blob)
- [ ] Filtres/tri sur la liste des monstres
- [ ] Animations de combat CSS
- [ ] Notifications toast pour les événements

### Moyen terme
- [ ] Système de breeding (génétique)
- [ ] Équipements avec effets sur stats
- [ ] Tournois avec prize pools
- [ ] Chat en direct pendant les combats

### Long terme
- [ ] Battle simulator client-side (preview)
- [ ] NFT avatar customization
- [ ] DAO governance pour les règles de combat
- [ ] Cross-chain battles (Sui ↔ autres chains)

---

## 📚 Documentation API

### Monster Interface
```typescript
interface Monster {
  id: string;              // Object ID on-chain
  name: string;            // Player-chosen name
  level: number;           // 1-100
  experience: number;      // XP points
  strength: number;        // Physical damage
  agility: number;         // Speed/dodge
  intelligence: number;    // Magic damage
  rarity: number;          // 1=Common, 2=Rare, 3=Epic, 4=Legendary
}
```

### BattleEvent Interface
```typescript
interface BattleEvent {
  requestId: string;       // Battle sequence number
  winnerId: string;        // Winner monster Object ID
  loserId: string;         // Loser monster Object ID
  xpGained: string;        // XP awarded to winner
  timestamp: number;       // Unix timestamp (ms)
  txDigest: string;        // Sui transaction hash
}
```

---

## 🔗 Liens utiles

- **Sui Explorer** : https://suiexplorer.com/?network=testnet
- **@mysten/dapp-kit docs** : https://sdk.mystenlabs.com/dapp-kit
- **Backend TEE** : `../agent_architecture/nautilus/`
- **Smart Contracts** : `../contracts/chimera_protocol/`

---

## 👥 Contribution

Pour ajouter une nouvelle fonctionnalité :

1. Créer un hook dans `src/hooks/` si besoin de données blockchain
2. Créer un builder dans `src/lib/` si besoin de nouvelle transaction
3. Créer une page dans `app/` pour la UI
4. Ajouter le lien dans `components/SiteHeader.tsx`
5. Tester avec Docker TEE listener actif

**Stack** : Next.js 16 + React 19 + TypeScript + Tailwind CSS + @mysten/sui

---

Développé pour le **SUI Hackathon DevInci 2025** 🎓⚡
