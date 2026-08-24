
/**
 * StylishQR — Firebase Configuration
 * Inicialización de Firebase App y Firestore Database.
 * Reutiliza el proyecto Firebase de PAES Challenge.
 */

const firebaseConfig = {
    apiKey: "AIzaSyDr9sbQXbQOG7lHlvQTUnv4oynD7a--FqA",
    authDomain: "paeschallenge-8c275.firebaseapp.com",
    databaseURL: "https://paeschallenge-8c275-default-rtdb.firebaseio.com",
    projectId: "paeschallenge-8c275",
    storageBucket: "paeschallenge-8c275.firebasestorage.app",
    messagingSenderId: "889709211628",
    appId: "1:889709211628:web:ee81c3f79ed4ae0ada5ac9",
    measurementId: "G-ZCP4Y11HQX"
};

let db = null;
let isFirebaseInitialized = false;

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        db = firebase.firestore();

        // Persistencia offline para que la PWA funcione sin conexión después del primer acceso
        db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Persistencia Firestore: Múltiples pestañas abiertas.');
            } else if (err.code === 'unimplemented') {
                console.warn('Persistencia Firestore no soportada en este navegador.');
            }
        });

        isFirebaseInitialized = true;
        console.log('🔥 Firebase inicializado correctamente en StylishQR');
    } else {
        console.warn('⚠️ SDK de Firebase no detectado. StylishQR no podrá validar tokens.');
    }
} catch (error) {
    console.error('⚠️ Error al inicializar Firebase:', error);
}
