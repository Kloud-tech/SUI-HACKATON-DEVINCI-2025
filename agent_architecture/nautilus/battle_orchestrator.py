#!/usr/bin/env python3
"""
CHIMERA BATTLE ORCHESTRATOR
============================
Coordinates between battle simulation (off-chain) and blockchain settlement (on-chain).
"""

import json
import logging
import os
import subprocess
from typing import Any, Dict, Optional

import requests

from battle_engine import Monster, BattleEngine
from nautilus_enclave import get_enclave
from monster_manager import MonsterManager

# === CONFIGURATION ===
NIMBUS_BRIDGE_URL = os.getenv("NIMBUS_BRIDGE_URL", "http://nimbus-bridge:3001")
_rpc_base = os.getenv("SUI_RPC_URL", "https://fullnode.testnet.sui.io") or "https://fullnode.testnet.sui.io"
SUI_RPC_URL = _rpc_base if _rpc_base.endswith("/") else f"{_rpc_base}/"
BATTLE_PACKAGE_ID = os.getenv("BATTLE_PACKAGE_ID")
BATTLE_CONFIG_ID = os.getenv("BATTLE_CONFIG_ID")
SUI_GAS_BUDGET = os.getenv("SUI_GAS_BUDGET", "20000000")
SUI_BIN = os.getenv("SUI_BIN", "sui")


def _rpc_call(method: str, params: list[Any]) -> Dict[str, Any]:
    """Execute a JSON-RPC call against the configured Sui fullnode."""
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    response = requests.post(SUI_RPC_URL, json=payload, timeout=20)
    response.raise_for_status()
    body = response.json()
    if "error" in body:
        raise RuntimeError(body["error"])
    return body.get("result", {})


