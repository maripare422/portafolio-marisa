const data = window.portafolioData || {};
const $ = (selector) => document.querySelector(selector);
const el = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
};

let carouselState = { images: [], index: 0, title: '' };
let filtroPublicacionActivo = 'Todas';

const isValidLink = (url) => Boolean(url && !/^\s*(sin enlace|pendiente|no aplica)\s*$/i.test(url));

function createImage(src, alt, className) {
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt || '';
  image.loading = 'lazy';
  if (className) image.className = className;
  image.addEventListener('error', () => {
    image.style.display = 'none';
    const fallback = el('div', 'image-fallback', 'Imagen pendiente');
    image.parentElement?.append(fallback);
  });
  return image;
}

function renderPerfil() {
  $('#perfilEtiqueta').textContent = data.perfil?.etiqueta || '';
  $('#perfilNombre').textContent = data.perfil?.nombre || '';
  $('#perfilTitulo').textContent = data.perfil?.tituloPrincipal || '';
  $('#perfilDescripcion').textContent = data.perfil?.descripcion || '';
  $('#cvLink').href = data.perfil?.cv || '#';

  if (data.perfil?.foto) {
    const wrap = $('#profilePhotoWrap');
    wrap.innerHTML = '';
    wrap.append(createImage(data.perfil.foto, data.perfil.nombre, 'profile-photo'));
  }
}

function renderMetricas() {
  const container = $('#metricasContainer');
  if (!container) return;
  container.innerHTML = '';
  (data.metricas || []).forEach((item) => {
    const card = el('article', 'metric-card reveal');
    card.append(el('strong', null, item.numero));
    card.append(el('span', null, item.texto));
    container.append(card);
  });
}

function renderServicios() {
  const container = $('#serviciosContainer');
  if (!container) return;
  container.innerHTML = '';
  (data.servicios || []).forEach((servicio) => {
    const card = el('article', 'service-card reveal');
    const top = el('div', 'service-top');
    top.append(el('span', 'service-number', servicio.icono));
    top.append(el('h3', null, servicio.titulo));
    card.append(top);
    card.append(el('p', null, servicio.descripcion));
    const list = el('ul', 'tag-list');
    (servicio.actividades || []).forEach((actividad) => list.append(el('li', null, actividad)));
    card.append(list);
    container.append(card);
  });
}

function renderApoyoProyecto() {
  const section = $('#apoyo-proyecto');
  const container = $('#apoyoProyectoContainer');
  if (!section || !container) return;

  const apoyo = data.apoyoProyecto;
  if (!apoyo || !Array.isArray(apoyo.items) || apoyo.items.length === 0) {
    section.style.display = 'none';
    return;
  }

  $('#apoyoTitulo').textContent = apoyo.titulo || 'Lo que puedo hacer por tu proyecto';
  $('#apoyoSubtitulo').textContent = apoyo.subtitulo || '';
  container.innerHTML = '';

  apoyo.items.forEach((item, index) => {
    const card = el('article', 'support-card reveal');
    card.append(el('span', 'support-number', String(index + 1).padStart(2, '0')));
    card.append(el('h3', null, item.titulo));
    card.append(el('p', null, item.descripcion));
    container.append(card);
  });
}

function renderCompetencias() {
  const container = $('#competenciasContainer');
  if (!container) return;
  container.innerHTML = '';
  (data.competencias || []).forEach((competencia) => container.append(el('span', 'chip', competencia)));
}

function renderExperiencia() {
  const container = $('#experienciaContainer');
  if (!container) return;
  container.innerHTML = '';
  (data.experiencia || []).forEach((exp) => {
    const item = el('article', 'timeline-item reveal');
    item.append(el('div', 'timeline-period', exp.periodo));
    const card = el('div', 'timeline-card');
    card.append(el('h3', null, exp.cargo));
    card.append(el('div', 'institution', exp.institucion));
    card.append(el('p', null, exp.descripcion));
    const list = el('ul', 'tag-list');
    (exp.logros || []).forEach((logro) => list.append(el('li', null, logro)));
    card.append(list);
    item.append(card);
    container.append(item);
  });
}

