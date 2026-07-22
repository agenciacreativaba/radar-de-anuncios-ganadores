# Radar de Anuncios Ganadores

Aplicación web diseñada principalmente para trabajar desde una computadora. Utiliza un panel amplio, navegación lateral permanente, formularios en columnas y una biblioteca visual optimizada para PC. También conserva adaptación básica para pantallas más pequeñas.

Aplicación web para guardar, organizar y evaluar anuncios encontrados durante una investigación.

## Cómo publicar en GitHub Pages

1. Descomprimí el archivo ZIP.
2. Abrí la carpeta `radar-anuncios-ganadores`.
3. Verificá que `index.html` esté en la raíz de esa carpeta.
4. Ingresá a GitHub y elegí **New repository**.
5. Escribí un nombre para el repositorio, por ejemplo `radar-anuncios-ganadores`.
6. Creá el repositorio.
7. Elegí **Add file** → **Upload files**.
8. Subí todos los archivos y carpetas del proyecto: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, `README.md`, `assets` e `icons`.
9. Confirmá la carga con **Commit changes**.
10. Entrá en **Settings** → **Pages**.
11. En **Build and deployment**, seleccioná **Deploy from a branch**.
12. Elegí la rama **main** y la carpeta **/(root)**.
13. Guardá los cambios. GitHub mostrará el enlace publicado cuando esté listo.

## Agregar al inicio del celular

### iPhone

1. Abrí el enlace publicado desde Safari.
2. Tocá el botón de compartir.
3. Elegí **Agregar a pantalla de inicio**.
4. Confirmá con **Agregar**.

### Android

1. Abrí el enlace publicado desde Chrome.
2. Abrí el menú del navegador.
3. Elegí **Instalar aplicación** o **Agregar a pantalla principal**.

## Respaldo de datos

En la aplicación, abrí **Configuración**.

- **Descargar respaldo** genera un archivo JSON con la configuración, los anuncios y las imágenes guardadas.
- **Importar respaldo** permite seleccionar ese archivo y elegir entre reemplazar los datos actuales o combinarlos.

Los datos se guardan en `localStorage` del navegador. Por eso, conviene descargar un respaldo antes de borrar datos del navegador o cambiar de dispositivo.