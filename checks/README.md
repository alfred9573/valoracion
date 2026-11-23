# Check de seguimiento

Formulario de check para clientes que ya llevan un plan. Se publica con GitHub Pages
y las respuestas llegan a una hoja privada de Google Sheets mediante Apps Script.
Este repositorio solo contiene la página, nunca las respuestas.

Es el hermano del formulario de valoración inicial: misma mecánica y mismo diseño,
pero corto y pensado para llenarse cada semana.

## Qué pregunta

Siete secciones, unos 5 minutos:

1. **Tu reporte** — nombre, día del pesaje, semana del plan
2. **Medidas** — peso, cintura, cadera, si fue en ayunas, qué tipo de día fue el anterior, fase del ciclo
3. **Cómo te fue con el plan** — adherencia, si comió fuera, comida libre, si pesó porciones, agua, suplementos
4. **Entrenamiento** — sesiones completadas, días que entrenó, fuerza, cardio, pasos, molestias
5. **Cómo te sentiste** — hambre, energía, fatiga, estrés, sueño, digestión, ánimo
6. **Esta semana** — eventos fuera de lo normal, cambios en medicamentos, dudas
7. **Fotos** — frente, perfil y espalda

Solo son obligatorios nombre, día del pesaje, peso, si fue en ayunas, adherencia,
sesiones completadas y fuerza. Todo lo demás puede quedar en blanco.

Tres preguntas aparecen solo cuando hacen falta: el detalle de lo que comió fuera,
el momento del día en que le dio más hambre, y cuál fue el cambio de medicamento.

## Montaje

### 1. Hoja y carpeta en Drive

- Crea una hoja de cálculo nueva. Copia su ID de la URL
  (`docs.google.com/spreadsheets/d/` **ESTE_PEDAZO** `/edit`).
- Crea una carpeta para las fotos. Copia su ID de la URL igual.

### 2. Apps Script

- En la hoja: **Extensiones › Apps Script**.
- Pega el contenido de `apps-script.gs` y guarda.
- Arriba del archivo, llena `ID_HOJA` e `ID_CARPETA`.
- **Implementar › Nueva implementación › Aplicación web**:
  - Ejecutar como: **Yo**
  - Quién tiene acceso: **Cualquier usuario**
- Copia la URL que termina en `/exec`.

### 3. Conectar el formulario

En `index.html`, busca la línea `const ENDPOINT="";` y pega ahí la URL:

```js
const ENDPOINT="https://script.google.com/macros/s/.../exec";
```

Si se queda vacía, el formulario sigue funcionando pero manda las respuestas
por WhatsApp en vez de a la hoja. Sirve como respaldo si el script se cae.

### 4. Publicar

**Settings › Pages › Deploy from a branch › main / (root)**.
El link queda en `https://<usuario>.github.io/<repo>/`.

## Cómo quedan los datos

Una fila por check en la pestaña `Checks`. Si el cliente reenvía el mismo check,
se actualiza su fila en vez de duplicarla; el formulario guarda un id en el
navegador y el script lo usa para encontrarla.

Las fotos van a una subcarpeta por nombre de cliente dentro de la carpeta de
fotos, nombradas con la fecha, y su enlace queda en las últimas tres columnas
de la fila.

## Notas

- El formulario guarda lo que lleva escrito en el navegador del cliente, así que
  puede cerrarlo y volver después sin perder nada.
- Las fotos se reducen y se comprimen antes de subirse, y reintentan solas si
  falla la conexión.
- La pregunta del ciclo menstrual se le muestra a todos con una opción de
  "no aplica", para no tener que preguntar el sexo en cada check.
