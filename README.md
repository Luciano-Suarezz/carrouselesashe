# S.I.A. Cloud Hub - Generador de Carruseles

Esta aplicación es una herramienta web construida con React, Vite y Tailwind CSS para generar carruseles de imágenes utilizando la API de Gemini.

## Requisitos Previos

Asegúrate de tener instalado **Node.js** (versión 18 o superior) en tu computadora. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).

## Instalación

1.  Descarga el código fuente.
2.  Abre una terminal en la carpeta del proyecto.
3.  Instala las dependencias ejecutando:

    ```bash
    npm install
    ```

## Configuración

Para que la aplicación funcione correctamente, necesitas configurar tus claves de API.

### 1. Configuración de Airtable y Cloudinary

Tienes dos opciones:

**Opción A (Recomendada para desarrollo local):**
1.  Copia el archivo `config.example.ts` y renómbralo a `config.ts`.
2.  Abre `config.ts` y rellena tus claves:

    ```typescript
    export const CONFIG = {
      AIRTABLE: {
        API_KEY: 'tu_token_pat_...',
        BASE_ID: 'tu_base_id_app...',
      },
      CLOUDINARY: {
        CLOUD_NAME: 'tu_cloud_name',
        UPLOAD_PRESET: 'tu_upload_preset',
      }
    };
    ```

**Opción B (Ingreso Manual):**
Si no configuras el archivo `config.ts`, la aplicación te pedirá estas claves en la pantalla de inicio de sesión cada vez que entres.

### 2. Clave de API de Gemini

La aplicación te pedirá tu **Gemini API Key** en la pantalla de inicio de sesión. Esta clave se guarda solo en la memoria de la sesión y no se persiste por seguridad.

Si deseas configurarla como variable de entorno localmente (opcional):
1.  Crea un archivo `.env` en la raíz del proyecto.
2.  Añade la siguiente línea:
    ```env
    VITE_GEMINI_API_KEY=tu_clave_api_aqui
    ```
3.  Nota: Tendrás que modificar ligeramente el código para leer esta variable si deseas que se cargue automáticamente, ya que la configuración actual prioriza la entrada manual por seguridad.

## Ejecutar la Aplicación

Para iniciar el servidor de desarrollo local:

```bash
npm run dev
```

Esto abrirá la aplicación en tu navegador, generalmente en `http://localhost:3000` o `http://localhost:5173`.

## Construir para Producción

Si deseas generar los archivos estáticos para subir a un hosting:

```bash
npm run build
```

Los archivos generados estarán en la carpeta `dist`.
