#!/usr/bin/env python3
"""Monster Manager - Gère les monstres NFT depuis la blockchain pour les combats"""

import logging
import os
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class MonsterManager:
    """Récupère et gère les monstres NFT depuis la blockchain Sui"""

    def __init__(self, rpc_url: Optional[str] = None, package_id: Optional[str] = None):
        base_url = rpc_url or os.getenv("SUI_RPC_URL", "https://fullnode.testnet.sui.io")
        self.rpc_url = base_url if base_url.endswith("/") else f"{base_url}/"
        self.package_id = package_id or os.getenv("BATTLE_PACKAGE_ID")
        if not self.package_id:
            raise ValueError("BATTLE_PACKAGE_ID must be configured")
        self.monster_type = f"{self.package_id}::monster_hatchery::Monster"

    def _rpc_call(self, method: str, params: List[Any]) -> Dict[str, Any]:
        """Effectue un appel RPC à Sui"""
        payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
        response = requests.post(self.rpc_url, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        if "error" in data:
            raise RuntimeError(f"RPC Error: {data['error']}")
        return data.get("result", {})

    def get_monster_by_id(self, monster_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un monstre par son object ID"""
        try:
            result = self._rpc_call("sui_getObject", [
                monster_id,
                {"showContent": True, "showOwner": True}
            ])
            
            if not result or "data" not in result:
                logger.warning(f"Monster {monster_id} not found")
                return None
            
            data = result["data"]
            content = data.get("content", {})
            
            if content.get("dataType") != "moveObject":
                logger.warning(f"Monster {monster_id} is not a move object")
                return None
            
            fields = content.get("fields", {})
            
            return {
                "object_id": data["objectId"],
                "name": fields.get("name", "Unknown"),
                "level": int(fields.get("level", 1)),
                "experience": int(fields.get("experience", 0)),
                "strength": int(fields.get("strength", 0)),
                "agility": int(fields.get("agility", 0)),
                "intelligence": int(fields.get("intelligence", 0)),
                "rarity": int(fields.get("rarity", 1)),
                "owner": data.get("owner", {}).get("AddressOwner", "unknown")
            }
        except Exception as e:
            logger.error(f"Error fetching monster {monster_id}: {e}")
            return None

    def get_wallet_monsters(self, wallet_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Récupère tous les monstres possédés par un wallet"""
        monsters = []
        cursor = None
        
        try:
            while True:
                params = [
                    wallet_address,
                    {
                        "filter": {"StructType": self.monster_type},
                        "options": {"showContent": True, "showOwner": True}
                    }
                ]
                
                if cursor:
                    params.append(cursor)
                
                params.append(limit)
                
                result = self._rpc_call("suix_getOwnedObjects", params)
                
                data = result.get("data", [])
                for obj_response in data:
                    obj_data = obj_response.get("data")
                    if not obj_data:
                        continue
                    
                    content = obj_data.get("content", {})
                    if content.get("dataType") != "moveObject":
                        continue
                    
                    fields = content.get("fields", {})
                    monsters.append({
                        "object_id": obj_data["objectId"],
                        "name": fields.get("name", "Unknown"),
                        "level": int(fields.get("level", 1)),
                        "experience": int(fields.get("experience", 0)),
                        "strength": int(fields.get("strength", 0)),
                        "agility": int(fields.get("agility", 0)),
                        "intelligence": int(fields.get("intelligence", 0)),
                        "rarity": int(fields.get("rarity", 1)),
                    })
                
                # Pagination
                has_next = result.get("hasNextPage", False)
                if not has_next:
                    break
                
                cursor = result.get("nextCursor")
                if not cursor:
                    break
                    
        except Exception as e:
            logger.error(f"Error fetching wallet monsters for {wallet_address}: {e}")
        
        # Trier par niveau puis par force
        monsters.sort(key=lambda m: (m["level"], m["strength"]), reverse=True)
        return monsters

    def validate_monster_owner(self, monster_id: str, expected_owner: str) -> bool:
        """Vérifie que le monstre appartient bien au wallet spécifié"""
        monster = self.get_monster_by_id(monster_id)
        if not monster:
            return False
        return monster.get("owner", "").lower() == expected_owner.lower()

    def get_battle_stats(self, monster_id: str) -> Optional[Dict[str, int]]:
        """Récupère uniquement les stats de combat d'un monstre"""
        monster = self.get_monster_by_id(monster_id)
        if not monster:
            return None
        
        return {
            "strength": monster["strength"],
            "agility": monster["agility"],
            "intelligence": monster["intelligence"],
            "level": monster["level"]
        }


if __name__ == "__main__":
    # Test du MonsterManager
    logging.basicConfig(level=logging.INFO)
    
    manager = MonsterManager()
    
    # Test: récupérer un monstre spécifique
    test_monster_id = os.getenv("TEST_MONSTER_ID")
    if test_monster_id:
        print(f"\n=== Test: Récupération du monstre {test_monster_id} ===")
        monster = manager.get_monster_by_id(test_monster_id)
        if monster:
            print(f"✅ Monstre trouvé: {monster['name']} (Lvl {monster['level']})")
            print(f"   Stats: STR={monster['strength']} AGI={monster['agility']} INT={monster['intelligence']}")
        else:
            print("❌ Monstre non trouvé")
    
    # Test: récupérer les monstres d'un wallet
    test_wallet = os.getenv("TEST_WALLET_ADDRESS")
    if test_wallet:
        print(f"\n=== Test: Monstres du wallet {test_wallet[:8]}... ===")
        monsters = manager.get_wallet_monsters(test_wallet)
        print(f"✅ {len(monsters)} monstre(s) trouvé(s)")
        for i, m in enumerate(monsters[:3], 1):
            print(f"   {i}. {m['name']} (Lvl {m['level']}) - STR:{m['strength']} AGI:{m['agility']} INT:{m['intelligence']}")
