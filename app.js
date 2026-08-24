
/**
 * StylishQR — Generador de códigos QR con estilo
 * Autenticación con Google + lista blanca de usuarios autorizados
 * Incluye estándar EMV QRCPS para Pago Móvil Venezuela
 */

let usuarioActual = null;
let qrCode = null;
let logoDataUrl = null;

const elementos = {};

document.addEventListener('DOMContentLoaded', () => {
    referenciarElementos();
    inicializarQR();
    configurarEventos();
    verificarSesion();
});

function referenciarElementos() {
    elementos.authScreen = document.getElementById('auth-screen');
    elementos.mainApp = document.getElementById('main-app');
    elementos.googleLoginBtn = document.getElementById('google-login-btn');
    elementos.authError = document.getElementById('auth-error');

    elementos.tabs = document.querySelectorAll('.tab-btn');
    elementos.formContainer = document.getElementById('form-container');
    elementos.qrColor = document.getElementById('qr-color');
    elementos.bgColor = document.getElementById('bg-color');
    elementos.logoUpload = document.getElementById('logo-upload');
    elementos.btnRemoveLogo = document.getElementById('btn-remove-logo');
    elementos.logoSize = document.getElementById('logo-size');
    elementos.logoSizeValue = document.getElementById('logo-size-value');
    elementos.qrShape = document.getElementById('qr-shape');
    elementos.qrPreview = document.getElementById('qr-preview');
    elementos.btnDownload = document.getElementById('btn-download');
    elementos.btnShare = document.getElementById('btn-share');
    elementos.btnLogout = document.getElementById('btn-logout');
}

function mostrarAuth(mostrar) {
    if (mostrar) {
        elementos.authScreen.style.display = 'flex';
        elementos.mainApp.style.display = 'none';
    } else {
        elementos.authScreen.style.display = 'none';
        // 'flex' (no 'block'): el tema glass/neón usa display:flex en
        // .app-container para anclar el footer abajo con margin-top:auto.
        elementos.mainApp.style.display = 'flex';
    }
}

function mostrarErrorAuth(mensaje) {
    elementos.authError.textContent = mensaje;
}

function verificarSesion() {
    // onAuthStateChanged siempre se dispara al cargar (con el usuario o con
    // null), así que es la única fuente de verdad; evitamos duplicar lógica
    // consultando window.auth.currentUser antes de que Firebase resuelva el
    // estado (esa comprobación casi siempre sería prematura).
    mostrarAuth(true);

    window.auth?.onAuthStateChanged((user) => {
        if (user) {
            verificarAutorizacion(user);
        } else {
            usuarioActual = null;
            mostrarAuth(true);
        }
    });
}

async function iniciarSesionGoogle() {
    if (!window.auth) {
        mostrarErrorAuth('Firebase Auth no está disponible.');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        // signInWithPopup falla con frecuencia en Safari iOS y en
        // navegadores "in-app" (Instagram, Facebook, etc.). Si el popup no
        // puede abrirse, recurrimos a signInWithRedirect como respaldo.
        const resultado = await window.auth.signInWithPopup(provider);
        await verificarAutorizacion(resultado.user);
    } catch (error) {
        const erroresDePopup = [
            'auth/popup-blocked',
            'auth/popup-closed-by-user',
            'auth/cancelled-popup-request',
            'auth/operation-not-supported-in-this-environment'
        ];
        if (erroresDePopup.includes(error.code)) {
            try {
                await window.auth.signInWithRedirect(provider);
                return; // La página se recargará tras el redirect.
            } catch (errorRedirect) {
                console.error('Error en autenticación con Google (redirect):', errorRedirect);
                mostrarErrorAuth('No se pudo completar el inicio de sesión.');
                return;
            }
        }
        console.error('Error en autenticación con Google:', error);
        mostrarErrorAuth('No se pudo completar el inicio de sesión.');
    }
}

async function verificarAutorizacion(user) {
    if (!window.db) {
        mostrarErrorAuth('Base de datos no disponible.');
        return;
    }

    try {
        const docRef = window.db.collection('usuarios').doc(user.email.toLowerCase());
        const doc = await docRef.get();

        if (doc.exists && doc.data().activo === true) {
            usuarioActual = user;
            mostrarErrorAuth('');
            mostrarAuth(false);
            renderizarFormulario('text');
        } else {
            await window.auth.signOut();
            mostrarAuth(true);
            mostrarErrorAuth('Tu correo no está autorizado para usar StylishQR.');
        }
    } catch (error) {
        console.error('Error verificando autorización:', error);
        mostrarErrorAuth('No se pudo verificar tu acceso.');
    }
}

