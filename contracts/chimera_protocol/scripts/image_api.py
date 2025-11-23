import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from google import genai
from google.genai import types
from PIL import Image


# --------- CONFIG ---------

# Dossier où on stocke les images
ASSETS_DIR = "assets"
BASE_URL = "http://localhost:8000"  # URL de ton backend en local


# --------- GEMINI ---------

def build_prompt(rarity: int, name: str) -> str:
    """Construit le prompt selon la rareté."""
    if rarity == 1:
        bg = "flat green background"
        style = "cute game monster, simple cartoon style"
    elif rarity == 2:
        bg = "light blue background"
        style = "rare game monster, more detailed, light glow"
    elif rarity == 3:
        bg = "purple magical background with particles"
        style = "epic fantasy monster, highly detailed, strong aura"
    elif rarity == 4:
        bg = "gold or yellow radiant background"
        style = "legendary boss monster, ultra detailed, dramatic lighting"
    else:
        bg = "neutral background"
        style = "cartoon game monster"

    prompt = (
        f"{style}, full body, centered, no text, no logo, HD digital art, "
        f"{bg}. The monster is named {name}."
    )
    return prompt


def generate_monster_image(rarity: int, name: str, out_path: str) -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY n'est pas définie")

    client = genai.Client(api_key=api_key)

    prompt = build_prompt(rarity, name)

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio="1:1",
            ),
        ),
    )

    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    image_saved = False
    for part in response.parts:
        if part.inline_data:
            img = part.as_image()  # PIL.Image
            img.save(out_path)
            image_saved = True

    if not image_saved:
        raise RuntimeError("Aucune image générée par Gemini.")


# --------- API FASTAPI ---------

app = FastAPI()

# On expose le dossier assets/ en statique -> http://localhost:8000/assets/...
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


class GenerateRequest(BaseModel):
    rarity: int
    name: str


class GenerateResponse(BaseModel):
    image_url: str
    filename: str


@app.post("/api/generate-monster-image", response_model=GenerateResponse)
def api_generate_monster_image(body: GenerateRequest):
    """
    Endpoint que le front appelle pour obtenir une image et son URL.
    """
    # Nom de fichier simple : <name>_<rarity>.png
    safe_name = body.name.replace(" ", "_")
    filename = f"{safe_name.lower()}_r{body.rarity}.png"
    out_path = os.path.join(ASSETS_DIR, filename)

    generate_monster_image(body.rarity, body.name, out_path)

    image_url = f"{BASE_URL}/assets/{filename}"

    return GenerateResponse(image_url=image_url, filename=filename)
