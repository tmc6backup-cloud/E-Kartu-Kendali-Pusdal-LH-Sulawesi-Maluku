
import { dbService } from '../services/dbService.ts';

// GANTI DENGAN VAPID PUBLIC KEY ANDA DARI WEB-PUSH GENERATOR
const VAPID_PUBLIC_KEY = "BKv6hO0F_C-EOnY7_O9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9-9";

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeToNotifications = async (userId: string) => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker tidak didukung di browser ini.');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Cek izin
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Izin notifikasi ditolak oleh user.');
            return false;
        }

        // Cari subscription yang ada
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Buat subscription baru menggunakan kunci VAPID
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // Kirim subscription ke Supabase via dbService
        const success = await dbService.savePushSubscription(userId, subscription);
        return success;
    } catch (err) {
        console.error('Push Subscription Error:', err);
        return false;
    }
};

export const checkPushStatus = async (): Promise<'granted' | 'denied' | 'default'> => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
};
