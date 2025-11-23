#!/usr/bin/env python3
"""Battle request listener that connects on-chain requests with the enclave executor."""

from __future__ import annotations

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests

from battle_orchestrator import BATTLE_PACKAGE_ID, run_battle_and_settle

logger = logging.getLogger(__name__)
logging.basicConfig(level=os.getenv("BATTLE_LISTENER_LOG", "INFO"))


def _normalize_rpc_url(url: Optional[str]) -> str:
    base = url or "https://fullnode.testnet.sui.io"
    return base if base.endswith("/") else f"{base}/"


class BattleRequestListener:
    """Polls the Sui RPC for `BattleRequest` events and executes them sequentially."""

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        event_type: Optional[str] = None,
        poll_interval: Optional[int] = None,
        batch_size: Optional[int] = None,
        cursor_path: Optional[str] = None
    ) -> None:
        self.rpc_url = _normalize_rpc_url(rpc_url or os.getenv("SUI_RPC_URL"))
        self.event_type = event_type or os.getenv("BATTLE_REQUEST_EVENT_TYPE")
        if not self.event_type and BATTLE_PACKAGE_ID:
            self.event_type = f"{BATTLE_PACKAGE_ID}::monster_battle::BattleRequest"
        if not self.event_type:
            raise ValueError("BATTLE_REQUEST_EVENT_TYPE or BATTLE_PACKAGE_ID must be configured")
        self.poll_interval = poll_interval or int(os.getenv("BATTLE_REQUEST_POLL_INTERVAL", "12"))
        self.batch_size = batch_size or int(os.getenv("BATTLE_REQUEST_BATCH_SIZE", "5"))
        cursor_default = os.getenv("BATTLE_LISTENER_CURSOR_FILE", ".battle_listener.cursor")
        self.cursor_file = Path(cursor_path or cursor_default)
        self.cursor: Optional[Dict[str, Any]] = self._load_cursor()

    def _load_cursor(self) -> Optional[Dict[str, Any]]:
        if not self.cursor_file.exists():
            return None
        try:
            return json.loads(self.cursor_file.read_text())
        except Exception as exc:
            logger.warning("Could not read cursor file %s (%s)", self.cursor_file, exc)
            return None

    def _save_cursor(self, cursor: Optional[Dict[str, Any]]) -> None:
        if cursor is None:
            return
        try:
            self.cursor_file.write_text(json.dumps(cursor))
        except Exception as exc:
            logger.warning("Could not persist cursor file %s (%s)", self.cursor_file, exc)

    def _rpc_call(self, method: str, params: list[Any]) -> Dict[str, Any]:
        payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
        response = requests.post(self.rpc_url, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        if "error" in data:
            raise RuntimeError(data["error"])
        return data.get("result", {})

    def _parse_event(self, event_entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        parsed = event_entry.get("parsedJson")
        if not parsed:
            return None
        try:
            return {
                "request_id": int(parsed["request_id"]),
                "monster1_id": parsed["monster1_id"],
                "monster2_id": parsed["monster2_id"],
                "requester": parsed.get("requester"),
                "event_id": event_entry.get("id")
            }
        except KeyError:
            return None

    def _pull_requests(self) -> tuple[list[Dict[str, Any]], Optional[Dict[str, Any]]]:
        params: list[Any] = [
            {"MoveEventType": self.event_type},
            self.cursor,
            self.batch_size,
            False
        ]
        result = self._rpc_call("suix_queryEvents", params)
        events = result.get("data", [])
        next_cursor = result.get("nextCursor")
        return events, next_cursor

    def run_once(self) -> None:
        events, next_cursor = self._pull_requests()
        if not events:
            return
        for entry in events:
            request_data = self._parse_event(entry)
            if not request_data:
                continue
            logger.info(
                "⚔️  Processing battle request %s | %s vs %s",
                request_data["request_id"],
                request_data["monster1_id"],
                request_data["monster2_id"]
            )
            try:
                run_battle_and_settle(
                    request_data["monster1_id"],
                    request_data["monster2_id"],
                    request_id=request_data["request_id"],
                    requester=request_data.get("requester")
                )
            except Exception as exc:
                logger.exception("Battle processing failed for request %s (%s)", request_data["request_id"], exc)
                break
        self.cursor = next_cursor
        self._save_cursor(self.cursor)

    def run(self) -> None:
        logger.info("Listening for BattleRequest events (%s)", self.event_type)
        while True:
            try:
                self.run_once()
            except Exception as exc:
                logger.exception("Listener iteration failed (%s)", exc)
            time.sleep(self.poll_interval)


def main() -> None:
    listener = BattleRequestListener()
    listener.run()


if __name__ == "__main__":
    main()
