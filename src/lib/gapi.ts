declare const window: any;

export const getGoogleAuthToken = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const checkGapiReady = () => {
      if (window.gapi && window.gapi.client) {
        console.log('GAPI client is ready.');
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            clientId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: "https://www.googleapis.com/auth/calendar.events"
          }).then(() => {
            const googleAuth = window.gapi.auth2.getAuthInstance();
            if (!googleAuth.isSignedIn.get()) {
               resolve(null);
               return;
            }

            const currentUser = googleAuth.currentUser.get();
            const authResponse = currentUser.getAuthResponse(true); // true to force refresh
            resolve(authResponse.access_token);
          }).catch((error:any) => {
            console.error("GAPI client init error:", error);
            reject(new Error('GAPI client initialization failed.'));
          });
        });
      } else {
        console.log('GAPI not ready, retrying...');
        setTimeout(checkGapiReady, 100); // Retry after 100ms
      }
    };
    
    checkGapiReady();
  });
};
