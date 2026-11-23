/**
 * Checks de seguimiento — receptor de respuestas y fotos.
 *
 * Qué hace:
 *   1. Guarda cada check como una fila en la hoja CHECKS.
 *   2. Si el mismo check se reenvía (mismo id), ACTUALIZA su fila en vez de duplicarla.
 *   3. Guarda las 3 fotos en una subcarpeta por cliente dentro de CARPETA_FOTOS.
 *
 * Montaje (una sola vez):
 *   1. Crea una hoja de cálculo nueva en tu Drive y copia su ID de la URL.
 *   2. Crea una carpeta en Drive para las fotos y copia su ID.
 *   3. Pega los dos IDs abajo.
 *   4. Extensiones > Apps Script, pega este archivo, guarda.
 *   5. Implementar > Nueva implementación > Aplicación web.
 *        Ejecutar como: Yo
 *        Quién tiene acceso: Cualquier usuario
 *   6. Copia la URL que termina en /exec y pégala en ENDPOINT dentro de index.html.
 */

const ID_HOJA    = "PEGA_AQUI_EL_ID_DE_TU_HOJA";
const ID_CARPETA = "PEGA_AQUI_EL_ID_DE_TU_CARPETA_DE_FOTOS";
const NOMBRE_PESTANA = "Checks";

/* Orden de las columnas. Coincide con los campos del formulario. */
const CAMPOS = [
  "nombre",
  "fecha",
  "semana",
  "peso",
  "cintura",
  "cadera",
  "ayunas",
  "diaayer",
  "ciclo",
  "adherencia",
  "pico",
  "quepico",
  "libre",
  "pesar",
  "agua",
  "suplementos",
  "sesiones",
  "dias",
  "fuerza",
  "fuerzadonde",
  "cardio",
  "pasos",
  "molestias",
  "hambre",
  "cuandohambre",
  "energia",
  "fatiga",
  "estres",
  "sueno",
  "digestion",
  "animo",
  "eventos",
  "cambiomed",
  "cualcambio",
  "dudas",
  "comentarios"
];
const ENCABEZADOS = [
  "Recibido", "ID", "Estado",
  "Nombre",
  "Día del pesaje",
  "Semana del plan",
  "Peso",
  "Cintura (ombligo)",
  "Cadera",
  "Pesaje en ayunas",
  "Día previo al pesaje",
  "Fase del ciclo",
  "Adherencia (1–5)",
  "Comió fuera del plan",
  "Qué comió fuera",
  "Comida libre",
  "Pesó porciones",
  "Agua",
  "Suplementos",
  "Sesiones completadas",
  "Días que entrenó",
  "Fuerza",
  "Dónde notó la fuerza",
  "Cardio",
  "Pasos",
  "Molestias",
  "Hambre (1–5)",
  "Cuándo le dio hambre",
  "Energía (1–5)",
  "Fatiga (1–5)",
  "Estrés (1–5)",
  "Sueño",
  "Digestión",
  "Ánimo (1–5)",
  "Eventos de la semana",
  "Cambio en medicamentos",
  "Cuál cambio",
  "Dudas",
  "Comentarios",
  "Foto frente", "Foto perfil", "Foto espalda"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.accion === "foto") return guardarFoto(d);
    return guardarRespuestas(d);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("Receptor de checks activo.");
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function hoja() {
  const libro = SpreadsheetApp.openById(ID_HOJA);
  let h = libro.getSheetByName(NOMBRE_PESTANA);
  if (!h) h = libro.insertSheet(NOMBRE_PESTANA);
  /* Pone los encabezados si la fila 1 no los tiene, aunque la pestaña ya
     existiera (por ejemplo, si se renombró la "Hoja 1" a mano). */
  if (h.getLastRow() === 0 || h.getRange(1, 1).getValue() !== ENCABEZADOS[0]) {
    if (h.getLastRow() > 0) h.insertRowBefore(1);
    h.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]).setFontWeight("bold");
    h.setFrozenRows(1);
  }
  return h;
}

/* Busca la fila de un id. Devuelve 0 si no existe. */
function filaDeId(h, id) {
  const n = h.getLastRow();
  if (n < 2) return 0;
  const ids = h.getRange(2, 2, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

function guardarRespuestas(d) {
  const h = hoja();
  const a = d.answers || {};
  const valores = [
    new Date(),
    d.id || "",
    d.enviado ? "Enviado" : ("En progreso · " + (d.paso || ""))
  ].concat(CAMPOS.map(function (k) {
    const v = a[k];
    if (v === undefined || v === null) return "";
    return Array.isArray(v) ? v.join(", ") : v;
  }));

  const fila = filaDeId(h, d.id);
  if (fila) {
    /* No pisa las columnas de fotos, que se llenan por separado. */
    h.getRange(fila, 1, 1, valores.length).setValues([valores]);
  } else {
    h.appendRow(valores);
  }
  return json({ ok: true });
}

function guardarFoto(d) {
  const raiz = DriveApp.getFolderById(ID_CARPETA);
  const nombre = (d.nombre || "Sin nombre").trim();
  const carpeta = subcarpeta(raiz, nombre);

  const sello = Utilities.formatDate(new Date(), "America/Mexico_City", "yyyy-MM-dd");
  const archivo = carpeta.createFile(
    Utilities.newBlob(Utilities.base64Decode(d.data), "image/jpeg",
      sello + " · " + nombre + " · " + d.tipo + ".jpg"));

  /* Anota el enlace en la fila del check. */
  const h = hoja();
  const fila = filaDeId(h, d.id);
  if (fila) {
    const col = { frente: 0, perfil: 1, espalda: 2 }[d.tipo];
    if (col !== undefined) {
      h.getRange(fila, ENCABEZADOS.length - 2 + col).setValue(archivo.getUrl());
    }
  }
  return json({ ok: true, url: archivo.getUrl() });
}

function subcarpeta(raiz, nombre) {
  const it = raiz.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : raiz.createFolder(nombre);
}
