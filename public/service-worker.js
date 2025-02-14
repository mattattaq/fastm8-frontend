self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated.");
});

self.addEventListener("push", (event) => {
  const options = {
      body: "You have a new notification!",
      icon: "/fastm8-frontend/img/icons/icon-192x192.png",
  };
  event.waitUntil(
      self.registration.showNotification("FastM8", options)
  );
});
