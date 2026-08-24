
/**
 * StylishQR — Administración
 * Gestión de usuarios autorizados desde Firestore.
 *
 * IMPORTANTE: el acceso ahora se controla con el mismo inicio de sesión con
 * Google que usa la app principal, verificando el correo contra la
 * colección "admins" en Firestore (campo activo === true), en vez de un PIN
 * comparado en el navegador. Un PIN revisado en JavaScript nunca es
 * seguridad real: cualquiera puede leerlo desde el código fuente o llamar
 * a las funciones de Firestore directamente desde la consola del
 * navegador. La única protección real vive en las Reglas de Seguridad de
 * Firestore (ver firestore.rules incluido junto a estos archivos): sin
 * reglas que exijan pertenecer a "admins", esta pantalla es solo una
 * cortina, no una cerradura.
 */

let adminActual = null;

const elementos = {};

document.addEventListener('DOMContentLoaded', () => {
    referenciarElementos();
    configurarEventos();
    verificarSesionAdmin();
});

function referenciarElementos() {
    elementos.loginSection = document.getElementById('admin-login-section');
    elementos.googleLoginBtn = document.getElementById('admin-google-login-btn');
    elementos.loginError = document.getElementById('admin-login-error');
    elementos.panel = document.getElementById('admin-panel');
    elementos.btnLogoutAdmin = document.getElementById('btn-admin-logout');
    elementos.adminEmailLabel = document.getElementById('admin-email-label');

    elementos.userEmailInput = document.getElementById('user-email');
    elementos.btnAddUser = document.getElementById('btn-add-user');
    elementos.userError = document.getElementById('admin-user-error');
    elementos.usersList = document.getElementById('users-list');
    elementos.btnRefreshUsers = document.getElementById('btn-refresh-users');
}

function configurarEventos() {
    elementos.googleLoginBtn.addEventListener('click', iniciarSesionAdmin);
    elementos.btnLogoutAdmin.addEventListener('click', cerrarSesionAdmin);

    elementos.btnAddUser.addEventListener('click', agregarUsuario);
    elementos.userEmailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarUsuario();
        }
    });

    elementos.btnRefreshUsers.addEventListener('click', cargarUsuarios);
}

// ==================== AUTENTICACIÓN ADMIN ====================
function verificarSesionAdmin() {
    mostrarPanel(false);

    window.auth?.onAuthStateChanged((user) => {
        if (user) {
            verificarEsAdmin(user);
        } else {
            adminActual = null;
            mostrarPanel(false);
        }
    });
}

async function iniciarSesionAdmin() {
    if (!window.auth) {
        mostrarErrorLogin('Firebase Auth no está disponible.');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const resultado = await window.auth.signInWithPopup(provider);
        await verificarEsAdmin(resultado.user);
    } catch (error) {
        console.error('Error en autenticación de administrador:', error);
        mostrarErrorLogin('No se pudo completar el inicio de sesión.');
    }
}

async function verificarEsAdmin(user) {
    if (!window.db) {
        mostrarErrorLogin('Base de datos no disponible.');
        return;
    }

    try {
        const email = user.email.toLowerCase();
        const docRef = window.db.collection('admins').doc(email);
        const doc = await docRef.get();

        if (doc.exists && doc.data().activo === true) {
            adminActual = user;
            mostrarErrorLogin('');
            mostrarPanel(true);
            cargarUsuarios();
        } else {
            await window.auth.signOut();
            mostrarPanel(false);
            mostrarErrorLogin('Tu cuenta no tiene permisos de administrador.');
        }
    } catch (error) {
        console.error('Error verificando permisos de administrador:', error);
        mostrarErrorLogin('No se pudo verificar tu acceso.');
    }
}

async function cerrarSesionAdmin() {
    if (window.auth) {
        await window.auth.signOut();
    }
    adminActual = null;
    mostrarPanel(false);
}

function mostrarPanel(mostrar) {
    if (mostrar && adminActual) {
        elementos.loginSection.style.display = 'none';
        elementos.panel.style.display = 'block';
        if (elementos.adminEmailLabel) {
            elementos.adminEmailLabel.textContent = adminActual.email;
        }
    } else {
        elementos.loginSection.style.display = 'block';
        elementos.panel.style.display = 'none';
    }
}

function mostrarErrorLogin(mensaje) {
    elementos.loginError.textContent = mensaje;
}

// ==================== UTILIDAD: ESCAPE DE HTML ====================
// Evita que un valor almacenado en Firestore (email o id de documento) se
// interprete como HTML/JS al insertarlo con innerHTML.
function escaparHTML(valor) {
    const div = document.createElement('div');
    div.textContent = String(valor ?? '');
    return div.innerHTML;
}

// ==================== GESTIÓN DE USUARIOS ====================
async function agregarUsuario() {
    const email = elementos.userEmailInput.value.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarErrorUsuario('Ingresa un correo válido.');
        return;
    }

    if (!window.db) {
        mostrarErrorUsuario('Base de datos no disponible.');
        return;
    }

    try {
        await window.db.collection('usuarios').doc(email).set({
            email: email,
            activo: true,
            creado: firebase.firestore.FieldValue.serverTimestamp()
        });

        elementos.userEmailInput.value = '';
        mostrarErrorUsuario('');
        cargarUsuarios();
    } catch (error) {
        console.error('Error agregando usuario:', error);
        mostrarErrorUsuario('No se pudo agregar el usuario.');
    }
}

function mostrarErrorUsuario(mensaje) {
    elementos.userError.textContent = mensaje;
}

async function cargarUsuarios() {
    if (!window.db) return;

    try {
        const snapshot = await window.db.collection('usuarios').orderBy('email').get();

        let html = '<h3>Lista de usuarios</h3>';
        if (snapshot.empty) {
            html += '<p>No hay usuarios autorizados.</p>';
        } else {
            html += '<ul class="admin-user-list">';
            snapshot.forEach(doc => {
                const data = doc.data();
                const activo = data.activo === true;
                const estado = activo ? '✅ Activo' : '❌ Inactivo';
                const emailSeguro = escaparHTML(data.email || doc.id);
                const idSeguro = escaparHTML(doc.id);
                html += `
                    <li>
                        <span>${emailSeguro}</span>
                        <span>${estado}</span>
                        <button type="button" data-id="${idSeguro}" data-activo="${activo}" class="btn-toggle-user">
                            ${activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" data-id="${idSeguro}" class="btn-delete-user">Eliminar</button>
                    </li>
                `;
            });
            html += '</ul>';
        }

        elementos.usersList.innerHTML = html;

        // Eventos para botones de activar/desactivar
        elementos.usersList.querySelectorAll('.btn-toggle-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const activo = btn.dataset.activo === 'true';
                cambiarEstadoUsuario(id, !activo);
            });
        });

        // Eventos para botones eliminar
        elementos.usersList.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                eliminarUsuario(id);
            });
        });
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        elementos.usersList.innerHTML = '<p>No se pudieron cargar los usuarios.</p>';
    }
}

async function cambiarEstadoUsuario(email, activo) {
    if (!window.db) return;

    try {
        await window.db.collection('usuarios').doc(email).update({
            activo: activo
        });
        cargarUsuarios();
    } catch (error) {
        console.error('Error cambiando estado de usuario:', error);
        alert('No se pudo actualizar el usuario.');
    }
}

async function eliminarUsuario(email) {
    if (!window.db) return;

    const confirmacion = confirm(`¿Eliminar a ${email}?`);
    if (!confirmacion) return;

    try {
        await window.db.collection('usuarios').doc(email).delete();
        cargarUsuarios();
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('No se pudo eliminar el usuario.');
    }
}
