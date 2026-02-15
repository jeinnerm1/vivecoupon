import googlemaps
import os
from dotenv import load_dotenv

load_dotenv()

class GoogleMapsManager:
    def __init__(self):
        key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not key:
            raise ValueError("❌ No se encontró GOOGLE_MAPS_API_KEY en el .env")
        self.gmaps = googlemaps.Client(key=key)

    def buscar_lugares_cercanos(self, lat, lng, radio=5000, tipo='restaurant'):
        """Busca lugares en un radio de 5km."""
        try:
            places_result = self.gmaps.places_nearby(
                location=(lat, lng),
                radius=radio,
                type=tipo
            )
            return places_result.get('results', [])
        except Exception as e:
            print(f"❌ Error al consultar Google Maps: {e}")
            return []
