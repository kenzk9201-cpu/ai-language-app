if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker 註冊成功，範圍為: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker 註冊失敗: ', err);
      });
  });
}