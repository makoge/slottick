self.addEventListener("push", (event) => {
  if (!event.data) return;

  const raw = event.data.text();

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    data = {
      title: "Slottick",
      body: raw || "New notification"
    };
  }

  const title = data.title || "Slottick";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    renotify: true,
    tag: data.tag || "slottick-booking",
    data: {
      url: data.url || "/"
    },
    actions: [
      {
        action: "open",
        title: "Open"
      }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});