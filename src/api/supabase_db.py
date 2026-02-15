import os
from supabase import create_client, Client
from dotenv import load_dotenv
import re 

load_dotenv()

class SupabaseManager:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        self.client: Client = create_client(url, key)

    def es_fecha_valida(self, fecha_str):
        """Valida si el string tiene formato YYYY-MM-DD"""
        if not fecha_str or not isinstance(fecha_str, str): return False
        return bool(re.match(r'^\d{4}-\d{2}-\d{2}$', fecha_str))

    def insertar_cupon(self, sucursal_id, datos_cupon):
        try:
            # 1. Validar la fecha para evitar errores de tipo en la DB
            vencimiento = datos_cupon.get("vence")
            if not self.es_fecha_valida(vencimiento):
                vencimiento = None

            # 2. Construir el payload incluyendo las nuevas coordenadas
            payload = {
                "sucursal_id": sucursal_id,
                "titulo": datos_cupon.get("titulo") or "Oferta Especial",
                "descripcion": datos_cupon.get("descripcion") or "Sin descripción",
                "codigo_promo": datos_cupon.get("codigo") or "No requiere",
                "fecha_expiracion": vencimiento,
                # Extraemos lat/lon que vienen del agente optimizado
                "latitud": datos_cupon.get("latitud"),
                "longitud": datos_cupon.get("longitud"),
                "metadata_ia": datos_cupon,
                "es_activo": True
            }
            
            # 3. Ejecutar la inserción
            result = self.client.table("cupones").insert(payload).execute()
            return result
            
        except Exception as e:
            # Tip: Imprimir el error completo ayuda a debugear si faltan columnas en la DB
            print(f"❌ Error al insertar en Supabase: {e}")
            return None