# Chimera Protocol (Sui Hackathon DeVinci 2025)

**Demo (video): [https://youtu.be/hTch8-XVzb0]()**

Web3 game prototype on Sui: monster NFTs, in-game economy (CIM),
off-chain battles simulated in a TEE, then settled on-chain.

## Key points

- On-chain gameplay: buy eggs, hatch monsters, progress through battles.
- Battle fairness: off-chain simulation + TEE signature before settlement.
- Modern frontend: Next.js + Sui wallet.
- Full stack: Move, TypeScript/React, Python, Docker.

## Architecture (high level)

```
Sui (Move) <-> Battle Listener (Python, Docker) <-> TEE (Nautilus, simulated)
            ^
            |
        Frontend (Next.js)
```

## Repo layout

- `contracts/chimera_protocol`: Move smart contracts (monsters, battle, currency).
- `agent_architecture/nautilus`: battle listener + TEE simulation.
- `front`: user interface (Next.js).
- `docs`: additional documentation.

## Run the frontend

```bash
cd front
npm install
npm run dev
```

## Run the full system

See the detailed guide in `README_TEE_BATTLES.md`.

## Why this project

The goal is to explore a balanced and verifiable battle mechanism on Sui,
reducing on-chain costs while preserving integrity via a TEE.

## Status

Hackathon prototype (November 2025). Great for a technical demo and POC.
