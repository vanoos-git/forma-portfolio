const root = document.documentElement;
const header = document.querySelector('.site-header');
const navigation = Array.from(header.querySelectorAll('a[href^="#"]:not(.brand)'), (link) => ({
  link,
  section: document.querySelector(link.hash),
}));

let scrollFrame = 0;

function updateScroll() {
  scrollFrame = 0;
  const remaining = root.scrollHeight - root.clientHeight;
  root.style.setProperty('--scroll', remaining > 0 ? Math.min(1, window.scrollY / remaining) : 0);

  const activationLine = header.offsetHeight + Math.min(140, window.innerHeight * 0.23);
  let current = navigation.findLast(({ section }) => section.getBoundingClientRect().top <= activationLine);
  if (remaining > 0 && window.scrollY >= remaining - 2) current = navigation.at(-1);

  for (const item of navigation) {
    if (item === current) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  }
}

function scheduleScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}

window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
window.addEventListener('resize', scheduleScrollUpdate);
window.addEventListener('pageshow', scheduleScrollUpdate);
updateScroll();

if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach((element) => reveal.observe(element));
  root.classList.add('has-reveal');
}

const gallery = document.querySelector('.lightbox');

if (typeof gallery.showModal === 'function') {
  const media = gallery.querySelector('.lightbox-media');
  const heading = gallery.querySelector('#lightbox-title');
  const category = gallery.querySelector('.lightbox-type');
  const counter = gallery.querySelector('.lightbox-count');
  const close = gallery.querySelector('.close-button');
  const cards = Array.from(document.querySelectorAll('.work-link'), (link) => ({
    link,
    image: link.querySelector('img'),
    title: link.querySelector('.work-name').textContent,
    type: link.querySelector('.work-type').textContent,
  }));

  let active = 0;
  let opener;
  let gesture;

  function showWork(index) {
    active = (index + cards.length) % cards.length;
    const { link, image, title, type } = cards[active];
    const fullImage = new Image();
    fullImage.src = link.href;
    fullImage.alt = image.alt;
    media.replaceChildren(fullImage);
    heading.textContent = title;
    category.textContent = type;
    counter.textContent = `${active + 1} из ${cards.length}`;
  }

  cards.forEach(({ link }, index) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      showWork(index);
      gallery.showModal();
    });
  });

  close.addEventListener('click', () => gallery.close());
  gallery.querySelector('.previous-button').addEventListener('click', () => showWork(active - 1));
  gallery.querySelector('.next-button').addEventListener('click', () => showWork(active + 1));

  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showWork(active + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  gallery.addEventListener('click', (event) => {
    if (event.target === gallery) gallery.close();
  });
  gallery.addEventListener('close', () => {
    gesture = undefined;
    opener?.focus({ preventScroll: true });
  });

  media.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' && event.isPrimary) {
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  });
  media.addEventListener('pointerup', (event) => {
    if (event.pointerId !== gesture?.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = undefined;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      showWork(active + (dx < 0 ? 1 : -1));
    }
  });
  media.addEventListener('pointercancel', () => { gesture = undefined; });
}