async function cerrarSesion() {
    if (window.auth) {
        await window.auth.signOut();
    }
    usuarioActual = null;
    mostrarAuth(true);
}

function inicializarQR() {
    qrCode = new QRCodeStyling({
        width: 240,
        height: 240,
        type: 'canvas',
        data: 'https://sabiondobuho.netlify.app/',
        margin: 10,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: { type: 'square', color: elementos.qrColor.value },
        backgroundOptions: { color: elementos.bgColor.value },
        imageOptions: { crossOrigin: 'anonymous', margin: 8 }
    });
    qrCode.append(elementos.qrPreview);
}

function actualizarVistaPrevia(data) {
    if (!qrCode) return;

    const opciones = {
        data: data || 'https://sabiondobuho.netlify.app/',
        dotsOptions: {
            type: elementos.qrShape.value,
            color: elementos.qrColor.value
        },
        backgroundOptions: {
            color: elementos.bgColor.value
        }
    };

    if (logoDataUrl) {
        const size = parseInt(elementos.logoSize.value, 10) / 100;
        opciones.image = logoDataUrl;
        opciones.imageOptions = {
            crossOrigin: 'anonymous',
            margin: 8,
            imageSize: size
        };
    } else {
        // La librería qr-code-styling no siempre limpia la imagen con una
        // cadena vacía; 'undefined' elimina realmente el logo anterior.
        opciones.image = undefined;
    }

    qrCode.update(opciones);
}

function construirTLV(id, valor) {
    const valorStr = String(valor);
    const longitud = valorStr.length.toString().padStart(2, '0');
    return id + longitud + valorStr;
}

