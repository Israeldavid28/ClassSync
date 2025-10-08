declare const window: any;

export const getGoogleAuthToken = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window.gapi === 'undefined' || typeof window.google === 'undefined') {
        throw new Error('Google API client not loaded.');
      }

      window.gapi.load('client:auth2', () => {
        window.gapi.client.init({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          clientId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          scope: "https://www.googleapis.com/auth/calendar.events"
        }).then(() => {
          const googleAuth = window.gapi.auth2.getAuthInstance();
          if (!googleAuth.isSignedIn.get()) {
            // This part may need adjustment based on UX flow.
            // For this case, we assume user is already signed in via Firebase.
             resolve(null);
             return;
          }

          const currentUser = googleAuth.currentUser.get();
          const authResponse = currentUser.getAuthResponse(true); // true to force refresh
          resolve(authResponse.access_token);
        }).catch((error:any) => {
          console.error("GAPI client init error:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error getting Google Auth Token:", error);
      reject(error);
    }
  });
};
