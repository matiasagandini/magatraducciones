'use strict';

document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  bindContactForm();
});

/* =========================
   Año footer
   ========================= */
function setFooterYear() {
  const anio = document.getElementById('anio');
  if (anio) anio.textContent = String(new Date().getFullYear());
}

/* =========================
   Contacto → abre WhatsApp con el mensaje armado
   ========================= */
function bindContactForm() {
  const form = document.getElementById('formContacto');
  const estado = document.getElementById('estadoFormulario');
  if (!form || !estado) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre')?.value?.trim() || '';
    const email = document.getElementById('email')?.value?.trim() || '';
    const mensaje = document.getElementById('mensaje')?.value?.trim() || '';

    const txt = `Hola María Alina, soy ${nombre}.
Email: ${email}
Mensaje: ${mensaje}`;

    const url = `https://wa.me/5491150584898?text=${encodeURIComponent(txt)}`;
    window.open(url, '_blank', 'noopener');

    estado.textContent = '¡Listo! Te abrimos WhatsApp para enviar el mensaje.';
    form.reset();
  });
}

/* =========================
   Google Reviews (Places) + fallback
   ========================= */
(() => {
  const GOOGLE_PLACE_ID = 'ChIJc660WKrLvJURzEEy7OVjq6A';

  const escapeHTML = (s = '') =>
    String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  function renderIndicators(count) {
    const indicators = document.getElementById('reviewsIndicators');
    if (!indicators) return;

    indicators.innerHTML = '';
    if (count <= 1) return;

    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-bs-target', '#carouselResenas');
      btn.setAttribute('data-bs-slide-to', String(i));
      btn.setAttribute('aria-label', `Reseña ${i + 1}`);
      if (i === 0) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'true');
      }
      indicators.appendChild(btn);
    }
  }

  function renderFallbackReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="carousel-item active">
        <figure class="p-4 border rounded-4 bg-white shadow-sm">
          <blockquote class="blockquote mb-2">“Excelente profesional. Muy responsable y puntual en la entrega.”</blockquote>
          <figcaption class="blockquote-footer mb-0 d-flex justify-content-between align-items-center gap-3">
            <span class="small text-muted">Cliente</span>
            <span aria-label="5 estrellas">★★★★★</span>
          </figcaption>
        </figure>
      </div>`;

    renderIndicators(1);
  }

  function renderReviews(reviews) {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    const items = Array.isArray(reviews) ? reviews.slice(0, 8) : [];
    if (!items.length) {
      renderFallbackReviews();
      return;
    }

    container.innerHTML = '';
    renderIndicators(items.length);

    items.forEach((r, idx) => {
      const rating = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

      const text = (r.text || '').trim();
      const author = (r.author_name || '').trim();
      const meta = author;

      const item = document.createElement('div');
      item.className = 'carousel-item' + (idx === 0 ? ' active' : '');

      const quote = text ? `“${escapeHTML(text)}”` : '“Muy buena experiencia.”';

      item.innerHTML = `
        <figure class="p-4 border rounded-4 bg-white shadow-sm">
          <blockquote class="blockquote mb-2">${quote}</blockquote>
          <figcaption class="blockquote-footer mb-0 d-flex justify-content-between align-items-center gap-3">
            <span class="small text-muted">${escapeHTML(meta || 'Cliente')}</span>
            <span aria-label="${rating} estrellas">${stars}</span>
          </figcaption>
        </figure>`;
      container.appendChild(item);
    });
  }

  window.initReviews = function initReviews() {
    const hasPlaces = window.google?.maps?.places;

    if (!hasPlaces) {
      renderFallbackReviews();
      return;
    }

    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      { placeId: GOOGLE_PLACE_ID, fields: ['reviews'] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.reviews) {
          renderFallbackReviews();
          return;
        }
        renderReviews(place.reviews);
      }
    );
  };
})();

/* =========================
   Ponencias – Marquee (loop suave + pausa)
   ========================= */
(() => {
  const track = document.getElementById('ponMarquee');
  if (!track) return;

  const groups = track.querySelectorAll('[data-pon-group]');
  const groupA = groups[0];
  const groupB = groups[1];
  const toggleBtn = document.querySelector('[data-pon-marquee="toggle"]');

  if (!groupA || !groupB) return;

  groupB.innerHTML = groupA.innerHTML;

  let isPaused = false;
  let x = 0;
  let last = performance.now();

  // ⬇️ más rápido
  const SPEED = window.innerWidth <= 768 ? 60 : 45;

  function setPaused(v) {
    isPaused = v;
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(!v));
      toggleBtn.innerHTML = v ? '<i class="bi bi-play-fill"></i>' : '<i class="bi bi-pause-fill"></i>';
    }
  }

  const pauseEvents = ['mouseenter', 'focusin', 'touchstart'];
  const resumeEvents = ['mouseleave', 'focusout', 'touchend'];

  pauseEvents.forEach(ev => track.addEventListener(ev, () => setPaused(true), { passive: true }));
  resumeEvents.forEach(ev => track.addEventListener(ev, () => setPaused(false), { passive: true }));

  toggleBtn?.addEventListener('click', () => setPaused(!isPaused));

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;

    if (!isPaused) {
      x -= SPEED * dt;

      const aWidth = groupA.scrollWidth;
      if (Math.abs(x) >= aWidth) x += aWidth;

      track.style.transform = `translateX(${x}px)`;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
