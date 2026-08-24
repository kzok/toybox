// Google tag (gtag.js).
//
// Loaded only on the published host, so the dev server and e2e (both on localhost)
// never send hits to the property.

function gtag() {
  // biome-ignore lint/complexity/noArguments: gtag.js only recognizes commands pushed as an Arguments object, not as a plain array.
  window.dataLayer.push(arguments);
}

if (location.hostname === "kzok.github.io") {
  window.dataLayer = window.dataLayer || [];
  gtag("js", new Date());
  gtag("config", "G-Y5YS3FH8V3");
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-Y5YS3FH8V3";
  document.head.append(script);
}
