
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

window.db = null;
window.isFirebaseInitialized = false;

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        window.db = firebase.firestore();
        window.isFirebaseInitialized = true;

        console.log('🔥 Firebase inicializado correctamente en StylishQR');
    } else {
        console.warn('⚠️ SDK de Firebase no detectado. StylishQR no podrá validar tokens.');
    }
} catch (error) {
    console.error('⚠️ Error al inicializar Firebase:', error);
}
