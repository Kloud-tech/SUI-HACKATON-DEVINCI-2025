import os
import sys
from io import BytesIO

from google import genai
from google.genai import types
from PIL import Image


# Le client Gemini - l'API key est lue depuis GEMINI_API_KEY
def make_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("La variable d'environnement GEMINI_API_KEY n'est pas définie.")
    return genai.Client(api_key=api_key)


def build_prompt(rarity: int, name: str) -> str:
    """
    Construit le prompt d'image en fonction de la rareté.
    Tu peux ajuster les styles comme tu veux.
    """
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
    client = make_client()
    prompt = build_prompt(rarity, name)

    print("Prompt utilisé :")
    print(prompt)
    print("\nGénération de l'image avec Gemini...")

    # Appel à Gemini 2.5 Flash Image (modèle dédié aux images)
    # Doc officielle : ai.google.dev/gemini-api/docs/image-generation 
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[prompt],
    )

    # On parcourt les "parts" de la réponse pour trouver l'image
    image_saved = False
    for part in response.parts:
        if part.text is not None:
            # parfois le modèle renvoie aussi un peu de texte
            print("Texte renvoyé par le modèle :")
            print(part.text)
        elif part.inline_data is not None:
            # C'est ici que se trouve l'image (sous forme de bytes)
            img = part.as_image()  # renvoie un objet PIL.Image
            img.save(out_path)
            image_saved = True
            print(f"✅ Image sauvegardée dans : {out_path}")

    if not image_saved:
        raise RuntimeError("Aucune image n'a été générée dans la réponse de Gemini.")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage : python scripts/generate_monster_image_gemini.py <rarity> <name> <output_path>")
        print("Exemple : python scripts/generate_monster_image_gemini.py 3 Pikalex assets/pikalex_epic.png")
        sys.exit(1)

    rarity = int(sys.argv[1])
    name = sys.argv[2]
    out_path = sys.argv[3]

    generate_monster_image(rarity, name, out_path)