function renderMediaExtras(producto, body) {
  if (producto.audios?.length) {
    const group = el('div', 'embedded-media');
    group.append(el('p', 'embedded-title', 'Audios'));
    producto.audios.forEach((audio) => {
      const box = el('div', 'media-player');
      box.append(el('span', null, audio.nombre || 'Audio'));
      const player = document.createElement('audio');
      player.controls = true;
      player.preload = 'metadata';
      const source = document.createElement('source');
      source.src = audio.archivo;
      source.type = 'audio/mpeg';
      player.append(source);
      box.append(player);
      group.append(box);
    });
    body.append(group);
  }

  if (producto.videos?.length) {
    const group = el('div', 'embedded-media');
    group.append(el('p', 'embedded-title', 'Videos'));
    producto.videos.forEach((video) => {
      const box = el('div', 'media-player video-player');
      box.append(el('span', null, video.nombre || 'Video'));
      const player = document.createElement('video');
      player.controls = true;
      player.preload = 'metadata';
      player.src = video.archivo;
      box.append(player);
      group.append(box);
    });
    body.append(group);
  }
}


function createAutoProductMedia(producto, images, proyectoTitulo) {
  const media = el('button', `product-media ${images.length > 1 ? 'auto-carousel-media' : ''}`);
  media.type = 'button';
  media.setAttribute('aria-label', `Ver imágenes de ${producto.nombre}`);

  const image = createImage(images[0] || producto.imagen, producto.nombre);
  media.append(image);

  if (images.length > 1) {
    const badge = el('span', 'auto-carousel-badge', `${images.length} fotos`);
    media.append(badge);

    const dots = el('div', 'auto-carousel-dots');
    images.forEach((_, index) => {
      dots.append(el('span', `auto-carousel-dot ${index === 0 ? 'active' : ''}`));
    });
    media.append(dots);

    let currentIndex = 0;
    let paused = false;

    const updateDots = () => {
      dots.querySelectorAll('.auto-carousel-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    };

    setInterval(() => {
      if (paused || document.hidden) return;
      currentIndex = (currentIndex + 1) % images.length;
      image.classList.add('is-changing');
      setTimeout(() => {
        image.src = images[currentIndex];
        updateDots();
        image.classList.remove('is-changing');
      }, 180);
    }, 3500);

    media.addEventListener('mouseenter', () => {
      paused = true;
    });

    media.addEventListener('mouseleave', () => {
      paused = false;
    });

    media.addEventListener('focus', () => {
      paused = true;
    });

    media.addEventListener('blur', () => {
      paused = false;
    });
  }

  if (images.length) {
    media.addEventListener('click', () => openCarousel(producto, proyectoTitulo));
  }

  return media;
}

function renderProductCard(producto, proyectoTitulo) {
  const productCard = el('article', 'product-card');
  const images = [producto.imagen, ...(producto.carrusel || [])].filter(Boolean);
  const media = createAutoProductMedia(producto, images, proyectoTitulo);
  productCard.append(media);

  const body = el('div', 'product-body');
  if (producto.tipo) body.append(el('span', 'product-type', producto.tipo));
  body.append(el('h4', null, producto.nombre));
  body.append(el('p', null, producto.descripcion));
  renderMediaExtras(producto, body);

  const actions = el('div', 'product-actions');
  if (images.length) {
    const imagesButton = el('button', 'mini-btn', producto.carrusel?.length ? 'Ver imágenes' : 'Ver imagen');
    imagesButton.type = 'button';
    imagesButton.addEventListener('click', () => openCarousel(producto, proyectoTitulo));
    actions.append(imagesButton);
  }
  if (isValidLink(producto.enlace)) {
    const link = el('a', 'mini-btn mini-btn-primary', producto.boton || 'Ver material');
    link.href = producto.enlace;
    link.target = '_blank';
    link.rel = 'noopener';
    actions.append(link);
  } else if (producto.boton && /disponible/i.test(producto.boton)) {
    actions.append(el('span', 'mini-btn mini-btn-disabled', producto.boton));
  }
  body.append(actions);
  productCard.append(body);
  return productCard;
}

function renderProyectos() {
  const container = $('#proyectosContainer');
  if (!container) return;
  container.innerHTML = '';

  (data.proyectos || []).forEach((proyecto) => {
    const hasProducts = Array.isArray(proyecto.productos) && proyecto.productos.length > 0;
    const card = el('article', `project-card reveal ${hasProducts ? 'has-products' : ''}`);

    if (proyecto.imagen) {
      const cover = el('div', 'project-cover');
      cover.append(createImage(proyecto.imagen, proyecto.titulo));
      card.append(cover);
    }

    const content = el('div', 'project-content');
    content.append(el('h3', null, proyecto.titulo));
    content.append(el('div', 'project-meta', `${proyecto.institucion} · ${proyecto.anio}`));
    content.append(el('p', 'project-area', proyecto.area));
    content.append(el('p', null, proyecto.descripcion));

    if (proyecto.miRol) {
      const role = el('div', 'project-role');
      role.append(el('strong', null, 'Mi rol'));
      role.append(el('p', null, proyecto.miRol));
      content.append(role);
    }

    if (hasProducts) {
      const title = el('div', 'products-title');
      title.append(el('span', null, 'Productos principales'));
      title.append(el('small', null, 'Cada producto tiene imagen, resumen y enlace cuando corresponde.'));
      content.append(title);
      const productsGrid = el('div', 'products-grid');
      proyecto.productos.forEach((producto) => productsGrid.append(renderProductCard(producto, proyecto.titulo)));
      content.append(productsGrid);
    }

    card.append(content);
    container.append(card);
  });
}

function getCategoriasPublicaciones() {
  const categorias = (data.publicaciones || [])
    .map((pub) => pub.categoria)
    .filter(Boolean);
  return ['Todas', ...new Set(categorias)];
}

function renderFiltrosPublicaciones() {
  const container = $('#filtrosPublicaciones');
  if (!container) return;
  const categorias = getCategoriasPublicaciones();
  container.innerHTML = '';

  categorias.forEach((categoria) => {
    const button = el('button', `publication-filter ${categoria === filtroPublicacionActivo ? 'active' : ''}`, categoria);
    button.type = 'button';
    button.dataset.categoria = categoria;
    button.addEventListener('click', () => {
      filtroPublicacionActivo = categoria;
      renderFiltrosPublicaciones();
      renderPublicaciones();
    });
    container.append(button);
  });
}

function renderPublicaciones() {
  const container = $('#publicacionesContainer');
  if (!container) return;
  container.innerHTML = '';

  const publicaciones = filtroPublicacionActivo === 'Todas'
    ? (data.publicaciones || [])
    : (data.publicaciones || []).filter((pub) => pub.categoria === filtroPublicacionActivo);

  publicaciones.forEach((pub) => {
    const card = el('article', 'publication-card');
    const media = el('div', 'publication-media');
    if (pub.imagen) media.append(createImage(pub.imagen, pub.titulo));
    card.append(media);

    const content = el('div', 'publication-content');
    content.append(el('div', 'pub-year', pub.anio));
    if (pub.categoria) content.append(el('div', 'pub-category', pub.categoria));
    content.append(el('h3', null, pub.titulo));
    content.append(el('div', 'pub-meta', pub.tipo));
    content.append(el('p', null, pub.descripcion));
    if (isValidLink(pub.enlace)) {
      const link = el('a', 'pub-link', pub.boton || 'Ver publicación');
      link.href = pub.enlace;
      link.target = '_blank';
      link.rel = 'noopener';
      content.append(link);
    }
    card.append(content);
    container.append(card);
  });
}

function renderSobreMi() {
  $('#sobreTitulo').textContent = data.sobreMi?.titulo || '';
  $('#sobreTexto').textContent = data.sobreMi?.texto || '';
  const container = $('#interesesContainer');
  if (!container) return;
  container.innerHTML = '';
  (data.sobreMi?.intereses || []).forEach((interes) => container.append(el('span', 'chip', interes)));
}

function renderFormacion() {
  const container = $('#formacionContainer');
  if (!container) return;
  container.innerHTML = '';
  (data.formacion || []).forEach((formacion) => {
    const item = el('article', 'education-item reveal');
    const copy = el('div');
    copy.append(el('h3', null, formacion.titulo));
    copy.append(el('p', null, formacion.institucion));
    item.append(copy);
    item.append(el('div', 'education-period', formacion.periodo));
    container.append(item);
  });

  const idiomas = $('#idiomasContainer');
  idiomas.innerHTML = '';
  idiomas.append(el('h3', null, 'Idiomas'));
  const list = el('ul');
  (data.idiomas || []).forEach((idioma) => list.append(el('li', null, idioma)));
  idiomas.append(list);
}

function renderContacto() {
  const container = $('#contactoContainer');
  if (!container) return;
  container.innerHTML = '';
  const mail = el('a', 'btn', `Correo: ${data.perfil?.correo || ''}`);
  mail.href = `mailto:${data.perfil?.correo || ''}`;
  container.append(mail);

  if (data.perfil?.linkedin) {
    const linkedin = el('a', 'btn', 'LinkedIn');
    linkedin.href = data.perfil.linkedin;
    linkedin.target = '_blank';
    linkedin.rel = 'noopener';
    container.append(linkedin);
  }

  if (data.perfil?.portafolioAnexos) {
    const anexos = el('a', 'btn', 'Anexos y portafolio');
    anexos.href = data.perfil.portafolioAnexos;
    anexos.target = '_blank';
    anexos.rel = 'noopener';
    container.append(anexos);
  }

  const cv = el('a', 'btn', 'Descargar CV');
  cv.href = data.perfil?.cv || '#';
  cv.target = '_blank';
  cv.rel = 'noopener';
  container.append(cv);
}

function createCarouselModal() {
  const modal = document.createElement('div');
  modal.className = 'carousel-modal';
  modal.id = 'carouselModal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `<div class="carousel-backdrop" data-close-carousel></div><div class="carousel-dialog" role="dialog" aria-modal="true" aria-labelledby="carouselTitle"><button class="carousel-close" type="button" aria-label="Cerrar" data-close-carousel>×</button><div class="carousel-header"><span class="eyebrow">Galería de producto</span><h3 id="carouselTitle"></h3><p id="carouselCounter"></p></div><div class="carousel-stage"><button class="carousel-nav carousel-prev" type="button" aria-label="Imagen anterior">‹</button><img id="carouselImage" alt="" /><button class="carousel-nav carousel-next" type="button" aria-label="Imagen siguiente">›</button></div><div class="carousel-thumbs" id="carouselThumbs"></div></div>`;
  document.body.append(modal);
  modal.querySelectorAll('[data-close-carousel]').forEach((button) => button.addEventListener('click', closeCarousel));
  modal.querySelector('.carousel-prev').addEventListener('click', () => moveCarousel(-1));
  modal.querySelector('.carousel-next').addEventListener('click', () => moveCarousel(1));
  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('active')) return;
    if (event.key === 'Escape') closeCarousel();
    if (event.key === 'ArrowLeft') moveCarousel(-1);
    if (event.key === 'ArrowRight') moveCarousel(1);
  });
}

