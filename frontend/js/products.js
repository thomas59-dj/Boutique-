/* =========================================================
   BOUTIQUE — products.js
   Récupération et affichage des produits : page d'accueil,
   page boutique (filtres/tri/recherche/pagination) et fiche
   produit détaillée.
   ========================================================= */

/** Remplit un <article class="product-card"> à partir du <template> partagé. */
function buildProductCard(product) {
  const template = document.getElementById('productCardTemplate');
  const node = template.content.cloneNode(true);

  const link = `product.html?id=${product.id}`;
  const img = node.querySelector('.product-card-image img');
  img.src = product.image;
  img.alt = product.name;
  node.querySelector('.product-card-image').href = link;

  const categoryEl = node.querySelector('.product-card-category');
  categoryEl.textContent = product.category?.name || '';
  categoryEl.href = `shop.html?category=${product.category?.slug || ''}`;

  const nameEl = node.querySelector('.product-card-name');
  nameEl.textContent = product.name;
  nameEl.href = link;

  node.querySelector('.product-card-price .price').textContent = `${product.price.toFixed(2)} €`;
  const oldPriceEl = node.querySelector('.product-card-price .old-price');
  if (product.oldPrice) {
    oldPriceEl.textContent = `${product.oldPrice.toFixed(2)} €`;
  } else {
    oldPriceEl.remove();
  }

  const addBtn = node.querySelector('.add-to-cart-btn');
  addBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    addBtn.disabled = true;
    addBtn.textContent = 'Ajouté ✓';
    await addToCart(product, 1);
    await updateCartCountBadge();
    setTimeout(() => {
      addBtn.disabled = false;
      addBtn.textContent = 'Ajouter au panier';
    }, 1200);
  });

  const favBtn = node.querySelector('.favorite-btn');
  favBtn.addEventListener('click', (e) => {
    e.preventDefault();
    favBtn.classList.toggle('active');
  });

  return node;
}

function renderProductGrid(container, products) {
  container.innerHTML = '';
  products.forEach((product) => container.appendChild(buildProductCard(product)));
}

/* ---------------------------------------------------------
   Page index.html : catégories + nouveautés
   --------------------------------------------------------- */
async function initHomePage() {
  const categoryGrid = document.getElementById('homeCategoryGrid');
  const productGrid = document.getElementById('homeProductGrid');
  if (!categoryGrid && !productGrid) return;

  if (categoryGrid) {
    try {
      const categories = await api.get('/categories');
      categoryGrid.innerHTML = categories
        .map((c) => `<a class="category-tile" href="shop.html?category=${c.slug}">${c.name}</a>`)
        .join('');
    } catch (err) {
      categoryGrid.innerHTML = `<p class="empty-state">${err.message}</p>`;
    }
  }

  if (productGrid) {
    try {
      const { items } = await api.get('/products?sort=newest&limit=4');
      renderProductGrid(productGrid, items);
    } catch (err) {
      productGrid.innerHTML = `<p class="empty-state">${err.message}</p>`;
    }
  }
}

/* ---------------------------------------------------------
   Page shop.html : filtres, tri, recherche, pagination
   --------------------------------------------------------- */
async function initShopPage() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const emptyState = document.getElementById('emptyState');
  const searchStatus = document.getElementById('searchStatus');
  const categoryFilters = document.getElementById('categoryFilters');
  const pagination = document.getElementById('pagination');

  const params = new URLSearchParams(window.location.search);
  const state = {
    search: params.get('search') || '',
    category: params.get('category') || '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    sort: params.get('sort') || 'newest',
    page: 1,
  };
  document.getElementById('searchInput').value = state.search;
  document.getElementById('sortSelect').value = state.sort;

  // Génère dynamiquement les cases à cocher de catégories
  try {
    const categories = await api.get('/categories');
    categoryFilters.innerHTML = categories
      .map(
        (c) => `
        <label class="checkbox-line">
          <input type="checkbox" name="category" value="${c.slug}" ${c.slug === state.category ? 'checked' : ''}>
          ${c.name}
        </label>`
      )
      .join('');
    categoryFilters.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => {
        // Une seule catégorie à la fois pour rester simple et lisible
        categoryFilters.querySelectorAll('input[type="checkbox"]').forEach((other) => {
          if (other !== cb) other.checked = false;
        });
        state.category = cb.checked ? cb.value : '';
        state.page = 1;
        loadProducts();
      });
    });
  } catch (err) {
    categoryFilters.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }

  async function loadProducts() {
    grid.setAttribute('aria-busy', 'true');
    searchStatus.textContent = 'Chargement…';

    const query = new URLSearchParams();
    if (state.search) query.set('search', state.search);
    if (state.category) query.set('category', state.category);
    if (state.minPrice) query.set('minPrice', state.minPrice);
    if (state.maxPrice) query.set('maxPrice', state.maxPrice);
    if (state.inStock) query.set('inStock', 'true');
    query.set('sort', state.sort);
    query.set('page', state.page);
    query.set('limit', 12);

    try {
      const { items, pagination: pageInfo } = await api.get(`/products?${query.toString()}`);
      renderProductGrid(grid, items);
      emptyState.hidden = items.length > 0;
      searchStatus.textContent = state.search
        ? `${pageInfo.total} résultat(s) pour "${state.search}"`
        : '';
      renderPagination(pageInfo);
    } catch (err) {
      grid.innerHTML = '';
      searchStatus.textContent = err.message;
    } finally {
      grid.removeAttribute('aria-busy');
    }
  }

  function renderPagination(pageInfo) {
    pagination.innerHTML = '';
    if (pageInfo.totalPages <= 1) return;
    for (let p = 1; p <= pageInfo.totalPages; p++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = p;
      if (p === pageInfo.page) btn.classList.add('active');
      btn.addEventListener('click', () => {
        state.page = p;
        loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      pagination.appendChild(btn);
    }
  }

  // Recherche
  document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.search = document.getElementById('searchInput').value.trim();
    state.page = 1;
    loadProducts();
  });

  // Tri
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    loadProducts();
  });

  // Prix
  document.getElementById('minPrice').addEventListener('change', (e) => {
    state.minPrice = e.target.value;
    state.page = 1;
    loadProducts();
  });
  document.getElementById('maxPrice').addEventListener('change', (e) => {
    state.maxPrice = e.target.value;
    state.page = 1;
    loadProducts();
  });

  // Stock
  document.getElementById('inStockOnly').addEventListener('change', (e) => {
    state.inStock = e.target.checked;
    state.page = 1;
    loadProducts();
  });

  // Réinitialisation
  document.getElementById('resetFilters').addEventListener('click', () => {
    state.search = '';
    state.category = '';
    state.minPrice = '';
    state.maxPrice = '';
    state.inStock = false;
    state.sort = 'newest';
    state.page = 1;
    document.getElementById('searchInput').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('inStockOnly').checked = false;
    document.getElementById('sortSelect').value = 'newest';
    categoryFilters.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
    loadProducts();
  });

  // Repli des filtres sur mobile
  document.getElementById('filtersToggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('shopSidebar');
    const isOpen = sidebar.classList.toggle('open');
    document.getElementById('filtersToggle').setAttribute('aria-expanded', isOpen);
  });

  await loadProducts();
}

