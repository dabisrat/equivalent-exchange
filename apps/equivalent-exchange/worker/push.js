self.addEventListener("push", (event) => {
  const { title, body, icon, badge, data } = event.data.json();
  const options = {
    body,
    icon: icon || "/icons/icon-192x192.png",
    badge: badge || "/icons/icon-192x192.png",
    data: data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // Handle subscription changes (e.g., key rotation on mobile)
  // Resubscribe with the same options
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((newSubscription) => {
        // Send the new subscription to the server
        // Note: organizationId may need to be retrieved from client via postMessage
        return fetch("/api/subscribe-push", {
          method: "POST",
          body: JSON.stringify({ subscription: newSubscription }),
          headers: { "Content-Type": "application/json" },
        });
      })
      .catch((error) => {
        console.error("Subscription renewal failed:", error);
        // Note: If there is an error during pushsubscriptionchange, store the subscription
        // and try again when the user is authenticated (e.g., on app load)
      })
  );
});