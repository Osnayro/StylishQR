


/**
 * StylishQR — Administración
 * Gestión de usuarios autorizados y PIN maestro desde Firestore.
 */

let estaAutenticado = false;

const elementos = {};

document.addEventListener('DOMContentLoaded', () => {
    referenciarElementos();
    configurarEventos();

    // Habilitar botón de login cuando admin.js esté listo
    if (elementos.btnLogin) elementos.btnLogin.disabled = false;
});

function referenciarElementos() {
    elementos.pinInput = document.getElementById('admin-pin');
    elementos.btnLogin = document.getElementById('btn-admin-login');
    elementos.loginError = document.getElementById('admin-login-error');
    elementos.loginSection = document.getElementById('admin-login-section');
    elementos.panel = document.getElementById('admin-panel');

    elementos.userEmailInput = document.getElementById('user-email');
    elementos.btnAddUser = document.getElementById('btn-add-user');
    elementos.userError = document.getElementById('admin-user-error');
    elementos.usersList = document.getElementById('users-list');
    elementos.btnRefreshUsers = document.getElementById('btn-refresh-users');

    elementos.newPinInput = document.getElementById('new-pin');
    elementos.btnChangePin = document.getElementById('btn-change-pin');
}

function configurarEventos() {
    elementos.btnLogin.addEventListener('click', verificarPin);
    elementos.pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            verificarPin();
        }
    });

    elementos.btnAddUser.addEventListener('click', agregarUsuario);
    elementos.userEmailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarUsuario();
        }
    });

    elementos.btnRefreshUsers.addEventListener('click', cargarUsuarios);
    elementos.btnChangePin.addEventListener('click', cambiarPin);
}

// ==================== AUTENTICACIÓN ADMIN ====================
async function verificarPin() {
    const pin = elementos.pinInput.value.trim();

    if (!pin) {
        mostrarErrorLogin('Ingresa el PIN de administrador.');
        return;
    }

    if (!window.db) {
        mostrarErrorLogin('Base de datos no disponible.');
        return;
    }

    try {
        const pinRef = window.db.collection('config').doc('admin');
        const doc = await pinRef.get();

        if (!doc.exists) {
            // Primer inicio: permitir PIN temporal "admin123" y crearlo
            if (pin === 'admin123') {
                await pinRef.set({
                    pin: 'admin123',
                    actualizado: firebase.firestore.FieldValue.serverTimestamp()
                });
                permitirAcceso();
                return;
            } else {
                mostrarErrorLogin('PIN incorrecto.');
                return;
            }
        }

        const data = doc.data();
        if (data.pin === pin) {
            permitirAcceso();
        } else {
            mostrarErrorLogin('PIN incorrecto.');
        }
    } catch (error) {
        console.error('Error verificando PIN:', error);
        mostrarErrorLogin('No se pudo verificar el PIN.');
    }
}

function permitirAcceso() {
    estaAutenticado = true;
    elementos.loginSection.style.display = 'none';
    elementos.panel.style.display = 'block';
    elementos.pinInput.value = '';
    cargarUsuarios();
}

function mostrarErrorLogin(mensaje) {
    elementos.loginError.textContent = mensaje;
}

// ==================== GESTIÓN DE USUARIOS ====================
async function agregarUsuario() {
    const email = elementos.userEmailInput.value.trim().toLowerCase();

    if (!email || !email.includes('@')) {
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
                const estado = data.activo === true ? '✅ Activo' : '❌ Inactivo';
                html += `
                    <li>
                        <span>${data.email || doc.id}</span>
                        <span>${estado}</span>
                        <button type="button" data-id="${doc.id}" data-activo="${data.activo === true}" class="btn-toggle-user">
                            ${data.activo === true ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" data-id="${doc.id}" class="btn-delete-user">Eliminar</button>
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

// ==================== CAMBIAR PIN ====================
async function cambiarPin() {
    const nuevoPin = elementos.newPinInput.value.trim();

    if (!nuevoPin || nuevoPin.length < 4) {
        alert('El PIN debe tener al menos 4 caracteres.');
        return;
    }

    if (!window.db) {
        alert('Base de datos no disponible.');
        return;
    }

    try {
        await window.db.collection('config').doc('admin').set({
            pin: nuevoPin,
            actualizado: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        elementos.newPinInput.value = '';
        alert('PIN actualizado correctamente.');
    } catch (error) {
        console.error('Error cambiando PIN:', error);
        alert('No se pudo actualizar el PIN.');
    }
}
