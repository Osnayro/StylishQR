
/**
 * StylishQR — Administración de Tokens
 * Permite generar tokens de activación y mostrarlos como QR.
 */

const ADMIN_PIN = 'admin123'; // Cambia este PIN antes de producción

const elementos = {
    pinInput: document.getElementById('admin-pin'),
    btnLogin: document.getElementById('btn-admin-login'),
    panel: document.getElementById('admin-panel'),
    btnGenerar: document.getElementById('btn-generate-token'),
    tokenResult: document.getElementById('token-result'),
    tokenQr: document.getElementById('token-qr')
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    configurarEventos();

    // Habilitar botón de login solo cuando admin.js esté listo
    elementos.btnLogin.disabled = false;
});

// ==================== EVENTOS ====================
function configurarEventos() {
    elementos.btnLogin.addEventListener('click', verificarPin);
    elementos.pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            verificarPin();
        }
    });

    elementos.btnGenerar.addEventListener('click', generarToken);
}

// ==================== VERIFICAR PIN ====================
function verificarPin() {
    const pin = elementos.pinInput.value.trim();

    if (pin === ADMIN_PIN) {
        elementos.panel.style.display = 'block';
        elementos.pinInput.value = '';
        elementos.pinInput.blur();
    } else {
        alert('PIN de administrador incorrecto.');
    }
}

// ==================== GENERACIÓN DE TOKEN ====================
async function generarToken() {
    if (typeof db === 'undefined' || !db) {
        alert('Base de datos no disponible.');
        return;
    }

    elementos.btnGenerar.disabled = true;
    elementos.btnGenerar.textContent = 'Generando...';

    const token = generarTokenAleatorio(16);
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 5); // Expira en 5 minutos

    try {
        await db.collection('tokens').add({
            token: token,
            activo: true,
            usado: false,
            expiresAt: firebase.firestore.Timestamp.fromDate(expiracion),
            creado: firebase.firestore.FieldValue.serverTimestamp()
        });

        mostrarToken(token);
    } catch (error) {
        console.error('Error generando token:', error);
        alert('No se pudo generar el token. Revisa las reglas de Firestore.');
    } finally {
        elementos.btnGenerar.disabled = false;
        elementos.btnGenerar.textContent = 'Generar token';
    }
}

// ==================== MOSTRAR TOKEN ====================
function mostrarToken(token) {
    elementos.tokenResult.textContent = token;

    elementos.tokenQr.innerHTML = '';

    const qrToken = new QRCodeStyling({
        width: 200,
        height: 200,
        type: 'canvas',
        data: token,
        margin: 10,
        dotsOptions: {
            type: 'rounded',
            color: '#6D28D9'
        },
        backgroundOptions: {
            color: '#FFFFFF'
        }
    });

    qrToken.append(elementos.tokenQr);
}

// ==================== UTILIDADES ====================
function generarTokenAleatorio(longitud) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
        resultado += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultado;
}
