
:root {
    --azul-oscuro: #1E3A63;
    --azul-primario: #2563EB;
    --azul-claro: #DBEAFE;
    --morado: #8B5CF6;
    --morado-oscuro: #6D28D9;
    --verde: #10B981;
    --verde-oscuro: #059669;
    --rojo: #EF4444;
    --amarillo: #F59E0B;
    --gris-claro: #F8FAFC;
    --gris-borde: #CBD5E1;
    --gris-texto: #1E293B;
    --texto-secundario: #64748B;
    --blanco: #FFFFFF;
    --sombra-suave: 0 10px 25px rgba(0,0,0,0.06);
    --sombra-tarjeta: 0 20px 50px rgba(0,0,0,0.12);
    --radio-tarjeta: 20px;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-tap-highlight-color: transparent;
}

:focus-visible {
    outline: 3px solid var(--azul-primario);
    outline-offset: 2px;
    border-radius: 8px;
}

body {
    background: linear-gradient(135deg, #E8F1F5 0%, #F5F3FF 100%);
    min-height: 100vh;
    padding: 20px;
    color: var(--gris-texto);
    overflow-x: hidden;
}

/* ============================================================
   PANTALLA DE ACTIVACIÓN
   ============================================================ */
.fullscreen-overlay {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #1E3A63 0%, #3B2F63 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
    animation: fadeIn 0.4s ease-out;
}

.activation-card {
    background: var(--blanco);
    width: 100%;
    max-width: 420px;
    border-radius: 28px;
    padding: 32px 26px;
    text-align: center;
    box-shadow: var(--sombra-tarjeta);
    animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
}

.activation-logo {
    width: 90px;
    height: 90px;
    object-fit: contain;
    margin-bottom: 10px;
    border-radius: 20px;
    background: #F5F3FF;
    padding: 8px;
    box-shadow: 0 4px 14px rgba(139,92,246,0.2);
}

.activation-title {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--azul-oscuro);
    margin-bottom: 6px;
}

.activation-subtitle {
    font-size: 0.95rem;
    color: var(--texto-secundario);
    margin-bottom: 24px;
    line-height: 1.4;
}

.activation-input-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
}

.activation-label {
    font-weight: 700;
    font-size: 0.85rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.token-input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 14px;
    border: 2px solid var(--gris-borde);
    font-size: 1rem;
    font-weight: 600;
    transition: border-color 0.2s ease;
    background: var(--gris-claro);
}

.token-input:focus {
    border-color: var(--morado);
    background: var(--blanco);
    box-shadow: 0 0 0 4px rgba(139,92,246,0.15);
}

.token-error {
    min-height: 24px;
    margin-top: 10px;
    color: var(--rojo);
    font-weight: 600;
    font-size: 0.85rem;
}

.activation-note {
    font-size: 0.78rem;
    color: var(--texto-secundario);
    margin-top: 20px;
}

/* ============================================================
   APP PRINCIPAL
   ============================================================ */
.app-container {
    max-width: 1100px;
    margin: 0 auto;
    background: var(--blanco);
    border-radius: var(--radio-tarjeta);
    box-shadow: var(--sombra-suave);
    padding: 24px;
    animation: fadeIn 0.5s ease-out;
}

.app-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid #E2E8F0;
    margin-bottom: 20px;
}

.header-logo {
    width: 55px;
    height: 55px;
    object-fit: contain;
    border-radius: 14px;
    background: #F5F3FF;
    padding: 5px;
}

.header-info h1 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--azul-oscuro);
}

.header-info p {
    font-size: 0.85rem;
    color: var(--texto-secundario);
}

.header-logout {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 12px;
    transition: background 0.2s ease;
}

.header-logout:hover {
    background: #FEE2E2;
}

.main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 30px;
}

/* ============================================================
   PANEL DE FORMULARIO Y PESTAÑAS
   ============================================================ */
.form-panel,
.preview-panel {
    background: var(--gris-claro);
    border-radius: 18px;
    padding: 20px;
    border: 1px solid #E2E8F0;
}

.tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
}

.tab-btn {
    background: var(--blanco);
    border: 2px solid var(--gris-borde);
    border-radius: 20px;
    padding: 8px 14px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--texto-secundario);
}