function calcularCRC16EMV(datos) {
    let crc = 0xFFFF;
    for (let i = 0; i < datos.length; i++) {
        crc ^= datos.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generarEMVPagoMovil(f) {
    const nombre = (f.nombre || 'Comercio').trim();
    const tipoDoc = f.tipoDoc || 'V';
    // Solo dígitos: evita romper el TLV si el usuario escribe espacios,
    // guiones o puntos en la cédula/RIF o el teléfono.
    const numeroDoc = (f.documento || '').replace(/\D/g, '');
    const telefono = (f.telefono || '').replace(/\D/g, '');
    const monto = f.monto || '';
    const ciudad = (f.ciudad || 'Caracas').trim();
    const concepto = (f.concepto || '').trim();
    const guid = f.guid || 've.pagomovil.generico';
    const metodo = f.metodo || '12';

    // Documento y teléfono son obligatorios para un QR de pago móvil válido.
    if (!numeroDoc || !telefono) {
        return '';
    }

    const documentoId = `${tipoDoc}${numeroDoc}`;

    let merchantInfo = '';
    merchantInfo += construirTLV('00', guid);
    merchantInfo += construirTLV('01', documentoId);
    merchantInfo += construirTLV('02', telefono);

    let payload = '';
    payload += construirTLV('00', '01');
    payload += construirTLV('01', metodo);
    payload += construirTLV('26', merchantInfo);
    payload += construirTLV('52', '0000');
    payload += construirTLV('53', '924');
    if (monto) {
        const montoNum = parseFloat(monto);
        if (!Number.isNaN(montoNum) && montoNum > 0) {
            payload += construirTLV('54', montoNum.toFixed(2));
        }
    }
    payload += construirTLV('58', 'VE');
    payload += construirTLV('59', nombre);
    payload += construirTLV('60', ciudad);

    if (concepto) {
        let additionalData = '';
        additionalData += construirTLV('05', concepto);
        payload += construirTLV('62', additionalData);
    }

    const crc = calcularCRC16EMV(payload + construirTLV('63', ''));
    payload += construirTLV('63', crc);

    return payload;
}

// Escapa los caracteres reservados del formato WIFI: (RFC del QR de Wi-Fi):
// \  ;  ,  :  deben precederse de una barra invertida.
function escaparValorWifi(valor) {
    return String(valor).replace(/([\\;,:])/g, '\\$1');
}

// Convierte el valor de un <input type="datetime-local"> (p. ej.
// "2026-08-24T10:00") al formato DTSTART de iCalendar ("20260824T100000").
function formatearFechaICS(fechaLocal) {
    if (!fechaLocal) return '';
    const limpio = fechaLocal.replace(/[-:]/g, '');
    // "20260824T1000" -> añade segundos si faltan.
    return limpio.length === 13 ? `${limpio}00` : limpio;
}

function generarDataQR(tipo) {
    const formulario = {};
    const inputs = elementos.formContainer.querySelectorAll('[data-campo]');
    inputs.forEach(input => {
        formulario[input.dataset.campo] = input.value.trim();
    });

    switch (tipo) {
        case 'text': return formulario.texto || '';
        case 'url': return formulario.url || '';
        case 'pagomovil': return generarEMVPagoMovil(formulario);
        case 'wifi': {
            if (!formulario.ssid) return '';
            const ssid = escaparValorWifi(formulario.ssid);
            const password = escaparValorWifi(formulario.password || '');
            const security = formulario.security || 'WPA';
            return `WIFI:T:${security};S:${ssid};P:${password};;`;
        }
        case 'email': {
            const email = formulario.email || '';
            if (!email) return '';
            const asunto = formulario.asunto ? `?subject=${encodeURIComponent(formulario.asunto)}` : '';
            const cuerpo = formulario.cuerpo ? `${asunto ? '&' : '?'}body=${encodeURIComponent(formulario.cuerpo)}` : '';
            return `mailto:${email}${asunto}${cuerpo}`;
        }
        case 'telefono': return formulario.telefono ? `tel:${formulario.telefono}` : '';
        case 'evento': {
            if (!formulario.titulo && !formulario.fecha) return '';
            const titulo = formulario.titulo || 'Evento';
            const dtstart = formatearFechaICS(formulario.fecha);
            return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${titulo}\nDTSTART:${dtstart}\nEND:VEVENT\nEND:VCALENDAR`;
        }
        case 'ubicacion': {
            const lat = formulario.lat || '';
            const lng = formulario.lng || '';
            const query = formulario.query || '';
            if (!lat || !lng) return '';
            return `geo:${lat},${lng}?q=${encodeURIComponent(query || `${lat},${lng}`)}`;
        }
        case 'vcard': {
            if (!formulario.nombre && !formulario.telefono && !formulario.email) return '';
            const nombre = formulario.nombre || '';
            const empresa = formulario.empresa || '';
            const telefono = formulario.telefono || '';
            const email = formulario.email || '';
            return `BEGIN:VCARD\nVERSION:3.0\nN:${nombre}\nORG:${empresa}\nTEL:${telefono}\nEMAIL:${email}\nEND:VCARD`;
        }
        default: return '';
    }
}

function renderizarFormulario(tipo) {
    let html = '';

    switch (tipo) {
        case 'text':
            html = `<div class="form-group"><label>Texto</label><textarea data-campo="texto" placeholder="Escribe el texto..."></textarea></div>`;
            break;
        case 'url':
            html = `<div class="form-group"><label>URL</label><input type="url" data-campo="url" placeholder="https://ejemplo.com"></div>`;
            break;
        case 'pagomovil':
            html = `
                <div class="form-group"><label>Tipo de documento</label>
                    <select data-campo="tipoDoc">
                        <option value="V">Cédula (V)</option>
                        <option value="J">RIF Jurídico (J)</option>
                        <option value="G">RIF Gobierno (G)</option>
                        <option value="E">Extranjero (E)</option>
                    </select>
                </div>
                <div class="form-group"><label>Número de documento (Cédula/RIF)</label><input type="text" inputmode="numeric" data-campo="documento" placeholder="12345678"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" data-campo="telefono" placeholder="04121234567"></div>
                <div class="form-group"><label>Banco</label>
                    <select data-campo="banco">
                        <option value="">Seleccione</option>
                        <option>BDV</option>
                        <option>Banesco</option>
                        <option>Mercantil</option>
                        <option>BNC</option>
                        <option>Otro</option>
                    </select>
                </div>
                <div class="form-group"><label>Monto (opcional)</label><input type="number" step="0.01" min="0" data-campo="monto" placeholder="0.00"></div>
                <div class="form-group"><label>Concepto (opcional)</label><input type="text" data-campo="concepto" placeholder="Pago de..."></div>
                <div class="form-group"><label>Ciudad</label><input type="text" data-campo="ciudad" placeholder="Caracas"></div>
                <div class="form-group"><label>GUID del proveedor</label><input type="text" data-campo="guid" placeholder="ve.pagomovil.generico"></div>
                <div class="form-group"><label>Método de iniciación</label>
                    <select data-campo="metodo">
                        <option value="12">Dinámico</option>
                        <option value="11">Estático</option>
                    </select>
                </div>
            `;
            break;
        case 'wifi':
            html = `
                <div class="form-group"><label>Nombre de red (SSID)</label><input type="text" data-campo="ssid" placeholder="MiRedWiFi"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" data-campo="password" placeholder="ClaveWiFi"></div>
                <div class="form-group"><label>Seguridad</label><select data-campo="security"><option>WPA</option><option>WEP</option><option>nopass</option></select></div>
            `;
            break;
        case 'email':
            html = `
                <div class="form-group"><label>Correo</label><input type="email" data-campo="email" placeholder="correo@dominio.com"></div>
                <div class="form-group"><label>Asunto</label><input type="text" data-campo="asunto" placeholder="Asunto"></div>
                <div class="form-group"><label>Mensaje</label><textarea data-campo="cuerpo" placeholder="Escribe el mensaje..."></textarea></div>
            `;
            break;
        case 'telefono':
            html = `<div class="form-group"><label>Número de teléfono</label><input type="tel" data-campo="telefono" placeholder="+58 412 1234567"></div>`;
            break;
        case 'evento':
            html = `
                <div class="form-group"><label>Título del evento</label><input type="text" data-campo="titulo" placeholder="Reunión"></div>
                <div class="form-group"><label>Fecha de inicio</label><input type="datetime-local" data-campo="fecha"></div>
            `;
            break;
        case 'ubicacion':
            html = `
                <div class="form-group"><label>Latitud</label><input type="text" inputmode="decimal" data-campo="lat" placeholder="10.4806"></div>
                <div class="form-group"><label>Longitud</label><input type="text" inputmode="decimal" data-campo="lng" placeholder="-66.9036"></div>
                <div class="form-group"><label>Lugar (opcional)</label><input type="text" data-campo="query" placeholder="Caracas"></div>
            `;
            break;
        case 'vcard':
            html = `
                <div class="form-group"><label>Nombre</label><input type="text" data-campo="nombre" placeholder="Nombre y apellido"></div>
                <div class="form-group"><label>Empresa</label><input type="text" data-campo="empresa" placeholder="Empresa"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" data-campo="telefono" placeholder="+58 412 1234567"></div>
                <div class="form-group"><label>Correo</label><input type="email" data-campo="email" placeholder="correo@dominio.com"></div>
            `;
            break;
        default:
            break;
    }

    elementos.formContainer.innerHTML = html;
    elementos.formContainer.addEventListener('input', actualizarQRDesdeFormulario);
    elementos.formContainer.addEventListener('change', actualizarQRDesdeFormulario);
    actualizarQRDesdeFormulario();
}

function actualizarQRDesdeFormulario() {
    const tipoActivo = document.querySelector('.tab-btn.active')?.dataset.tab || 'text';
    const data = generarDataQR(tipoActivo);
    actualizarVistaPrevia(data);
}

function configurarEventos() {
    elementos.googleLoginBtn.addEventListener('click', iniciarSesionGoogle);
    elementos.btnLogout.addEventListener('click', cerrarSesion);

    elementos.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elementos.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderizarFormulario(tab.dataset.tab);
        });
    });

    elementos.qrColor.addEventListener('input', actualizarQRDesdeFormulario);
    elementos.bgColor.addEventListener('input', actualizarQRDesdeFormulario);
    elementos.qrShape.addEventListener('change', actualizarQRDesdeFormulario);
    elementos.logoSize.addEventListener('input', () => {
        elementos.logoSizeValue.textContent = `${elementos.logoSize.value}%`;
        actualizarQRDesdeFormulario();
    });

    elementos.logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Selecciona un archivo de imagen válido.');
            elementos.logoUpload.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            logoDataUrl = ev.target.result;
            actualizarQRDesdeFormulario();
        };
        reader.onerror = () => {
            alert('No se pudo leer la imagen del logo.');
        };
        reader.readAsDataURL(file);
    });

    elementos.btnRemoveLogo.addEventListener('click', () => {
        logoDataUrl = null;
        elementos.logoUpload.value = '';
        actualizarQRDesdeFormulario();
    });

    elementos.btnDownload.addEventListener('click', () => {
        const tipo = document.querySelector('.tab-btn.active')?.dataset.tab || 'text';
        const data = generarDataQR(tipo);
        if (!data) {
            alert('Ingresa los datos para generar el QR.');
            return;
        }
        qrCode.download({ name: 'stylishqr', extension: 'png' });
    });

    elementos.btnShare.addEventListener('click', async () => {
        const tipo = document.querySelector('.tab-btn.active')?.dataset.tab || 'text';
        const data = generarDataQR(tipo);
        if (!data) {
            alert('Ingresa los datos para generar el QR.');
            return;
        }

        try {
            const blob = await qrCode.getRawData('png');
            if (navigator.share) {
                const file = new File([blob], 'stylishqr.png', { type: 'image/png' });
                await navigator.share({ title: 'StylishQR', files: [file] });
            } else {
                alert('Compartir no está disponible en este navegador.');
            }
        } catch (error) {
            console.warn('Error al compartir:', error);
        }
    });
}
