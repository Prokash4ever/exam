// ==================== FIREBASE CONFIGURATION ====================

// IMPORTANT: Replace with your Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyC5hrI06t9N-K4GAlLxGc6pjb0-JyNC9c8",
    authDomain: "myquizapp-7c5ac.firebaseapp.com",
    projectId: "myquizapp-7c5ac",
    storageBucket: "myquizapp-7c5ac.firebasestorage.app",
    messagingSenderId: "685862319630",
    appId: "1:685862319630:web:2997eda6844b3bf9d6ee5f"
};

// Firebase initialization
let firebaseApp;
let firestore;
let auth;

async function initFirebase() {
    try {
        // Check if Firebase is already initialized
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }
        
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firestore = firebase.firestore();
        auth = firebase.auth();
        
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// Firebase Services
const FirebaseService = {
    // Collections
    collections: {
        exams: 'exams',
        results: 'results',
        categories: 'categories',
        users: 'users',
        settings: 'settings'
    },
    
    // Initialize
    async init() {
        const success = await initFirebase();
        if (!success) {
            console.warn('Firebase not available, using localStorage');
            this.useLocalStorage = true;
        }
        return success;
    },
    
    // Check if Firebase is available
    isAvailable() {
        return !this.useLocalStorage && firestore !== undefined;
    },
    
    // ========== EXAM OPERATIONS ==========
    async getExams() {
        if (!this.isAvailable()) {
            return Storage.exams.getAll();
        }
        
        try {
            const snapshot = await firestore.collection(this.collections.exams).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting exams:', error);
            return Storage.exams.getAll();
        }
    },
    
    async saveExam(examData) {
        if (!this.isAvailable()) {
            return Storage.exams.save(examData);
        }
        
        try {
            if (examData.id) {
                await firestore.collection(this.collections.exams)
                    .doc(examData.id)
                    .set(examData, { merge: true });
                return examData;
            } else {
                const docRef = await firestore.collection(this.collections.exams).add(examData);
                return { id: docRef.id, ...examData };
            }
        } catch (error) {
            console.error('Error saving exam:', error);
            return Storage.exams.save(examData);
        }
    },
    
    async deleteExam(examId) {
        if (!this.isAvailable()) {
            return Storage.exams.delete(examId);
        }
        
        try {
            await firestore.collection(this.collections.exams).doc(examId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting exam:', error);
            return Storage.exams.delete(examId);
        }
    },
    
    // ========== RESULT OPERATIONS ==========
    async saveResult(resultData) {
        if (!this.isAvailable()) {
            return Storage.results.save(resultData);
        }
        
        try {
            const docRef = await firestore.collection(this.collections.results).add({
                ...resultData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...resultData };
        } catch (error) {
            console.error('Error saving result:', error);
            return Storage.results.save(resultData);
        }
    },
    
    async getResults(examId = null) {
        if (!this.isAvailable()) {
            const results = Storage.results.getAll();
            if (examId) {
                return results.filter(r => r.examId === examId);
            }
            return results;
        }
        
        try {
            let query = firestore.collection(this.collections.results);
            
            if (examId) {
                query = query.where('examId', '==', examId);
            }
            
            const snapshot = await query.orderBy('timestamp', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting results:', error);
            return Storage.results.getAll();
        }
    },
    
    // ========== CATEGORY OPERATIONS ==========
    async getCategories() {
        if (!this.isAvailable()) {
            return Storage.categories.getAll();
        }
        
        try {
            const snapshot = await firestore.collection(this.collections.categories).get();
            const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // If no categories in Firebase, use defaults
            if (categories.length === 0) {
                return Storage.categories.getAll();
            }
            
            return categories;
        } catch (error) {
            console.error('Error getting categories:', error);
            return Storage.categories.getAll();
        }
    },
    
    async saveCategory(categoryData) {
        if (!this.isAvailable()) {
            return Storage.categories.save(categoryData);
        }
        
        try {
            if (categoryData.id && !categoryData.id.startsWith('cat_')) {
                await firestore.collection(this.collections.categories)
                    .doc(categoryData.id)
                    .set(categoryData, { merge: true });
                return categoryData;
            } else {
                const docRef = await firestore.collection(this.collections.categories).add(categoryData);
                return { id: docRef.id, ...categoryData };
            }
        } catch (error) {
            console.error('Error saving category:', error);
            return Storage.categories.save(categoryData);
        }
    },
    
    // ========== SETTINGS OPERATIONS ==========
    async getSettings() {
        if (!this.isAvailable()) {
            return Storage.preferences.get();
        }
        
        try {
            const doc = await firestore.collection(this.collections.settings).doc('app').get();
            if (doc.exists) {
                return doc.data();
            }
            return Storage.preferences.get();
        } catch (error) {
            console.error('Error getting settings:', error);
            return Storage.preferences.get();
        }
    },
    
    async saveSettings(settings) {
        if (!this.isAvailable()) {
            return Storage.preferences.update(settings);
        }
        
        try {
            await firestore.collection(this.collections.settings)
                .doc('app')
                .set(settings, { merge: true });
            return settings;
        } catch (error) {
            console.error('Error saving settings:', error);
            return Storage.preferences.update(settings);
        }
    },
    
    // ========== SYNC OPERATIONS ==========
    async syncLocalToFirebase() {
        if (!this.isAvailable()) {
            console.warn('Firebase not available for sync');
            return false;
        }
        
        try {
            // Sync exams
            const localExams = Storage.exams.getAll();
            for (const exam of localExams) {
                await this.saveExam(exam);
            }
            
            // Sync results
            const localResults = Storage.results.getAll();
            for (const result of localResults) {
                await this.saveResult(result);
            }
            
            // Sync categories
            const localCategories = Storage.categories.getAll();
            for (const category of localCategories) {
                await this.saveCategory(category);
            }
            
            console.log('Sync completed successfully');
            return true;
        } catch (error) {
            console.error('Sync error:', error);
            return false;
        }
    },
    
    // ========== REAL-TIME LISTENERS ==========
    setupExamListener(callback) {
        if (!this.isAvailable()) return null;
        
        return firestore.collection(this.collections.exams)
            .onSnapshot((snapshot) => {
                const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(exams);
            }, (error) => {
                console.error('Exam listener error:', error);
            });
    },
    
    setupResultsListener(callback) {
        if (!this.isAvailable()) return null;
        
        return firestore.collection(this.collections.results)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(results);
            }, (error) => {
                console.error('Results listener error:', error);
            });
    }
};

// Initialize Firebase on load
document.addEventListener('DOMContentLoaded', async () => {
    await FirebaseService.init();
});

// Export to window
window.FirebaseService = FirebaseService;
window.firebaseConfig = firebaseConfig;