
/**
 * StylishQR — Firebase Configuration
 * Proyecto: appsabiondo
 * Incluye Firestore y Firebase Auth con Google.
 */

const firebaseConfig = {
    apiKey: "AIzaSyA58yXgwhOICep8s4wpW6xs8xoAqhf2r_E",
    authDomain: "appsabiondo.firebaseapp.com",
    databaseURL: "https://appsabiondo-default-rtdb.firebaseio.com",
    projectId: "appsabiondo",
    storageBucket: "appsabiondo.firebasestorage.app",
    messagingSenderId: "1052988519920",
    appId: "1:1052988519920:web:57dc0dba8298f660c11935",
    measurementId: "G-PHYCV61C96"
};

window.db = null;
window.auth = null;
window.isFirebaseInitialized = false;

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        window.db = firebase.firestore();
        window.auth = firebase.auth();
        window.isFirebaseInitialized = true;

        console.log('🔥 Firebase inicializado correctamente en StylishQR');
    } else {
        console.warn('⚠️ SDK de Firebase no detectado. StylishQR no podrá autenticar usuarios.');
    }
} catch (error) {
    console.error('⚠️ Error al inicializar Firebase:', error);
}