.tab-btn:hover {
    border-color: var(--morado);
    color: var(--morado);
}

.tab-btn.active {
    background: var(--morado);
    border-color: var(--morado);
    color: var(--blanco);
}

.form-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #475569;
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 12px 14px;
    border-radius: 12px;
    border: 2px solid var(--gris-borde);
    font-size: 0.95rem;
    font-family: inherit;
    transition: border-color 0.2s ease;
    background: var(--blanco);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    border-color: var(--azul-primario);
    box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
}

textarea {
    resize: vertical;
    min-height: 70px;
}

/* ============================================================
   PANEL DE PERSONALIZACIÓN Y VISTA PREVIA
   ============================================================ */
.preview-panel h2 {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--azul-oscuro);
    margin-bottom: 16px;
}

.customization-group {
    margin-bottom: 14px;
}

.customization-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    color: #475569;
    margin-bottom: 6px;
}

.customization-group input[type="color"] {
    width: 60px;
    height: 40px;
    border: 2px solid var(--gris-borde);
    border-radius: 10px;
    padding: 2px;
    cursor: pointer;
}

.customization-group input[type="range"] {
    width: 100%;
    cursor: pointer;
}

.customization-group select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    border: 2px solid var(--gris-borde);
    background: var(--blanco);
    font-family: inherit;
    font-size: 0.9rem;
}

.qr-preview {
    margin: 20px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 240px;
    background: var(--blanco);
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    padding: 16px;
}

.qr-preview canvas,
.qr-preview img {
    max-width: 240px;
    max-height: 240px;
}

/* ============================================================
   BOTONES
   ============================================================ */
.main-btn {
    width: 100%;
    padding: 14px 20px;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--azul-primario), var(--azul-oscuro));
    color: var(--blanco);
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(37,99,235,0.25);
    transition: all 0.3s ease;
    min-height: 48px;
}

.main-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(37,99,235,0.35);
}

.main-btn:active {
    transform: scale(0.97);
}

.main-btn:disabled {
    background: #94A3B8;
    cursor: not-allowed;
    box-shadow: none;
}

.secondary-btn {
    width: 100%;
    margin-top: 8px;
    padding: 12px 18px;
    border: 2px solid var(--gris-borde);
    border-radius: 14px;
    background: var(--blanco);
    color: var(--gris-texto);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.secondary-btn:hover {
    border-color: var(--azul-primario);
    color: var(--azul-primario);
}

/* ============================================================
   SECCIÓN ADMINISTRADOR
   ============================================================ */
#admin-section {
    background: #F5F3FF;
    border-radius: 18px;
    padding: 20px;
    margin-top: 24px;
    border: 1px solid #C4B5FD;
}

#admin-section h2 {
    font-size: 1.1rem;
    color: var(--morado-oscuro);
    margin-bottom: 14px;
}

.admin-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 320px;
}

.admin-form label {
    font-weight: 700;
    font-size: 0.85rem;
    color: #475569;
}

.admin-form input {
    padding: 12px 14px;
    border-radius: 12px;
    border: 2px solid var(--gris-borde);
    font-size: 1rem;
}

.admin-link {
    background: none;
    border: none;
    color: var(--morado);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 16px;
}

.token-result {
    margin-top: 16px;
    background: var(--blanco);
    border-radius: 14px;
    padding: 16px;
    font-weight: 700;
    text-align: center;
    border: 1px solid #E2E8F0;
    word-break: break-all;
}

.token-qr {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.app-footer {
    text-align: center;
    font-size: 0.8rem;
    color: var(--texto-secundario);
    margin-top: 20px;
}

/* ============================================================
   ANIMACIONES
   ============================================================ */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes popIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
    body {
        padding: 10px;
    }

    .app-container {
        padding: 16px;
    }

    .main-content {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .header-info h1 {
        font-size: 1.2rem;
    }

    .tabs {
        gap: 6px;
    }

    .tab-btn {
        padding: 6px 10px;
        font-size: 0.75rem;
    }

    .qr-preview canvas,
    .qr-preview img {
        max-width: 200px;
        max-height: 200px;
    }
}
