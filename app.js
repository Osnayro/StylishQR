
/**
 * StylishQR — Generador de códigos QR con estilo
 * Lógica de activación, generación y personalización (usuarios finales)
 * Incluye estándar EMV QRCPS para Pago Móvil Venezuela
 * Soporta cédula o RIF, teléfono, banco, monto y concepto opcionales
 */

let tokenActivo = false;
let qrCode = null;
let logoDataUrl = null;

const elementos = {};

document.addEventListener('DOMContentLoaded', () => {
    referenciarElementos();

    if (localStorage.getItem('stylishqr_activated') === 'true') {
        tokenActivo = true;
        mostrarApp(true);
    } else {
        mostrarApp(false);
    }

    inicializarQR();
    configurarEventos();
    renderizarFormulario('text');
});

function referenciarElementos() {
    elementos.activationScreen = document.getElementById('activation-screen');
    elementos.mainApp = document.getElementById('main-app');
    elementos.tokenInput = document.getElementById('token-input');
    elementos.btnActivate = document.getElementById('btn-activate-token');
    elementos.tokenError = document.getElementById('token-error');

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

async function activarConToken(token) {
    if (!firebase || !db) {
        mostrarErrorToken('Base de datos no disponible. Contacte al administrador.');
        return false;
    }

    try {
        const tokensRef = db.collection('tokens');
        const querySnapshot = await tokensRef.where('token', '==', token.trim()).limit(1).get();

        if (querySnapshot.empty) {
            mostrarErrorToken('Token inválido.');
            return false;
        }

        let tokenDoc = null;
        let tokenData = null;
        querySnapshot.forEach(doc => {
            tokenDoc = doc;
            tokenData = doc.data();
        });

        const ahora = firebase.firestore.Timestamp.now();
        const expirado = tokenData.expiresAt && tokenData.expiresAt.toMillis() < ahora.toMillis();

        if (!tokenData.activo || tokenData.usado || expirado) {
            mostrarErrorToken('Token expirado o ya utilizado.');
            return false;
        }

        await tokenDoc.ref.update({
            usado: true,
            usadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });

        localStorage.setItem('stylishqr_activated', 'true');
        tokenActivo = true;
        mostrarApp(true);
        mostrarErrorToken('');
        return true;
    } catch (error) {
        console.error('Error validando token:', error);
        mostrarErrorToken('No se pudo validar el token. Intente nuevamente.');
        return false;
    }
}

function mostrarErrorToken(mensaje) {
    elementos.tokenError.textContent = mensaje;
}

function mostrarApp(mostrar) {
    if (mostrar) {
        elementos.activationScreen.style.display = 'none';
        elementos.mainApp.style.display = 'block';
    } else {
        elementos.activationScreen.style.display = 'flex';
        elementos.mainApp.style.display = 'none';
    }
}

function cerrarSesion() {
    localStorage.removeItem('stylishqr_activated');
    tokenActivo = false;
    mostrarApp(false);
    elementos.tokenInput.value = '';
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
        opciones.image = '';
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
    const nombre = f.nombre || 'Comercio';
    const tipoDoc = f.tipoDoc || 'V';
    const numeroDoc = f.documento || '';
    const telefono = f.telefono || '';
    const banco = f.banco || 'Otro';
    const monto = f.monto || '';
    const ciudad = f.ciudad || 'Caracas';
    const concepto = f.concepto || '';
    const guid = f.guid || 've.pagomovil.generico';
    const metodo = f.metodo || '12';

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
        const montoFormateado = parseFloat(monto).toFixed(2);
        payload += construirTLV('54', montoFormateado);
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

function generarDataQR(tipo) {
    const formulario = {};
    const inputs = elementos.formContainer.querySelectorAll('[data-campo]');
    inputs.forEach(input => {
        formulario[input.dataset.campo] = input.value.trim();
    });

    switch (tipo) {
        case 'text':
            return formulario.texto || '';

        case 'url':
            return formulario.url || '';

        case 'pagomovil':
            return generarEMVPagoMovil(formulario);

        case 'wifi': {
            const ssid = formulario.ssid || '';
            const password = formulario.password || '';
            const security = formulario.security || 'WPA';
            return `WIFI:T:${security};S:${ssid};P:${password};;`;
        }

        case 'email': {
            const email = formulario.email || '';
            const asunto = formulario.asunto ? `?subject=${encodeURIComponent(formulario.asunto)}` : '';
            const cuerpo = formulario.cuerpo ? `&body=${encodeURIComponent(formulario.cuerpo)}` : '';
            return `mailto:${email}${asunto}${cuerpo}`;
        }

        case 'telefono':
            return `tel:${formulario.telefono || ''}`;

        case 'evento': {
            const titulo = formulario.titulo || 'Evento';
            const fecha = formulario.fecha || '';
            return `BEGIN:VEVENT\nSUMMARY:${titulo}\nDTSTART:${fecha}\nEND:VEVENT`;
        }

        case 'ubicacion': {
            const lat = formulario.lat || '';
            const lng = formulario.lng || '';
            const query = formulario.query || '';
            return `geo:${lat},${lng}?q=${encodeURIComponent(query)}`;
        }

        case 'vcard': {
            const nombre = formulario.nombre || '';
            const empresa = formulario.empresa || '';
            const telefono = formulario.telefono || '';
            const email = formulario.email || '';
            return `BEGIN:VCARD\nVERSION:3.0\nN:${nombre}\nORG:${empresa}\nTEL:${telefono}\nEMAIL:${email}\nEND:VCARD`;
        }

        case 'token':
            return formulario.token || '';

        default:
            return '';
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
                <div class="form-group"><label>Número de documento (Cédula/RIF)</label><input type="text" data-campo="documento" placeholder="12345678"></div>
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
                <div class="form-group"><label>Monto (opcional)</label><input type="number" step="0.01" data-campo="monto" placeholder="0.00"></div>
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
                <div class="form-group"><label>Latitud</label><input type="text" data-campo="lat" placeholder="10.4806"></div>
                <div class="form-group"><label>Longitud</label><input type="text" data-campo="lng" placeholder="-66.9036"></div>
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

        case 'token':
            html = `<div class="form-group"><label>Token de acceso</label><input type="text" data-campo="token" placeholder="Token"></div>`;
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
    elementos.btnActivate.addEventListener('click', async () => {
        const token = elementos.tokenInput.value.trim();
        if (!token) {
            mostrarErrorToken('Ingresa un token válido.');
            return;
        }
        await activarConToken(token);
    });

    elementos.tokenInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const token = elementos.tokenInput.value.trim();
            if (token) await activarConToken(token);
        }
    });

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
        const reader = new FileReader();
        reader.onload = (ev) => {
            logoDataUrl = ev.target.result;
            actualizarQRDesdeFormulario();
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

    elementos.btnLogout.addEventListener('click', cerrarSesion);
}
