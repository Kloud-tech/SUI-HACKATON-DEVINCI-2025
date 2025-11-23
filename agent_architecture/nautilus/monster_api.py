#!/usr/bin/env python3
"""
API REST pour gérer les monstres et les équipes de combat
Optionnel: peut servir de bridge entre le frontend et la blockchain
"""

import logging
import os
from typing import Dict, List

from flask import Flask, jsonify, request
from monster_manager import MonsterManager

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialiser le MonsterManager
monster_manager = MonsterManager()


@app.route('/health', methods=['GET'])
def health():
    """Endpoint de santé"""
    return jsonify({
        "status": "ok",
        "service": "monster-api",
        "version": "1.0.0"
    })


@app.route('/api/monsters/<monster_id>', methods=['GET'])
def get_monster(monster_id: str):
    """Récupère un monstre par son ID"""
    try:
        monster = monster_manager.get_monster_by_id(monster_id)
        if not monster:
            return jsonify({"error": "Monster not found"}), 404
        
        return jsonify({
            "success": True,
            "monster": monster
        })
    except Exception as e:
        logger.error(f"Error fetching monster {monster_id}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/wallet/<wallet_address>/monsters', methods=['GET'])
def get_wallet_monsters(wallet_address: str):
    """Récupère tous les monstres d'un wallet"""
    try:
        limit = request.args.get('limit', 50, type=int)
        monsters = monster_manager.get_wallet_monsters(wallet_address, limit=limit)
        
        return jsonify({
            "success": True,
            "count": len(monsters),
            "monsters": monsters
        })
    except Exception as e:
        logger.error(f"Error fetching monsters for wallet {wallet_address}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/monsters/<monster_id>/stats', methods=['GET'])
def get_monster_stats(monster_id: str):
    """Récupère uniquement les stats de combat d'un monstre"""
    try:
        stats = monster_manager.get_battle_stats(monster_id)
        if not stats:
            return jsonify({"error": "Monster not found"}), 404
        
        return jsonify({
            "success": True,
            "stats": stats
        })
    except Exception as e:
        logger.error(f"Error fetching stats for monster {monster_id}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/monsters/validate-owner', methods=['POST'])
def validate_owner():
    """Vérifie que les monstres appartiennent bien au wallet"""
    try:
        data = request.get_json()
        monster_id = data.get('monster_id')
        owner = data.get('owner')
        
        if not monster_id or not owner:
            return jsonify({"error": "monster_id and owner required"}), 400
        
        is_valid = monster_manager.validate_monster_owner(monster_id, owner)
        
        return jsonify({
            "success": True,
            "valid": is_valid
        })
    except Exception as e:
        logger.error(f"Error validating ownership: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('MONSTER_API_PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=True)
