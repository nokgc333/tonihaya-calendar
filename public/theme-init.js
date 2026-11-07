(function () {
  try {
    var saved = localStorage.getItem("tonihaya.theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch {
    // Without storage the page follows the system setting.
  }
})();
