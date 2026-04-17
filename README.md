# Sistema Experto Medico con IA y Arbol Jerarquico
# INTEGRANTES : 
# Andres E. Leiva
# Carlos A. Rivera
# Marco A. Palma
# Florisell Cruz
# Angel J. Lagos
# Elias  J. Caballero

Proyecto full-stack con:

- Backend en Node.js + Express

- Frontend moderno en Flet
- Flujo exportable de Node-RED con TensorFlow
- Arbol jerarquico dinamico para el diagnostico

# Sistema Experto Médico con IA y Árbol Jerárquico

<div align="center">
  <img src="Sistema.png" alt="Interfaz del Sistema Experto Médico con IA" width="85%">
</div>



## Estructura

```text
Sistema_experto/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── package.json
│   └── src/
├── frontend/
│   ├── app.py
│   └── requirements.txt
├── nodered/
│   └── flujo.json
└── README.md
```

## 1. Instalar dependencias

### Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edita `backend/.env` y agrega tu clave:

```env
DEEPSEEK_API_KEY=tu_api_key_real de openrouter
```

### Frontend Flet

Ya se dejo creado un entorno virtual local en la raiz del proyecto: `.venv`.

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r frontend\requirements.txt
```

## 2. Ejecutar el backend

Desde `backend/`:

```powershell
npm run dev
```

O en modo normal:

```powershell
node server.js
```

La API quedara en:

```text
http://localhost:3000
```

Endpoints principales:

- `GET /health`
- `POST /diagnostico`

## 3. Ejecutar el frontend Flet

Desde la raiz del proyecto o desde `frontend/`:

```powershell
.\.venv\Scripts\python.exe frontend\app.py
```

La interfaz permite:

- Seleccionar sintomas con checkboxes
- Elegir tipo de enfermedad con radio buttons
- Completar dropdowns de edad, sexo y urgencia
- Ver loader mientras se consulta el backend
- Mostrar arbol jerarquico dinamico
- Leer la explicacion del diagnostico

## 4. Importar y usar Node-RED

Instala Node-RED y el nodo de TensorFlow:

```powershell
$nodeRedHome = Join-Path $env:USERPROFILE ".node-red"
Set-Location $nodeRedHome
npm install node-red-contrib-tensorflow
```

Luego:

1. Inicia Node-RED.
2. Abre el menu `Import`.
3. Importa el archivo `nodered/flujo.json`.
4. Verifica que el nodo `TensorFlow COCO-SSD` exista.
5. Confirma que el nodo HTTP Request apunte a `http://localhost:3000/diagnostico`.

Flujo expuesto:

- `POST /vision-medica/analizar`

El flujo hace lo siguiente:

1. Recibe sintomas y una imagen opcional en base64.
2. Si hay imagen, la procesa con el nodo `cocossd` de `node-red-contrib-tensorflow`.
3. Aplica una capa de correlacion para representar objetos medicos: `jeringa`, `glucometro`, `pastillas`.
4. Envía el caso enriquecido al backend.
5. Responde con el diagnostico y la correlacion visual.

Nota:
El modelo COCO-SSD no trae clases medicas exactas como `glucometro`, por eso el flujo incorpora una simulacion/control por reglas, tal como permite el requisito de clasificacion simulada.

## 5. Formato de entrada del backend

### `POST /diagnostico`

```json
{
  "sintomas": ["sed excesiva", "fatiga", "vision borrosa"],
  "tipoEnfermedad": "metabolica",
  "grupoEdad": "adulto",
  "sexo": "femenino",
  "nivelUrgencia": "media",
  "contextoClinico": "control ambulatorio",
  "objetosDetectados": ["glucometro"]
}
```

## 6. Formato de salida esperado

```json
{
  "ok": true,
  "enfermedad": "Diabetes mellitus tipo 2",
  "tipo": "metabolica",
  "sintomas": ["sed excesiva", "poliuria", "fatiga"],
  "pruebas": ["glucosa en ayunas", "hemoglobina glicosilada"],
  "diagnostico": "Sospecha clinica compatible con diabetes mellitus tipo 2.",
  "tratamiento": ["control nutricional", "actividad fisica", "valoracion medica"],
  "explicacion": "Los sintomas y el apoyo visual orientan a una alteracion metabolica.",
  "meta": {
    "modelo": "deepseek-chat",
    "intentos": 1,
    "objetosDetectados": ["glucometro"],
    "timestamp": "2026-04-15T00:00:00.000Z"
  }
}
```

## 7. Ejemplo de uso

### Probar el backend directamente

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/diagnostico" `
  -ContentType "application/json" `
  -Body '{
    "sintomas": ["sed excesiva", "vision borrosa", "fatiga"],
    "tipoEnfermedad": "metabolica",
    "grupoEdad": "adulto",
    "sexo": "masculino",
    "nivelUrgencia": "media",
    "contextoClinico": "consulta general",
    "objetosDetectados": ["glucometro"]
  }'
```

### Probar el flujo de Node-RED

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:1880/vision-medica/analizar" `
  -ContentType "application/json" `
  -Body '{
    "sintomas": ["fiebre", "fatiga"],
    "tipoEnfermedad": "infecciosa",
    "grupoEdad": "adulto",
    "sexo": "femenino",
    "nivelUrgencia": "alta",
    "contextoClinico": "triage",
    "objetosSimulados": ["pastillas"]
  }'
```

## 8. Buenas practicas implementadas

- Validacion de inputs en backend
- Manejo centralizado de errores
- Reintentos si DeepSeek no devuelve JSON valido
- JSON estricto con parseo y saneamiento
- UI con manejo de estado y loader
- Separacion modular por capas

## 9. Archivos clave

- `backend/src/services/diagnosis.service.js`: orquesta prompts, parseo, validacion y reintentos
- `backend/src/services/deepseek.client.js`: integra DeepSeek
- `frontend/app.py`: interfaz Flet y arbol dinamico
- `nodered/flujo.json`: flujo exportable para Node-RED

Iniciar el proyecto

cd "c:\Users\Angel\Documents\curso node js\Sistema_experto"
.\start.ps1


Si PowerShell  bloquea la ejecución por política
powershell -ExecutionPolicy Bypass -File .\start.ps1