/**
 * Injecte les données structurées schema.org (JSON-LD) dans la fiche produit.
 * Aide Google à comprendre prix/disponibilité — utile pour le SEO et cohérent
 * avec les données envoyées à Google Merchant Center via le flux XML.
 */
function injectProductStructuredData(product) {
  const existing = document.getElementById('productStructuredData');
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'productStructuredData';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [product.image, ...(product.images || [])].map((src) => new URL(src, window.location.origin).href),
    description: product.description,
    sku: product.id,
    brand: { '@type': 'Brand', name: product.brand || 'Boutique' },
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'EUR',
      price: product.price,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  });
  document.head.appendChild(script);
}

/* ---------------------------------------------------------
   Page product.html : fiche produit détaillée
   --------------------------------------------------------- */
async function initProductPage() {
  const detailEl = document.getElementById('productDetail');
  if (!detailEl) return;

  const loadingEl = document.getElementById('productLoading');
  const notFoundEl = document.getElementById('productNotFound');
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    loadingEl.hidden = true;
    notFoundEl.hidden = false;
    return;
  }

  try {
    const product = await api.get(`/products/${productId}`);
    loadingEl.hidden = true;
    detailEl.hidden = false;

    document.title = `Boutique — ${product.name}`;
    document.getElementById('breadcrumb').innerHTML = `
      <a href="shop.html">Boutique</a> / <a href="shop.html?category=${product.category.slug}">${product.category.name}</a> / ${product.name}
    `;

    document.getElementById('mainImage').src = product.image;
    document.getElementById('mainImage').alt = product.name;

    const allImages = [product.image, ...(product.images || [])];
    const thumbs = document.getElementById('thumbnails');
    thumbs.innerHTML = allImages
      .map((src, i) => `<img src="${src}" alt="Vue ${i + 1}" class="${i === 0 ? 'active' : ''}">`)
      .join('');
    thumbs.querySelectorAll('img').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        document.getElementById('mainImage').src = thumb.src;
        thumbs.querySelectorAll('img').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = `${product.price.toFixed(2)} €`;
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('productCategory').textContent = product.category.name;

    injectProductStructuredData(product);
    document.getElementById('productStock').textContent =
      product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock';

    const oldPriceEl = document.getElementById('productOldPrice');
    const badgeEl = document.getElementById('discountBadge');
    if (product.oldPrice) {
      oldPriceEl.textContent = `${product.oldPrice.toFixed(2)} €`;
      const percent = Math.round((1 - product.price / product.oldPrice) * 100);
      badgeEl.textContent = `-${percent}%`;
      badgeEl.hidden = false;
    }

    const qtyInput = document.getElementById('quantityInput');
    qtyInput.max = product.stock;
    document.getElementById('decreaseQty').addEventListener('click', () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
    document.getElementById('increaseQty').addEventListener('click', () => {
      qtyInput.value = Math.min(product.stock, Number(qtyInput.value) + 1);
    });

    const addToCartBtn = document.getElementById('addToCartBtn');
    addToCartBtn.disabled = product.stock === 0;
    addToCartBtn.addEventListener('click', async () => {
      await addToCart(product, Number(qtyInput.value));
      await updateCartCountBadge();
      const feedback = document.getElementById('addToCartFeedback');
      feedback.hidden = false;
      setTimeout(() => (feedback.hidden = true), 2000);
    });
  } catch (err) {
    loadingEl.hidden = true;
    notFoundEl.hidden = false;
    notFoundEl.textContent = err.message;
  }
}