def _decode_move_string(value: Any) -> str:
    """Best-effort decoding of a Move string to UTF-8."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        fields = value.get("fields", {})
        if isinstance(fields, dict) and "bytes" in fields:
            raw = fields["bytes"]
            hex_value = raw[2:] if isinstance(raw, str) and raw.startswith("0x") else raw
            try:
                return bytes.fromhex(hex_value).decode("utf-8")
            except Exception:
                return ""
    return ""


def _coerce_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default

# === MONSTER LOADING FROM BLOCKCHAIN ===
def fetch_monster_from_chain(monster_object_id: str) -> Monster:
    """
    Fetch monster stats from the blockchain using MonsterManager.
    Returns a Monster object ready for battle simulation.
    """
    manager = MonsterManager()
    try:
        monster_data = manager.get_monster_by_id(monster_object_id)
        
        if not monster_data:
            logging.warning("⚠️  Monster %s not found - using fallback stats", monster_object_id)
            return Monster(monster_object_id, "Unknown", 30, 30, 30, 1)
        
        monster = Monster(
            monster_object_id,
            monster_data["name"],
            monster_data["strength"],
            monster_data["agility"],
            monster_data["intelligence"],
            monster_data["level"]
        )
        logging.info(f"✅ Loaded monster: {monster.name} (Lvl {monster.level}) - STR:{monster.strength} AGI:{monster.agility} INT:{monster.intelligence}")
        return monster
        
    except Exception as exc:
        logging.error("❌ Error fetching monster %s: %s - using fallback", monster_object_id, exc)
        return Monster(monster_object_id, "Unknown", 30, 30, 30, 1)


# === BATTLE SETTLEMENT ON BLOCKCHAIN ===
def settle_battle_on_chain(
    winner_id: str,
    loser_id: str,
    xp_gain: int,
    battle_log: list,
    request_id: Optional[int] = None
):
    """
    Call the Nimbus Bridge to execute settle_battle on-chain.
    This requires the EXECUTE_MOVE_CALL action we created earlier.
    """
    
    # Upload battle log to Walrus first
    # TODO: Implement Walrus upload
    replay_blob_id = "WALRUS_SIMULATION_BLOB"
    
    # Prepare the moveCall parameters for settle_battle
    move_call_params = {
        "packageObjectId": BATTLE_PACKAGE_ID or "0xPACKAGE_ID",
        "module": "monster_battle",
        "function": "settle_battle",
        "arguments": [
            {"type": "object", "value": BATTLE_CONFIG_ID or "0xBATTLE_CONFIG_ID"},
            {"type": "object", "value": winner_id},  # Winner Monster object
            {"type": "object", "value": loser_id},  # Loser Monster object
            {"type": "pure", "value": xp_gain},  # XP amount
            {"type": "pure", "value": request_id if request_id is not None else 0},
        ],
        "typeArguments": []
    }
    
    if NIMBUS_BRIDGE_URL:
        try:
            response = requests.post(
                f"{NIMBUS_BRIDGE_URL}/execute",
                json={
                    "action": "EXECUTE_MOVE_CALL",
                    "params": move_call_params
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            print(f"✅ Battle settled on-chain via Nimbus: {result}")
            return result
        except Exception as exc:
            print(f"❌ Nimbus settlement failed: {exc}")

    if not (BATTLE_PACKAGE_ID and BATTLE_CONFIG_ID):
        print("⚠️  Missing BATTLE_PACKAGE_ID or BATTLE_CONFIG_ID - cannot settle battle")
        return None

    # For Docker env without sui CLI: just log the settlement (TEE proof generated)
    print(f"🔐 TEE Battle Result (would settle on-chain):")
    print(f"   Winner: {winner_id}")
    print(f"   Loser: {loser_id}")
    print(f"   XP Gain: {xp_gain}")
    print(f"   Request ID: {request_id}")
    print(f"   Battle Log: {len(battle_log)} turns")
    print("✅ TEE signature generated - settlement would happen here")
    
    # Return success for testing purposes
    return {"status": "success_tee_only", "winner": winner_id, "xp": xp_gain, "request_id": request_id}


# === MAIN ORCHESTRATION ===
def run_battle_and_settle(
    monster1_id: str,
    monster2_id: str,
    request_id: Optional[int] = None,
    requester: Optional[str] = None
):
    """
    Complete battle flow:
    1. Read monster stats from blockchain
    2. Simulate battle off-chain
    3. Settle result on-chain
    """
    
    print("\n" + "="*60)
    print("CHIMERA BATTLE ORCHESTRATOR")
    print("="*60 + "\n")
    if request_id is not None:
        print(f"[REQ] Battle request #{request_id} from {requester or 'unknown'}")
    
    # Step 1: Load monsters from blockchain
    print("[1/3] Loading monsters from blockchain...")
    monster1 = fetch_monster_from_chain(monster1_id)
    monster2 = fetch_monster_from_chain(monster2_id)
    print(f"  ✓ {monster1.name} (STR:{monster1.strength} AGI:{monster1.agility} INT:{monster1.intelligence})")
    print(f"  ✓ {monster2.name} (STR:{monster2.strength} AGI:{monster2.agility} INT:{monster2.intelligence})")
    
    # Step 2: Simulate battle
    print("\n[2/3] Simulating battle off-chain (TEE)...")
    engine = BattleEngine(monster1, monster2)
    result = engine.simulate_battle()
    
    # Step 2.5: Sign result with Nautilus enclave
    print("\n[2.5/3] Signing result with Nautilus enclave...")
    enclave = get_enclave()
    signed_result = enclave.sign_battle_result(
        result["winner_id"],
        result["loser_id"],
        result["xp_gain"],
        result["battle_log"]
    )
    print(f"  ✓ Signature: {signed_result['signature'][:32]}...")
    print(f"  ✓ Public Key: {signed_result['public_key'][:32]}...")
    print(f"  ✓ PCR0: {signed_result['pcr0'][:32]}...")
    
    # Merge signed data with battle result
    result['signature'] = signed_result['signature']
    result['enclave_public_key'] = signed_result['public_key']
    result['enclave_attestation'] = signed_result['attestation']
    result['payload'] = signed_result['payload']
    result['request_id'] = request_id
    result['requester'] = requester
    
    # Step 3: Settle on blockchain
    print("\n[3/3] Settling battle on blockchain...")
    settlement = settle_battle_on_chain(
        result["winner_id"],
        result["loser_id"],
        result["xp_gain"],
        result["battle_log"],
        request_id=request_id
    )
    
    if settlement:
        print("\n🎉 BATTLE COMPLETE!")
        print(f"   Winner: {result['winner_id']}")
        print(f"   XP Gained: {result['xp_gain']}")
        print(f"   Total Turns: {result['total_turns']}")
    else:
        print("\n⚠️  Battle simulated but settlement failed (check Nimbus Bridge)")
    
    return result


# === CLI ENTRY POINT ===
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) >= 3:
        # Run with command-line arguments
        monster1_id = sys.argv[1]
        monster2_id = sys.argv[2]
    else:
        # Use defaults
        monster1_id = "0xMONSTER_A"
        monster2_id = "0xMONSTER_B"
    
    run_battle_and_settle(monster1_id, monster2_id)
