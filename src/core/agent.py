import os
import sys
import json
import requests
import time
from geopy.geocoders import Nominatim
from dotenv import load_dotenv
from google import genai

# Reparación de Path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.abspath(os.path.join(current_dir, '..'))
if src_path not in sys.path:
    sys.path.append(src_path)

from api.supabase_db import SupabaseManager

load_dotenv()

class ViveCouponAgent:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self.serper_key = os.getenv("SERPER_API_KEY")
        self.db = SupabaseManager()
        # Mantenemos el user_agent único para evitar bloqueos
        self.geolocator = Nominatim(user_agent="vivecoupon_bot_v1")

    def buscar_en_google(self, restaurante):
        print(f"\n🌐 Buscando en la web para {restaurante}...")
        url = "https://google.serper.dev/search"
        payload = json.dumps({
            "q": f"ofertas promociones {restaurante} Santiago Chile 2026", 
            "gl": "cl",
            "hl": "es"
        })
        headers = {'X-API-KEY': self.serper_key, 'Content-Type': 'application/json'}

        try:
            response = requests.post(url, headers=headers, data=payload)
            resultados = response.json().get('organic', [])
            return "\n".join([f"{r.get('title')}: {r.get('snippet')}" for r in resultados[:5]])
        except Exception as e:
            print(f"⚠️ Error en Serper: {e}")
            return ""

    def obtener_lat_lon(self, nombre_restaurante):
        """Busca coordenadas para mejorar el filtro de 5km en el frontend"""
        try:
            # Añadimos Santiago, Chile para forzar precisión
            location = self.geolocator.geocode(f"{nombre_restaurante}, Santiago, Chile")
            if location:
                return location.latitude, location.longitude
            return None, None
        except Exception as e:
            print(f"📍 Error geolocalizando {nombre_restaurante}: {e}")
            return None, None

    def ejecutar(self):
        print("🚀 Iniciando búsqueda de cupones inteligente...")
        res = self.db.client.table("sucursales").select("id, restaurantes(nombre)").execute()
        
        for local in res.data:
            nombre = local['restaurantes']['nombre']
            sucursal_id = local['id']
            
            info_web = self.buscar_en_google(nombre)
            if not info_web: continue

            prompt = (
                f"Analiza: '{info_web}'. Si hay oferta para {nombre}, responde SOLO el objeto JSON. "
                f"Formato: {{\"es_valida\": true, \"titulo\": \"...\", \"descripcion\": \"...\", \"codigo\": \"...\", \"vence\": \"YYYY-MM-DD\"}}"
            )
            
            try:
                response = self.client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
                json_str = response.text.strip().replace("```json", "").replace("```", "")
                res_ia = json.loads(json_str)

                # FILTRO CRÍTICO: Solo si hay oferta, buscamos GPS
                if res_ia.get('es_valida'):
                    print(f"🎯 ¡OFERTA ENCONTRADA!: {res_ia['titulo']}")
                    
                    # REGLA DE NEGOCIO: Geolocalización bajo demanda
                    lat, lon = self.obtener_lat_lon(nombre)
                    res_ia['latitud'] = lat
                    res_ia['longitud'] = lon
                    
                    self.db.insertar_cupon(sucursal_id, res_ia)
                    print(f"✅ Guardado con ubicación para {nombre}")
                else:
                    print(f"🍃 {nombre}: Sin oferta, saltando geolocalización.")

            except Exception as e:
                print(f"⚠️ Error en {nombre}: {e}")

if __name__ == "__main__":
    ViveCouponAgent().ejecutar()