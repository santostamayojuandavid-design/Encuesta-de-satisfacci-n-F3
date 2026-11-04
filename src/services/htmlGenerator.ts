export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Código de Google Apps Script para recibir respuestas de la encuesta
 * y guardarlas automáticamente en la pestaña "Encuesta F3".
 * Hoja vinculada: ID "1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo"
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Hoja de Cálculo en Google Sheets (ID: 1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo).
 * 2. En el menú superior haz clic en: Extensiones > Apps Script.
 * 3. Borra todo el código que aparezca y pega este código completo.
 * 4. Haz clic en "Implementar" (botón azul superior derecho) > "Nueva implementación".
 * 5. Selecciona tipo: "Aplicación web".
 * 6. Configura:
 *    - Descripción: "Receptor Encuesta Ambiente F3"
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquier persona" (Anyone)
 * 7. Haz clic en "Implementar", autoriza los permisos y COPIA la "URL de la aplicación web".
 * 8. Pega esa URL en el formulario HTML o en el panel de configuración de esta app.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Encuesta F3";
    var sheet = ss.getSheetByName(sheetName);

    // Si la pestaña "Encuesta F3" no existe, se crea automáticamente
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Si la hoja está vacía, insertar los encabezados oficiales
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Marca temporal",
        "1. ¿Cuál es tu relación con el Centro Agropecuario de Buga?",
        "2. ¿Con qué frecuencia utilizas el ambiente F3?",
        "3. ¿Qué tan satisfecho(a) estás con el estado general de las instalaciones del ambiente F3?",
        "4. ¿Qué tan satisfecho(a) estás con la limpieza y el orden del ambiente F3?",
        "5. ¿Qué tan satisfecho(a) estás con el estado y funcionamiento de los equipos y recursos disponibles?",
        "6. ¿Qué tan satisfecho(a) estás con la comodidad, iluminación y ventilación del ambiente?",
        "7. ¿Qué tan satisfecho(a) estás con la disponibilidad del ambiente para desarrollar tus actividades?",
        "8. En general, ¿qué tan satisfecho(a) estás con el uso del ambiente F3?",
        "9. ¿Qué aspectos del ambiente F3 consideras que se deben mejorar?",
        "10. ¿Qué sugerencias tienes para mejorar el ambiente F3?"
      ];
      sheet.appendRow(headers);

      // Formatear la fila de encabezados institucional SENA
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#39A900");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }

    // Parsear datos recibidos
    var rawData;
    if (e.postData && e.postData.contents) {
      try {
        rawData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        rawData = e.parameter;
      }
    } else {
      rawData = e.parameter || {};
    }

    // Generar marca temporal en zona horaria Colombia (UTC-5)
    var timestamp = Utilities.formatDate(new Date(), "America/Bogota", "dd/MM/yyyy HH:mm:ss");

    var q1 = rawData.q1 || rawData.relacion || "";
    var q2 = rawData.q2 || rawData.frecuencia || "";
    var q3 = rawData.q3 || rawData.instalaciones || "";
    var q4 = rawData.q4 || rawData.limpieza || "";
    var q5 = rawData.q5 || rawData.equipos || "";
    var q6 = rawData.q6 || rawData.comodidad || "";
    var q7 = rawData.q7 || rawData.disponibilidad || "";
    var q8 = rawData.q8 || rawData.general || "";
    var q9 = rawData.q9 || rawData.aspectos || "";
    var q10 = rawData.q10 || rawData.sugerencias || "";

    // Insertar la fila de respuestas
    sheet.appendRow([
      timestamp,
      q1,
      q2,
      q3,
      q4,
      q5,
      q6,
      q7,
      q8,
      q9,
      q10
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "Respuesta registrada en 'Encuesta F3'" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ "status": "ok", "message": "Servicio de recepción de Encuesta F3 activo" }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export function generateStandaloneHtml(webhookUrl = ''): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Encuesta de Satisfacción - Ambiente F3 | Centro Agropecuario de Buga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --sena-green: #39A900;
      --sena-dark-green: #2e8300;
      --sena-light-green: #e9f7e5;
      --bg-slate: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --border-focus: #39A900;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --radius: 12px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    body {
      background-color: var(--bg-slate);
      color: var(--text-main);
      line-height: 1.5;
      padding: 24px 16px 60px;
    }

    .container {
      max-width: 780px;
      margin: 0 auto;
    }

    .header-card {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      border-radius: var(--radius);
      padding: 32px 28px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-lg);
      position: relative;
      overflow: hidden;
      border-top: 6px solid var(--sena-green);
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(57, 169, 0, 0.2);
      color: #86efac;
      border: 1px solid rgba(57, 169, 0, 0.4);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .header-title {
      font-size: 26px;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 10px;
      color: #ffffff;
    }

    .header-subtitle {
      font-size: 14px;
      color: #cbd5e1;
      max-width: 680px;
      line-height: 1.6;
    }

    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 13px;
      color: #94a3b8;
    }

    .meta-tag {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .survey-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .question-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 24px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .question-card:focus-within {
      border-color: var(--sena-green);
      box-shadow: 0 0 0 3px rgba(57, 169, 0, 0.12);
    }

    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 16px;
    }

    .question-number {
      background: var(--sena-light-green);
      color: var(--sena-dark-green);
      font-size: 13px;
      font-weight: 700;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .question-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.4;
    }

    .required-dot {
      color: #ef4444;
      font-weight: 700;
      margin-left: 3px;
    }

    .options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    @media (min-width: 540px) {
      .options-grid.two-cols {
        grid-template-columns: 1fr 1fr;
      }
    }

    .radio-option, .checkbox-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: 1.5px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s ease-in-out;
      background: #fafafa;
    }

    .radio-option:hover, .checkbox-option:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .radio-option input[type="radio"],
    .checkbox-option input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--sena-green);
      cursor: pointer;
      flex-shrink: 0;
    }

    /* Likert Scale 1 to 5 */
    .scale-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .scale-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }

    .scale-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px 6px;
      border: 2px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s;
      background: #ffffff;
      text-align: center;
    }

    .scale-btn input[type="radio"] {
      display: none;
    }

    .scale-num {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
    }

    .scale-btn:hover {
      border-color: var(--sena-green);
      background: #f9fef8;
    }

    .scale-btn.selected {
      border-color: var(--sena-green);
      background: var(--sena-light-green);
      color: var(--sena-dark-green);
      box-shadow: 0 0 0 1px var(--sena-green);
    }

    .scale-btn.selected .scale-num {
      color: var(--sena-dark-green);
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
      padding: 0 4px;
    }

    /* Textarea */
    textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px 14px;
      border: 1.5px solid var(--border-color);
      border-radius: 10px;
      font-size: 14px;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    textarea:focus {
      border-color: var(--sena-green);
      box-shadow: 0 0 0 3px rgba(57, 169, 0, 0.12);
    }

    .text-input {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      margin-top: 8px;
    }

    .text-input:focus {
      border-color: var(--sena-green);
    }

    .submit-bar {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn-submit {
      background: var(--sena-green);
      color: #ffffff;
      border: none;
      padding: 16px 28px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: var(--shadow-md);
      transition: background-color 0.2s, transform 0.1s;
    }

    .btn-submit:hover {
      background: var(--sena-dark-green);
    }

    .btn-submit:active {
      transform: scale(0.99);
    }

    .btn-submit:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      transform: none;
    }

    /* Success / Alerts */
    .alert-box {
      display: none;
      padding: 20px;
      border-radius: var(--radius);
      margin-top: 20px;
      font-size: 15px;
      text-align: center;
    }

    .alert-success {
      background: #dcfce7;
      color: #14532d;
      border: 1px solid #86efac;
    }

    .alert-error {
      background: #fee2e2;
      color: #7f1d1d;
      border: 1px solid #fca5a5;
    }

    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid #ffffff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 0.8s linear infinite;
      display: none;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <div class="container">
    
    <!-- CABECERA INSTITUCIONAL -->
    <header class="header-card">
      <div class="header-badge">
        <span>SENA</span> &bull; <span>Centro Agropecuario de Buga</span>
      </div>
      <h1 class="header-title">Encuesta de Satisfacción - Ambiente de Cómputo F3</h1>
      <p class="header-subtitle">
        Tu opinión es fundamental para el mejoramiento continuo de nuestros ambientes de aprendizaje. Esta encuesta consta de 10 preguntas breves y las respuestas se guardan en tiempo real en la hoja <strong>"Encuesta F3"</strong> (ID: <code>1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo</code>).
      </p>
      <div class="meta-tags">
        <div class="meta-tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Sede Buga, Valle del Cauca
        </div>
        <div class="meta-tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Sala Informática F3
        </div>
        <div class="meta-tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Hoja destino: Encuesta F3
        </div>
      </div>
    </header>

    <!-- FORMULARIO -->
    <form id="satisfactionForm" class="survey-form">

      <!-- PREGUNTA 1 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">1</span>
          <div class="question-title">¿Cuál es tu relación con el Centro Agropecuario de Buga?<span class="required-dot">*</span></div>
        </div>
        <div class="options-grid two-cols">
          <label class="radio-option">
            <input type="radio" name="q1_relationship" value="Aprendiz" required>
            <span>Aprendiz</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q1_relationship" value="Instructor(a)">
            <span>Instructor(a)</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q1_relationship" value="Administrativo(a) / Funcionario">
            <span>Administrativo(a) / Funcionario</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q1_relationship" value="Egresado(a)">
            <span>Egresado(a)</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q1_relationship" value="Visitante / Externo">
            <span>Visitante / Externo</span>
          </label>
        </div>
      </div>

      <!-- PREGUNTA 2 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">2</span>
          <div class="question-title">¿Con qué frecuencia utilizas el ambiente F3?<span class="required-dot">*</span></div>
        </div>
        <div class="options-grid two-cols">
          <label class="radio-option">
            <input type="radio" name="q2_frequency" value="Diariamente" required>
            <span>Diariamente</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q2_frequency" value="Varias veces a la semana">
            <span>Varias veces a la semana</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q2_frequency" value="Una vez a la semana">
            <span>Una vez a la semana</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q2_frequency" value="Quincenalmente">
            <span>Quincenalmente</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="q2_frequency" value="Ocasionalmente / Primera vez">
            <span>Ocasionalmente / Primera vez</span>
          </label>
        </div>
      </div>

      <!-- PREGUNTA 3 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">3</span>
          <div class="question-title">¿Qué tan satisfecho(a) estás con el estado general de las instalaciones del ambiente F3?<span class="required-dot">*</span></div>
        </div>
        <div class="scale-container">
          <div class="scale-row">
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q3_facilities" value="1" required>
              <span class="scale-num">1</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q3_facilities" value="2">
              <span class="scale-num">2</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q3_facilities" value="3">
              <span class="scale-num">3</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q3_facilities" value="4">
              <span class="scale-num">4</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q3_facilities" value="5">
              <span class="scale-num">5</span>
            </label>
          </div>
          <div class="scale-labels">
            <span>1 = Muy Insatisfecho</span>
            <span>3 = Neutral</span>
            <span>5 = Muy Satisfecho</span>
          </div>
        </div>
      </div>

      <!-- PREGUNTA 4 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">4</span>
          <div class="question-title">¿Qué tan satisfecho(a) estás con la limpieza y el orden del ambiente F3?<span class="required-dot">*</span></div>
        </div>
        <div class="scale-container">
          <div class="scale-row">
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q4_cleanliness" value="1" required>
              <span class="scale-num">1</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q4_cleanliness" value="2">
              <span class="scale-num">2</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q4_cleanliness" value="3">
              <span class="scale-num">3</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q4_cleanliness" value="4">
              <span class="scale-num">4</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q4_cleanliness" value="5">
              <span class="scale-num">5</span>
            </label>
          </div>
          <div class="scale-labels">
            <span>1 = Muy Insatisfecho</span>
            <span>3 = Neutral</span>
            <span>5 = Muy Satisfecho</span>
          </div>
        </div>
      </div>

      <!-- PREGUNTA 5 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">5</span>
          <div class="question-title">¿Qué tan satisfecho(a) estás con el estado y funcionamiento de los equipos y recursos disponibles?<span class="required-dot">*</span></div>
        </div>
        <div class="scale-container">
          <div class="scale-row">
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q5_equipment" value="1" required>
              <span class="scale-num">1</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q5_equipment" value="2">
              <span class="scale-num">2</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q5_equipment" value="3">
              <span class="scale-num">3</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q5_equipment" value="4">
              <span class="scale-num">4</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q5_equipment" value="5">
              <span class="scale-num">5</span>
            </label>
          </div>
          <div class="scale-labels">
            <span>1 = Muy Insatisfecho</span>
            <span>3 = Neutral</span>
            <span>5 = Muy Satisfecho</span>
          </div>
        </div>
      </div>

      <!-- PREGUNTA 6 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">6</span>
          <div class="question-title">¿Qué tan satisfecho(a) estás con la comodidad, iluminación y ventilación del ambiente?<span class="required-dot">*</span></div>
        </div>
        <div class="scale-container">
          <div class="scale-row">
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q6_comfort" value="1" required>
              <span class="scale-num">1</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q6_comfort" value="2">
              <span class="scale-num">2</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q6_comfort" value="3">
              <span class="scale-num">3</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q6_comfort" value="4">
              <span class="scale-num">4</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q6_comfort" value="5">
              <span class="scale-num">5</span>
            </label>
          </div>
          <div class="scale-labels">
            <span>1 = Muy Insatisfecho</span>
            <span>3 = Neutral</span>
            <span>5 = Muy Satisfecho</span>
          </div>
        </div>
      </div>

      <!-- PREGUNTA 7 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">7</span>
          <div class="question-title">¿Qué tan satisfecho(a) estás con la disponibilidad del ambiente para desarrollar tus actividades?<span class="required-dot">*</span></div>
        </div>
        <div class="scale-container">
          <div class="scale-row">
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q7_availability" value="1" required>
              <span class="scale-num">1</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q7_availability" value="2">
              <span class="scale-num">2</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q7_availability" value="3">
              <span class="scale-num">3</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q7_availability" value="4">
              <span class="scale-num">4</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q7_availability" value="5">
              <span class="scale-num">5</span>
            </label>
          </div>
          <div class="scale-labels">
            <span>1 = Muy Insatisfecho</span>
            <span>3 = Neutral</span>
            <span>5 = Muy Satisfecho</span>
          </div>
        </div>
      </div>

      <!-- PREGUNTA 8 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">8</span>
          <div class="question-title">En general, ¿qué tan satisfecho(a) estás con el uso del ambiente F3?<span class="required-dot">*</span></div>
        </div>
        <div class="scale-container">
          <div class="scale-row">
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q8_overall" value="1" required>
              <span class="scale-num">1</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q8_overall" value="2">
              <span class="scale-num">2</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q8_overall" value="3">
              <span class="scale-num">3</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q8_overall" value="4">
              <span class="scale-num">4</span>
            </label>
            <label class="scale-btn" onclick="selectScale(this)">
              <input type="radio" name="q8_overall" value="5">
              <span class="scale-num">5</span>
            </label>
          </div>
          <div class="scale-labels">
            <span>1 = Muy Insatisfecho</span>
            <span>3 = Neutral</span>
            <span>5 = Muy Satisfecho</span>
          </div>
        </div>
      </div>

      <!-- PREGUNTA 9 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">9</span>
          <div class="question-title">¿Qué aspectos del ambiente F3 consideras que se deben mejorar? (Selecciona los que apliquen)</div>
        </div>
        <div class="options-grid two-cols">
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Infraestructura e instalaciones">
            <span>Infraestructura e instalaciones</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Equipos y recursos disponibles">
            <span>Equipos y recursos disponibles</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Conectividad e Internet">
            <span>Conectividad e Internet</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Comodidad, iluminación y ventilación">
            <span>Comodidad, iluminación y ventilación</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Limpieza y orden">
            <span>Limpieza y orden</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Disponibilidad y horarios de uso">
            <span>Disponibilidad y horarios de uso</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Software y programas requeridos">
            <span>Software y programas requeridos</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="q9_aspects" value="Ninguno / Todo en buen estado">
            <span>Ninguno / Todo en buen estado</span>
          </label>
        </div>
        <input type="text" id="q9_other" class="text-input" placeholder="Otro aspecto específico (opcional)...">
      </div>

      <!-- PREGUNTA 10 -->
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">10</span>
          <div class="question-title">¿Qué sugerencias tienes para mejorar el ambiente F3?</div>
        </div>
        <textarea name="q10_suggestions" rows="4" placeholder="Escribe aquí tus recomendaciones, comentarios o propuestas de mejora..."></textarea>
      </div>

      <!-- BOTON DE ENVIO -->
      <div class="submit-bar">
        <button type="submit" id="submitBtn" class="btn-submit">
          <span class="spinner" id="btnSpinner"></span>
          <span id="btnText">Enviar Respuestas a Google Sheets</span>
        </button>
      </div>

      <!-- MENSAJES DE ESTADO -->
      <div id="alertSuccess" class="alert-box alert-success">
        <h3 style="font-weight: 700; font-size: 17px; margin-bottom: 6px;">¡Encuesta enviada exitosamente!</h3>
        <p>Tu opinión ha sido registrada en la hoja de cálculo <strong>"Encuesta F3"</strong>. Muchas gracias por contribuir al mejoramiento del ambiente F3.</p>
        <button type="button" onclick="resetForm()" style="margin-top: 14px; background: #15803d; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">Llenar otra respuesta</button>
      </div>

      <div id="alertError" class="alert-box alert-error">
        <h3 style="font-weight: 700; font-size: 17px; margin-bottom: 6px;">No se pudo enviar la encuesta</h3>
        <p id="errorMessage">Ocurrió un error al contactar la hoja de Google Sheets. Por favor verifica tu conexión o la URL del script.</p>
      </div>

    </form>
  </div>

  <script>
    // URL DE TU GOOGLE APPS SCRIPT WEB APP (Reemplázala con la generada en tu Google Sheet)
    const APPS_SCRIPT_URL = "${webhookUrl || 'TU_URL_DE_APPS_SCRIPT_AQUI'}";

    function selectScale(labelElement) {
      const container = labelElement.closest('.scale-row');
      container.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('selected'));
      labelElement.classList.add('selected');
      const radio = labelElement.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }

    const form = document.getElementById('satisfactionForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');
    const alertSuccess = document.getElementById('alertSuccess');
    const alertError = document.getElementById('alertError');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Recopilar respuestas
      const formData = new FormData(form);
      const q9Selected = [];
      document.querySelectorAll('input[name="q9_aspects"]:checked').forEach(cb => {
        q9Selected.push(cb.value);
      });
      const q9Other = document.getElementById('q9_other').value.trim();
      let q9Final = q9Selected.join(', ');
      if (q9Other) {
        q9Final = q9Final ? q9Final + ', Otro: ' + q9Other : 'Otro: ' + q9Other;
      }

      const payload = {
        sheetName: "Encuesta F3",
        q1: formData.get('q1_relationship'),
        q2: formData.get('q2_frequency'),
        q3: formData.get('q3_facilities'),
        q4: formData.get('q4_cleanliness'),
        q5: formData.get('q5_equipment'),
        q6: formData.get('q6_comfort'),
        q7: formData.get('q7_availability'),
        q8: formData.get('q8_overall'),
        q9: q9Final,
        q10: formData.get('q10_suggestions') || ''
      };

      // Validar si la URL fue configurada
      if (APPS_SCRIPT_URL.includes('TU_URL_DE_APPS_SCRIPT_AQUI') || !APPS_SCRIPT_URL.startsWith('https://script.google.com/')) {
        alertError.style.display = 'block';
        errorMessage.innerHTML = '<strong>Configuración requerida:</strong> Debes desplegar el código de Google Apps Script en tu Google Sheet y pegar la URL de la aplicación web en la variable <code>APPS_SCRIPT_URL</code>.';
        alertError.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Animación de envío
      submitBtn.disabled = true;
      btnSpinner.style.display = 'inline-block';
      btnText.textContent = 'Enviando a Encuesta F3...';
      alertSuccess.style.display = 'none';
      alertError.style.display = 'none';

      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        // En modo no-cors de Google Apps Script la respuesta es opaca pero se guarda con éxito
        alertSuccess.style.display = 'block';
        alertSuccess.scrollIntoView({ behavior: 'smooth' });
        form.reset();
        document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('selected'));
      } catch (err) {
        console.error('Error al enviar:', err);
        alertError.style.display = 'block';
        errorMessage.textContent = 'Error de conexión: ' + err.message;
        alertError.scrollIntoView({ behavior: 'smooth' });
      } finally {
        submitBtn.disabled = false;
        btnSpinner.style.display = 'none';
        btnText.textContent = 'Enviar Respuestas a Google Sheets';
      }
    });

    function resetForm() {
      form.reset();
      document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('selected'));
      alertSuccess.style.display = 'none';
      alertError.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  </script>
</body>
</html>`;
}