function openCarousel(producto, proyectoTitulo) {
  const images = [producto.imagen, ...(producto.carrusel || [])].filter(Boolean);
  if (!images.length) return;
  carouselState = { images, index: 0, title: `${producto.nombre} · ${proyectoTitulo}` };
  const modal = $('#carouselModal');
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  renderCarouselImage();
}

function closeCarousel() {
  const modal = $('#carouselModal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function moveCarousel(direction) {
  const total = carouselState.images.length;
  carouselState.index = (carouselState.index + direction + total) % total;
  renderCarouselImage();
}

function renderCarouselImage() {
  const title = $('#carouselTitle');
  const counter = $('#carouselCounter');
  const image = $('#carouselImage');
  const thumbs = $('#carouselThumbs');
  title.textContent = carouselState.title;
  counter.textContent = `${carouselState.index + 1} de ${carouselState.images.length}`;
  image.src = carouselState.images[carouselState.index];
  image.alt = carouselState.title;
  thumbs.innerHTML = '';
  carouselState.images.forEach((src, index) => {
    const thumb = el('button', `carousel-thumb ${index === carouselState.index ? 'active' : ''}`);
    thumb.type = 'button';
    thumb.setAttribute('aria-label', `Ver imagen ${index + 1}`);
    thumb.append(createImage(src, `Miniatura ${index + 1}`));
    thumb.addEventListener('click', () => {
      carouselState.index = index;
      renderCarouselImage();
    });
    thumbs.append(thumb);
  });
}

function initMenu() {
  const button = $('.menu-toggle');
  const links = $('#navLinks');
  if (!button || !links) return;
  button.addEventListener('click', () => {
    const isOpen = links.classList.toggle('active');
    document.body.classList.toggle('menu-open', isOpen);
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    links.classList.remove('active');
    document.body.classList.remove('menu-open');
    button.setAttribute('aria-expanded', 'false');
  }));
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
}

function init() {
  try {
    renderPerfil();
    renderMetricas();
    renderServicios();
    renderApoyoProyecto();
    renderCompetencias();
    renderExperiencia();
    renderProyectos();
    renderFiltrosPublicaciones();
    renderPublicaciones();
    renderSobreMi();
    renderFormacion();
    renderContacto();
    createCarouselModal();
    initMenu();
    initReveal();
    $('#year').textContent = new Date().getFullYear();
  } catch (error) {
    console.error('Error al cargar el portafolio:', error);
    document.body.insertAdjacentHTML('afterbegin', '<div style="padding:16px;background:#fff2f2;color:#7a1f1f;font-family:Arial,sans-serif;">Hubo un error al cargar el portafolio. Revisa el archivo datos.js o envía el ZIP para corregirlo.</div>');
  }
}

init();
