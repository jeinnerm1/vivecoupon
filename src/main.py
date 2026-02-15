from api.supabase_db import SupabaseManager
from api.google_maps import GoogleMapsManager

def iniciar_agente(lat, lng):
    db = SupabaseManager()
    maps = GoogleMapsManager()
    
    print(f"🕵️ Agente iniciado. Buscando restaurantes a 5km de ({lat}, {lng})...")
    
    # 1. Buscar en Google
    restaurantes_encontrados = maps.buscar_lugares_cercanos(lat, lng)
    
    for lugar in restaurantes_encontrados:
        nombre = lugar['name']
        direccion = lugar.get('vicinity', 'Sin dirección')
        lat_loc = lugar['geometry']['location']['lat']
        lng_loc = lugar['geometry']['location']['lng']
        
        try:
            # 2. Guardar en Supabase
            id_res = db.insertar_restaurante(nombre)
            db.insertar_sucursal(id_res, direccion, lat_loc, lng_loc)
            print(f"✅ Guardado: {nombre}")
        except Exception as e:
            print(f"⚠️ Saltando {nombre}: Ya existe o hubo un error.")

if __name__ == "__main__":
    # Coordenadas de prueba (ejemplo: Santiago de Chile)
    # Cambialas por las tuyas para ver restaurantes reales cerca de ti
    LAT_PRUEBA = -33.4489 
    LNG_PRUEBA = -70.6693
    iniciar_agente(LAT_PRUEBA, LNG_PRUEBA)
