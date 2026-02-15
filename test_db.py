import sys
import os

# Aseguramos que Python encuentre la carpeta src
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from api.supabase_db import SupabaseManager

def run_tests():
    print("--- 1. Probando Conexión Base ---")
    try:
        db = SupabaseManager()
        print("✅ Conexión establecida.")
        res = db.client.table("restaurantes").select("*").limit(1).execute()
        print("🚀 Supabase respondió correctamente.")
    except Exception as e:
        print(f"❌ Falló la conexión: {e}")
        return

    print("\n--- 2. Probando Flujo de Cupones con Join ---")
    try:
        # CONSULTA MAESTRA: Traemos la sucursal Y el nombre del restaurante relacionado
        # Usamos la sintaxis de Supabase para traer datos de la tabla 'restaurantes'
        print("🔍 Consultando sucursal y nombre del restaurante...")
        res = db.client.table("sucursales").select("id, direccion, restaurantes(nombre)").limit(1).execute()
        
        if not res.data:
            print("⚠️ No hay datos en sucursales.")
            return

        dato = res.data[0]
        sucursal_id = dato['id']
        # Accedemos al nombre que viene de la tabla relacionada
        nombre_restaurante = dato['restaurantes']['nombre']
        direccion = dato['direccion']

        print(f"📍 Local encontrado: {nombre_restaurante}")
        print(f"🏠 Dirección: {direccion}")

        # Datos simulados del Agente
        datos_ia = {
            "restaurante": nombre_restaurante,
            "oferta": "Pisco Sour 2x1 solo por hoy",
            "codigo_de_descuento": "VIVE_JOIN_2026",
            "fecha_de_vencimiento": "2026-12-31"
        }

        # Insertar el cupón
        print("🤖 Guardando cupón en la base de datos...")
        resultado = db.insertar_cupon(sucursal_id, datos_ia)

        if resultado:
            print(f"✅ ¡PRUEBA EXITOSA! Cupón vinculado a {nombre_restaurante} guardado.")
        else:
            print("❌ No se pudo insertar el cupón.")

    except Exception as e:
        print(f"❌ Error en el flujo: {e}")

if __name__ == "__main__":
    run_tests()