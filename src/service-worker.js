self.addEventListener("push", (event) => {
    const options = {
      body: event.data ? event.data.text() : "New notification!",
      icon: "/icons/icon-192x192.png"
    };
    event.waitUntil(self.registration.showNotification("FastM8", options));
  });

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow("https://your-website.com")  // Customize this URL
    );
});