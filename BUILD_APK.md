# Guía para Construir la APK de la Aplicación

Esta guía te ayudará a construir una APK (archivo de instalación de Android) a partir de tu aplicación React.

## Requisitos Previos

1. **Node.js y npm** - Ya instalados en tu proyecto
2. **Android Studio** - Necesario para construir la APK
   - Descarga desde: https://developer.android.com/studio
   - Asegúrate de instalar el Android SDK

## Pasos para Construir la APK

### 1. Construir y Sincronizar el Proyecto

Ejecuta el siguiente comando para construir tu aplicación web y sincronizarla con el proyecto Android:

```bash
npm run cap:build
```

Este comando:
- Construye tu aplicación React (`npm run build`)
- Copia los archivos a la carpeta `www` (requerido por Capacitor)
- Sincroniza los archivos con el proyecto Android

### 2. Abrir el Proyecto en Android Studio

Tienes dos opciones:

**Opción A: Usando el comando npm**
```bash
npm run cap:open:android
```

**Opción B: Manualmente**
1. Abre Android Studio
2. Selecciona "Open an Existing Project"
3. Navega a la carpeta `android` dentro de tu proyecto
4. Selecciona la carpeta `android` y haz clic en "OK"

### 3. Construir la APK en Android Studio

Una vez que Android Studio haya terminado de cargar el proyecto:

1. **Espera a que Gradle sincronice** - Android Studio descargará las dependencias necesarias (esto puede tomar varios minutos la primera vez)

2. **Construir APK de Debug** (para pruebas):
   - Ve a `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
   - O usa el atajo: `Ctrl + Shift + A` (Windows/Linux) o `Cmd + Shift + A` (Mac), luego escribe "Build APK"
   - La APK se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Construir APK de Release** (para distribución):
   - Ve a `Build` > `Generate Signed Bundle / APK`
   - Selecciona "APK"
   - Si no tienes un keystore, necesitarás crear uno (Android Studio te guiará)
   - Sigue las instrucciones para firmar tu APK
   - La APK se generará en: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Instalar la APK en un Dispositivo

**Método 1: Desde Android Studio**
- Conecta tu dispositivo Android por USB
- Habilita "Depuración USB" en las opciones de desarrollador de tu dispositivo
- En Android Studio, haz clic en el botón "Run" (▶️) o presiona `Shift + F10`

**Método 2: Transferir manualmente**
- Copia el archivo APK a tu dispositivo Android
- Abre el archivo en tu dispositivo y permite la instalación desde fuentes desconocidas si es necesario

## Comandos Útiles

```bash
# Construir y sincronizar
npm run cap:build

# Abrir Android Studio
npm run cap:open:android

# Solo sincronizar (después de cambios en el código)
npm run cap:sync

# Ver configuración de Capacitor
npx cap config
```

## Solución de Problemas

### Error: "Could not find the web assets directory"
- Asegúrate de ejecutar `npm run build` antes de sincronizar
- El script `cap:build` hace esto automáticamente

### Error: Gradle sync failed
- Asegúrate de tener una conexión a internet estable
- Verifica que Android Studio esté actualizado
- Intenta hacer clic en "Sync Project with Gradle Files" en Android Studio

### La aplicación no se ve correctamente
- Asegúrate de que todas las rutas en tu aplicación sean relativas
- Verifica que los assets estén en la carpeta `public`
- Revisa la consola de Android Studio para ver errores

## Notas Importantes

- **Cada vez que hagas cambios en tu código React**, necesitas ejecutar `npm run cap:build` para sincronizar los cambios
- La primera vez que construyas la APK puede tomar mucho tiempo mientras Android Studio descarga las dependencias
- Para publicar en Google Play Store, necesitarás una APK firmada (release)

## Configuración Actual

- **App ID**: `com.lora.frontend`
- **App Name**: `LoRa Frontend`
- **Web Directory**: `dist` (se copia a `www` automáticamente)
- **Plataforma**: Android (API nivel 23 mínimo)


