# Radar de Anuncios Ganadores

Aplicación web para trabajar principalmente desde una computadora. La biblioteca comienza completamente vacía: cada alumno carga manualmente únicamente los anuncios que encuentra durante su investigación.

## Campos del registro

Todos los campos deben completarse antes de guardar:

- Nombre del producto u oferta.
- Nicho.
- Link de la fanpage.
- Link de la Biblioteca de Anuncios.
- Cantidad de anuncios activos.
- Precio de la oferta.
- Captura del anuncio.
- Observación personal.
- Evaluación final: Sí, Tal vez o No conviene modelarlo.

## Publicar por primera vez en GitHub Pages

1. Descomprimí el archivo ZIP.
2. Abrí la carpeta `radar-anuncios-ganadores`.
3. Verificá que `index.html` esté en la raíz de esa carpeta.
4. Ingresá a GitHub y elegí **New repository**.
5. Escribí un nombre, por ejemplo `radar-anuncios-ganadores`.
6. Creá el repositorio.
7. Elegí **Add file → Upload files**.
8. Subí todos los archivos y carpetas del proyecto.
9. Presioná **Commit changes**.
10. Entrá en **Settings → Pages**.
11. En **Build and deployment**, seleccioná **Deploy from a branch**.
12. Elegí la rama **main** y la carpeta **/(root)**.
13. Guardá. GitHub mostrará el enlace publicado cuando esté listo.

## Reemplazar una versión anterior

1. Descomprimí el nuevo ZIP.
2. Entrá al repositorio en GitHub.
3. Elegí **Add file → Upload files**.
4. Arrastrá todos los archivos y carpetas de la nueva versión.
5. Confirmá **Commit changes** para reemplazar los archivos anteriores.
6. Esperá entre uno y tres minutos y volvé a abrir GitHub Pages.
7. Si todavía aparece la versión anterior, actualizá con `Ctrl + F5` en Windows o `Command + Shift + R` en Mac.

## Cambiar el logo

La aplicación utiliza este archivo:

`assets/logo-radar.jpg`

Para poner tu propio logo:

1. Guardalo en formato JPG.
2. Nombralo exactamente `logo-radar.jpg`, respetando minúsculas y guiones.
3. En GitHub, abrí la carpeta `assets`.
4. Eliminá o reemplazá el archivo anterior.
5. Subí el nuevo `logo-radar.jpg` y confirmá **Commit changes**.
6. Actualizá la página con `Ctrl + F5` o `Command + Shift + R`.

No cambies el nombre ni la extensión del archivo, porque GitHub diferencia mayúsculas, minúsculas y extensiones.

## Respaldo de datos

En **Configuración**:

- **Descargar respaldo** genera un archivo JSON con los anuncios y sus imágenes.
- **Importar respaldo** permite reemplazar o combinar los datos.

Los registros se guardan en el navegador de cada alumno. Una persona no ve los anuncios cargados por otra.
