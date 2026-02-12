# 🎫 Vivecoupon AI Hunter

**Vivecoupon** es un agente de inteligencia artificial diseñado para cazar, procesar y geolocalizar cupones de descuento en un radio de 5km utilizando Google Cloud (Vertex AI) y Supabase.

## 🚀 Arquitectura del Proyecto

El proyecto sigue una estructura modular para facilitar el escalamiento y la integración continua (CI/CD):

```text
vivecoupon/
├── .github/workflows/   # Automatización de pruebas y despliegue
├── src/
│   ├── api/             # Conexiones con Supabase y Google Maps
│   ├── core/            # Lógica del Agente de IA y procesamiento
│   └── main.py          # Punto de entrada de la aplicación
├── tests/               # Pruebas unitarias y de integración
└── requirements.txt     # Dependencias del proyecto
