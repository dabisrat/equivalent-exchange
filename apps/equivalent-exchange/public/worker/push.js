self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const { title, body, icon, badge, data: notificationData } = data;
  
  const options = {
    body: body,
    icon: icon || "/icons/icon-192x192.png",
    badge: badge || "/icons/icon-192x192.png",
    data: notificationData || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(title || "Notification", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUnowned: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed", event);
  // Handle subscription changes if needed
});