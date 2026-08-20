export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    const hadControllerAtStartup = navigator.serviceWorker.controller !== null
    let reloadingForUpdate = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadControllerAtStartup || reloadingForUpdate) {
        return
      }

      reloadingForUpdate = true
      window.location.reload()
    })

    void navigator.serviceWorker
      .register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      .then((registration) => registration.update())
      .catch(() => {
        // PWA enhancement failures must not prevent the health application from loading.
      })
  })
}
