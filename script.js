// ==============================================================
// ACCOMMODATION CONNECT ZW — Luxury Short-Stay & Rental Platform
// Core Interactive Application Controller
// ==============================================================

// ─── STATE MANAGEMENT ─────────────────────────────────────────
let properties = [];
let currentUser = null;
let currentView = 'tenant';
let favorites = [];
let activeLocation = 'all';
let activeTypeFilter = 'all'; // 'all' | 'sale' | 'rent'
let currentSearch = { location: '', checkIn: '', checkOut: '', capacity: '', listingType: '' };
let currentCurrency = { code: 'USD', symbol: '$', rate: 1 };
let currentDetailProperty = null;
let carouselPosition = 0;

// ─── CURRENCY CONFIG ──────────────────────────────────────────
const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', rate: 1 },
  ZAR: { code: 'ZAR', symbol: 'R', rate: 18.5 },
  ZIG: { code: 'ZiG', symbol: 'Z$', rate: 35 },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79 }
};

function fmtPrice(usdAmount) {
  const converted = Math.round(usdAmount * currentCurrency.rate);
  return `${currentCurrency.symbol} ${converted.toLocaleString()}`;
}

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 280);
  }, 3200);
}

// ─── APP INITIALIZATION ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await ROJADB.init();
  properties = ROJADB.getProperties();
  currentUser = ROJADB.getCurrentSession();
  favorites = currentUser ? ROJADB.getFavoritesForUser(currentUser.id) : [];

  setupHeader();
  setupStickySearchBar();
  setupCarousel();
  setupTestimonials();
  setupTrendingDestinations();
  setupModals();
  setupBookingEngine();
  setupHostDashboard();
  updateAuthUI();

  renderProperties(properties);
});

// ─── HEADER & NAVIGATION ──────────────────────────────────────
function setupHeader() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Currency Dropdown
  const currBtn = document.getElementById('currency-trigger-btn');
  const currDropdown = document.getElementById('currency-dropdown');
  const currSymbolEl = document.getElementById('currency-symbol');
  const currCodeEl = document.getElementById('currency-code');

  if (currBtn && currDropdown) {
    currBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currDropdown.classList.toggle('open');
      closeUserMenu();
    });

    document.querySelectorAll('.currency-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const code = opt.dataset.currency;
        const sym = opt.dataset.symbol;
        const rate = parseFloat(opt.dataset.rate);

        currentCurrency = { code, symbol: sym, rate };
        if (currCodeEl) currCodeEl.textContent = code;
        if (currSymbolEl) currSymbolEl.textContent = sym;

        document.querySelectorAll('.currency-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currDropdown.classList.remove('open');

        renderProperties(getFilteredProperties());
        if (currentDetailProperty) updateBookingCalculation();
        showToast(`Currency set to ${code} (${sym})`, 'info');
      });
    });
  }

  // User Dropdown
  const userBtn = document.getElementById('user-menu-trigger');
  const userDropdown = document.getElementById('user-dropdown-menu');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
      if (currDropdown) currDropdown.classList.remove('open');
    });
  }

  document.addEventListener('click', () => {
    if (currDropdown) currDropdown.classList.remove('open');
    closeUserMenu();
  });

  // Host Toggle
  const hostToggle = document.getElementById('switch-perspective-btn');
  if (hostToggle) {
    hostToggle.addEventListener('click', () => {
      togglePerspective();
    });
  }

  // Logo button
  const logoBtn = document.getElementById('logo-btn');
  if (logoBtn) {
    logoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentView === 'landlord') togglePerspective();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Wishlist drawer trigger
  const wishlistBtn = document.getElementById('wishlist-trigger-btn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      openWishlistDrawer();
    });
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = mainNav.style.display === 'flex';
      mainNav.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        mainNav.style.position = 'absolute';
        mainNav.style.top = '74px';
        mainNav.style.left = '0';
        mainNav.style.right = '0';
        mainNav.style.background = '#FFFFFF';
        mainNav.style.flexDirection = 'column';
        mainNav.style.padding = '20px';
        mainNav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        mainNav.style.zIndex = '999';
      }
    });
  }
}

function closeUserMenu() {
  const userDropdown = document.getElementById('user-dropdown-menu');
  if (userDropdown) userDropdown.classList.remove('open');
}

// ─── AUTHENTICATION STATE & UI ────────────────────────────────
function updateAuthUI() {
  const loginBtn = document.getElementById('dropdown-login-btn');
  const bookingsBtn = document.getElementById('dropdown-bookings-btn');
  const favoritesBtn = document.getElementById('dropdown-favorites-btn');
  const logoutBtn = document.getElementById('dropdown-logout-btn');
  const userHeader = document.getElementById('dropdown-user-header');
  const userNameEl = document.getElementById('dropdown-user-name');
  const userBadgeEl = document.getElementById('dropdown-user-badge');
  const avatarInitials = document.getElementById('dropdown-avatar-initials');
  const avatarSm = document.getElementById('user-avatar-sm');
  const accountLabel = document.getElementById('account-label-text');
  const landlordGreeting = document.getElementById('landlord-greeting');
  const wishlistBadge = document.getElementById('wishlist-badge');

  if (currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (bookingsBtn) bookingsBtn.style.display = 'block';
    if (favoritesBtn) favoritesBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userHeader) userHeader.style.display = 'flex';

    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userBadgeEl) userBadgeEl.textContent = currentUser.role === 'landlord' ? 'Host' : 'Guest';
    if (avatarInitials) avatarInitials.textContent = initials;
    if (avatarSm) avatarSm.textContent = initials;
    if (accountLabel) accountLabel.textContent = currentUser.name.split(' ')[0];
    if (landlordGreeting) landlordGreeting.textContent = `Welcome back, ${currentUser.name}!`;

    favorites = ROJADB.getFavoritesForUser(currentUser.id);
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (bookingsBtn) bookingsBtn.style.display = 'none';
    if (favoritesBtn) favoritesBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userHeader) userHeader.style.display = 'none';
    if (accountLabel) accountLabel.textContent = 'Account';
    if (avatarSm) avatarSm.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>`;
  }

  // Update wishlist badge
  if (wishlistBadge) {
    if (favorites.length > 0) {
      wishlistBadge.textContent = favorites.length;
      wishlistBadge.style.display = 'flex';
    } else {
      wishlistBadge.style.display = 'none';
    }
  }
}

function togglePerspective() {
  const tenantView = document.getElementById('tenant-view');
  const landlordView = document.getElementById('landlord-view');
  const label = document.getElementById('host-switch-label');

  if (currentView === 'tenant') {
    currentView = 'landlord';
    if (tenantView) tenantView.style.display = 'none';
    if (landlordView) landlordView.classList.add('active');
    if (label) label.textContent = 'Guest Mode';
    renderHostDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Switched to Host Dashboard', 'info');
  } else {
    currentView = 'tenant';
    if (tenantView) tenantView.style.display = 'block';
    if (landlordView) landlordView.classList.remove('active');
    if (label) label.textContent = 'Host Dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Switched to Guest Browsing', 'info');
  }
}

// ─── STICKY SEARCH BAR (Exact Accommodation Connect Behavior) ─
function setupStickySearchBar() {
  const stickyEl = document.getElementById('search-filter');
  const stickyAnchor = document.getElementById('sticky-search-anchor');
  const resetBtn = document.getElementById('reset-filters');
  const listingTypeSelect = document.getElementById('listing_type');
  const locationSelect = document.getElementById('location');
  const dateInput = document.getElementById('availability_date');
  const capacitySelect = document.getElementById('capacity');

  function checkFilters() {
    const type = listingTypeSelect ? listingTypeSelect.value.trim() : '';
    const loc = locationSelect ? locationSelect.value.trim() : '';
    const date = dateInput ? dateInput.value.trim() : '';
    const cap = capacitySelect ? capacitySelect.value.trim() : '';
    const anySelected = type || loc || date || cap;

    if (resetBtn) {
      if (anySelected) {
        resetBtn.classList.remove('inactive');
      } else {
        resetBtn.classList.add('inactive');
      }
    }
  }

  if (listingTypeSelect) {
    listingTypeSelect.addEventListener('change', () => {
      currentSearch.listingType = listingTypeSelect.value;
      activeTypeFilter = listingTypeSelect.value || 'all';

      // Sync type tabs
      document.querySelectorAll('.type-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.type === activeTypeFilter);
      });

      checkFilters();
      renderProperties(getFilteredProperties());
    });
  }

  if (locationSelect) {
    locationSelect.addEventListener('change', () => {
      currentSearch.location = locationSelect.value;
      checkFilters();
      renderProperties(getFilteredProperties());
    });
  }

  if (capacitySelect) {
    capacitySelect.addEventListener('change', () => {
      currentSearch.capacity = capacitySelect.value;
      checkFilters();
      renderProperties(getFilteredProperties());
    });
  }

  // Date picker trigger
  if (dateInput) {
    dateInput.addEventListener('click', () => {
      openModal('date-picker-modal');
    });
  }

  const applyDatesBtn = document.getElementById('apply-dates-btn');
  const filterCheckin = document.getElementById('filter-checkin');
  const filterCheckout = document.getElementById('filter-checkout');

  // Set default min check-in date to today
  const todayStr = new Date().toISOString().split('T')[0];
  if (filterCheckin) filterCheckin.min = todayStr;
  if (filterCheckout) filterCheckout.min = todayStr;

  if (applyDatesBtn) {
    applyDatesBtn.addEventListener('click', () => {
      const ci = filterCheckin.value;
      const co = filterCheckout.value;

      if (!ci || !co) {
        showToast('Please select both check-in and check-out dates', 'error');
        return;
      }
      if (co <= ci) {
        showToast('Check-out must be after check-in', 'error');
        return;
      }

      currentSearch.checkIn = ci;
      currentSearch.checkOut = co;

      const d1 = new Date(ci);
      const d2 = new Date(co);
      const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

      dateInput.value = `${ci} → ${co} (${nights}n)`;
      checkFilters();
      closeModal('date-picker-modal');
      renderProperties(getFilteredProperties());
      showToast(`Dates set: ${nights} nights`, 'success');
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (listingTypeSelect) listingTypeSelect.value = '';
      if (locationSelect) locationSelect.value = '';
      if (dateInput) dateInput.value = '';
      if (capacitySelect) capacitySelect.value = '';
      if (filterCheckin) filterCheckin.value = '';
      if (filterCheckout) filterCheckout.value = '';

      currentSearch = { location: '', checkIn: '', checkOut: '', capacity: '', listingType: '' };
      activeLocation = 'all';
      activeTypeFilter = 'all';

      document.querySelectorAll('.loc-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.loc === 'all');
      });

      document.querySelectorAll('.type-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.type === 'all');
      });

      checkFilters();
      renderProperties(properties);
      showToast('Filters reset', 'info');
    });
  }

  // Sticky scroll watcher
  window.addEventListener('scroll', () => {
    if (!stickyEl || !stickyAnchor) return;
    const offset = stickyAnchor.offsetTop;
    const threshold = window.innerWidth <= 768 ? 160 : 260;

    if (window.scrollY > offset + threshold) {
      stickyEl.classList.add('is-sticky');
    } else {
      stickyEl.classList.remove('is-sticky');
    }
  });

  // Empty state reset button
  const emptyReset = document.getElementById('empty-reset-btn');
  if (emptyReset) {
    emptyReset.addEventListener('click', () => {
      if (resetBtn) resetBtn.click();
    });
  }
}

// ─── FILTERING LOGIC ──────────────────────────────────────────
function getFilteredProperties() {
  return properties.filter(p => {
    // Type filter (Sale vs Rent)
    if (activeTypeFilter !== 'all') {
      if (p.listingType !== activeTypeFilter) return false;
    }
    if (currentSearch.listingType) {
      if (p.listingType !== currentSearch.listingType) return false;
    }

    // Location filter from tabs or search select
    if (activeLocation !== 'all' && p.location.toLowerCase() !== activeLocation.toLowerCase()) {
      return false;
    }
    if (currentSearch.location && p.location.toLowerCase() !== currentSearch.location.toLowerCase()) {
      return false;
    }

    // Capacity / Bedrooms filter
    if (currentSearch.capacity) {
      const neededCap = parseInt(currentSearch.capacity, 10);
      const cap = p.listingType === 'sale' ? (p.bedrooms || p.guests || 2) : (p.guests || 2);
      if (cap < neededCap) {
        return false;
      }
    }

    return true;
  });
}

// ─── CAROUSEL & PROPERTY RENDERING ────────────────────────────
function setupCarousel() {
  // Intent Type tabs (All, For Sale, For Rent)
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTypeFilter = tab.dataset.type;

      // Sync sticky select
      const typeSelect = document.getElementById('listing_type');
      if (typeSelect) {
        typeSelect.value = activeTypeFilter === 'all' ? '' : activeTypeFilter;
        currentSearch.listingType = typeSelect.value;
      }

      carouselPosition = 0;
      updateCarouselTransform();
      renderProperties(getFilteredProperties());
    });
  });

  // Location tabs
  document.querySelectorAll('.loc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.loc-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeLocation = tab.dataset.loc;
      carouselPosition = 0;
      updateCarouselTransform();
      renderProperties(getFilteredProperties());
    });
  });

  // Next / Prev buttons
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      slideCarousel(-1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      slideCarousel(1);
    });
  }
}

function slideCarousel(direction) {
  const track = document.getElementById('properties-carousel-track');
  if (!track) return;

  const slides = track.querySelectorAll('.acf-card-slide');
  if (slides.length === 0) return;

  const slideWidth = slides[0].offsetWidth + 24;
  const maxSlides = slides.length;
  const visibleCount = window.innerWidth <= 768 ? 1 : (window.innerWidth <= 1024 ? 2 : 3);
  const maxPos = Math.max(0, maxSlides - visibleCount);

  carouselPosition = Math.max(0, Math.min(carouselPosition + direction, maxPos));
  updateCarouselTransform();
}

function updateCarouselTransform() {
  const track = document.getElementById('properties-carousel-track');
  if (!track) return;
  const slides = track.querySelectorAll('.acf-card-slide');
  if (slides.length === 0) return;

  const slideWidth = slides[0].offsetWidth + 24;
  track.style.transform = `translateX(-${carouselPosition * slideWidth}px)`;
}

function renderProperties(list) {
  const track = document.getElementById('properties-carousel-track');
  const emptyState = document.getElementById('empty-state');
  if (!track) return;

  if (list.length === 0) {
    track.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  track.innerHTML = list.map(p => {
    const isFav = favorites.includes(p.id);
    const imgUrl = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
    const isSale = p.listingType === 'sale';
    const rentUnit = p.rentType === 'month' ? 'month' : 'night';

    const sellerName = p.contactName || p.host || 'Verified Owner';
    const sellerPhone = p.contactPhone || '+263 77 210 0200';
    const waNumber = (p.contactWhatsapp || sellerPhone).replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hi ${sellerName}, I am inquiring about "${p.title}" on ACCOMMODATION CONNECT ZW.`);

    return `
      <div class="acf-card-slide">
        <div class="acf-card" data-id="${p.id}">
          <div class="acf-card-image">
            <img src="${imgUrl}" alt="${p.title}" loading="lazy">
            <span class="listing-badge ${isSale ? 'badge-sale' : 'badge-rent'}">
              ${isSale ? 'FOR SALE' : (p.rentType === 'month' ? 'FOR LEASE' : 'SHORT STAY')}
            </span>
            <button class="card-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${p.id}" aria-label="Save property" title="Save property">
              <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
          <div class="acf-card-content">
            <h3>${p.title}</h3>
            <p class="location">${p.location}</p>
            
            <div class="card-specs-row">
              <span class="card-spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18v10H3z"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
                ${p.bedrooms || 3} Beds
              </span>
              <span>·</span>
              <span class="card-spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M2 12h20"/></svg>
                ${p.bathrooms || 2} Baths
              </span>
              <span>·</span>
              <span class="card-spec-item">${p.standSize || (isSale ? '2,000 m²' : 'Stand')}</span>
            </div>

            <!-- Seller / Landlord Direct Contact Row -->
            <div class="card-seller-row">
              <div class="card-seller-info">
                <span class="card-seller-label">${isSale ? 'Direct Seller' : 'Verified Landlord'}</span>
                <span class="card-seller-name" title="${sellerName}">${sellerName}</span>
              </div>
              <div class="card-contact-btns">
                <a href="tel:${sellerPhone}" class="card-contact-btn call-btn" title="Call ${sellerName}" onclick="event.stopPropagation()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
                <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank" rel="noopener" class="card-contact-btn wa-btn" title="WhatsApp ${sellerName}" onclick="event.stopPropagation()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.08-1.1l-.29-.17-3.03.79.81-2.95-.19-.3a8.18 8.18 0 0 1-1.26-4.32c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19-.09-1.12-.55-1.3-.61-.17-.07-.3-.1-.43.1-.12.19-.48.61-.59.73-.11.12-.22.14-.41.05-.19-.09-.8-.3-1.53-.94-.56-.5-.94-1.12-1.05-1.31-.11-.19-.01-.29.08-.38.08-.09.19-.22.28-.33.09-.11.13-.19.19-.31.06-.13.03-.24-.02-.33-.04-.09-.43-1.03-.59-1.42-.15-.37-.31-.32-.43-.33-.11-.01-.24-.01-.36-.01-.13 0-.33.05-.5.24-.17.19-.66.65-.66 1.58s.68 1.83.77 1.96c.1.12 1.34 2.05 3.25 2.87.45.2.81.31 1.09.4.46.15.88.13 1.21.08.37-.05 1.12-.46 1.28-.9.16-.44.16-.82.11-.9-.05-.08-.18-.13-.37-.22z"/></svg>
                </a>
              </div>
            </div>

            <p class="price">
              ${fmtPrice(p.price)}
              ${isSale ? '<span class="price-type">Total Purchase</span>' : `<span class="price-type">/ ${rentUnit}</span>`}
            </p>
          </div>
          <button class="bookNowBtn view-listing-btn" data-detail-id="${p.id}">
            ${isSale ? 'View Sale &amp; Contacts' : 'View &amp; Book'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Bind view listing buttons
  track.querySelectorAll('.view-listing-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.detailId, 10);
      openPropertyDetail(id);
    });
  });

  // Bind favorite buttons
  track.querySelectorAll('.card-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.favId, 10);
      toggleFavorite(id);
    });
  });

  carouselPosition = 0;
  updateCarouselTransform();
}

function toggleFavorite(propertyId) {
  if (!currentUser) {
    showToast('Please sign in to save properties to your wishlist', 'info');
    openModal('auth-modal');
    return;
  }

  const added = ROJADB.toggleFavorite(currentUser.id, propertyId);
  favorites = ROJADB.getFavoritesForUser(currentUser.id);

  updateAuthUI();
  renderProperties(getFilteredProperties());

  if (added) {
    showToast('Saved to your wishlist', 'success');
  } else {
    showToast('Removed from your wishlist', 'info');
  }
}

// ─── TESTIMONIALS SLIDER (Exact Accommodation Connect) ────────
function setupTestimonials() {
  const testimonials = [
    {
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      thumb: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      text: "<q>I loved how easy it was to book and how quickly someone followed up to make sure everything was sorted. The personal touch sets them apart.</q><br><strong>— Aneesa K, Weekend Traveller</strong>"
    },
    {
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      text: "<q>Listing my property on Accommodation Connect ZW was seamless. Their team handled everything—from photos to guest communication—and I started earning within days. Best part? Real people I can call anytime.</q><br><strong>— Thandi M, Property Owner in Victoria Falls</strong>"
    },
    {
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      thumb: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
      text: "<q>The booking process was effortless, and I got instant confirmation. Check-in was smooth, and the personal service made me feel right at home.</q><br><strong>— Jason R, Guest from Johannesburg</strong>"
    }
  ];

  let activeIndex = 0;
  const mainImg = document.getElementById('main-testimonial-image');
  const quoteText = document.getElementById('testimonial-text');
  const thumbsContainer = document.getElementById('profile-thumbnails');
  const nextBtn = document.getElementById('next-testimonial-btn');

  if (!mainImg || !quoteText || !thumbsContainer) return;

  function renderTestimonial(idx) {
    activeIndex = (idx + testimonials.length) % testimonials.length;
    const current = testimonials[activeIndex];

    mainImg.style.opacity = '0';
    quoteText.style.opacity = '0';

    setTimeout(() => {
      mainImg.src = current.image;
      quoteText.innerHTML = current.text;
      mainImg.style.opacity = '1';
      quoteText.style.opacity = '1';
    }, 200);

    // Render other thumbnails
    thumbsContainer.innerHTML = testimonials
      .map((t, i) => {
        if (i === activeIndex) return '';
        return `<img src="${t.thumb}" alt="Reviewer" data-idx="${i}" class="thumb-item">`;
      })
      .join('');

    thumbsContainer.querySelectorAll('.thumb-item').forEach(thumb => {
      thumb.addEventListener('click', () => {
        renderTestimonial(parseInt(thumb.dataset.idx, 10));
      });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      renderTestimonial(activeIndex + 1);
    });
  }

  renderTestimonial(0);
}

// ─── TRENDING DESTINATIONS ────────────────────────────────────
function setupTrendingDestinations() {
  document.querySelectorAll('.trending-card').forEach(card => {
    card.addEventListener('click', () => {
      const dest = card.dataset.destination;
      if (!dest) return;

      activeLocation = dest;
      const locSelect = document.getElementById('location');
      if (locSelect) locSelect.value = dest;

      document.querySelectorAll('.loc-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.loc.toLowerCase() === dest.toLowerCase());
      });

      renderProperties(getFilteredProperties());

      const areasSection = document.getElementById('areas-to-book');
      if (areasSection) {
        areasSection.scrollIntoView({ behavior: 'smooth' });
      }

      showToast(`Showing properties in ${dest}`, 'info');
    });
  });
}

// ─── MODAL CONTROLLERS ────────────────────────────────────────
function setupModals() {
  // Generic close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) overlay.classList.remove('open');
    });
  });

  // Close modal when clicking on overlay background
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  // Nav: List your property triggers
  const navListProp = document.getElementById('nav-list-property');
  const startEarningBtn = document.getElementById('start-earning-btn');
  const dropdownHostBtn = document.getElementById('dropdown-host-btn');

  [navListProp, startEarningBtn, dropdownHostBtn].forEach(el => {
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('listing-modal');
      });
    }
  });

  // Nav: Contact triggers
  const navContact = document.getElementById('nav-contact');
  const dropdownEnquireBtn = document.getElementById('dropdown-enquire-btn');
  [navContact, dropdownEnquireBtn].forEach(el => {
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('enquiry-modal');
      });
    }
  });

  // Auth Modal tabs & login form
  const loginTab = document.getElementById('tab-login-btn');
  const signupTab = document.getElementById('tab-signup-btn');
  const nameGroup = document.getElementById('auth-name-group');
  const authSubmit = document.getElementById('auth-submit-btn');
  const authTitle = document.getElementById('auth-modal-title');
  const authForm = document.getElementById('auth-form');

  let authMode = 'login';

  if (loginTab && signupTab) {
    loginTab.addEventListener('click', () => {
      authMode = 'login';
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      if (nameGroup) nameGroup.style.display = 'none';
      if (authSubmit) authSubmit.textContent = 'Sign In';
      if (authTitle) authTitle.textContent = 'Sign In';
    });

    signupTab.addEventListener('click', () => {
      authMode = 'signup';
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      if (nameGroup) nameGroup.style.display = 'flex';
      if (authSubmit) authSubmit.textContent = 'Create Account';
      if (authTitle) authTitle.textContent = 'Register';
    });
  }

  // Open auth modal
  const dropdownLogin = document.getElementById('dropdown-login-btn');
  if (dropdownLogin) {
    dropdownLogin.addEventListener('click', () => {
      openModal('auth-modal');
    });
  }

  // Demo user logins
  const demoHost = document.getElementById('demo-landlord-btn');
  const demoGuest = document.getElementById('demo-tenant-btn');

  if (demoHost) {
    demoHost.addEventListener('click', async () => {
      try {
        currentUser = await ROJADB.verifyUser('landlord@roja.co.zw', 'password123');
        updateAuthUI();
        closeModal('auth-modal');
        showToast(`Signed in as Host: ${currentUser.name}`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  if (demoGuest) {
    demoGuest.addEventListener('click', async () => {
      try {
        currentUser = await ROJADB.verifyUser('tenant@roja.co.zw', 'password123');
        updateAuthUI();
        closeModal('auth-modal');
        showToast(`Signed in as Guest: ${currentUser.name}`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Auth form submit
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-password').value;

      try {
        if (authMode === 'login') {
          currentUser = await ROJADB.verifyUser(email, pass);
          showToast(`Welcome back, ${currentUser.name}!`, 'success');
        } else {
          const name = document.getElementById('auth-name').value;
          currentUser = await ROJADB.createUser({ name, email, password: pass, role: 'tenant' });
          showToast(`Account created! Welcome, ${currentUser.name}`, 'success');
        }
        updateAuthUI();
        closeModal('auth-modal');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('dropdown-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ROJADB.clearSession();
      currentUser = null;
      favorites = [];
      updateAuthUI();
      if (currentView === 'landlord') togglePerspective();
      showToast('Signed out successfully', 'info');
    });
  }

  // Add Property form: purpose selector & submit
  const addPropForm = document.getElementById('add-property-form');
  const purposeSelect = document.getElementById('prop-listing-purpose');
  const rentTypeGroup = document.getElementById('group-rent-type');
  const titleDeedsGroup = document.getElementById('group-title-deeds');
  const priceLabel = document.getElementById('label-prop-price');
  const priceInput = document.getElementById('prop-price');

  if (purposeSelect) {
    purposeSelect.addEventListener('change', () => {
      const isSale = purposeSelect.value === 'sale';
      if (rentTypeGroup) rentTypeGroup.style.display = isSale ? 'none' : 'block';
      if (titleDeedsGroup) titleDeedsGroup.style.display = isSale ? 'block' : 'none';
      if (priceLabel) priceLabel.textContent = isSale ? 'Total Asking Price (USD) *' : 'Rate (USD) *';
      if (priceInput) priceInput.placeholder = isSale ? '450000' : '180';
    });
  }

  if (addPropForm) {
    addPropForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const purpose = document.getElementById('prop-listing-purpose').value;
      const title = document.getElementById('prop-title').value;
      const location = document.getElementById('prop-location').value;
      const rentTypeEl = document.getElementById('prop-rent-type');
      const rentType = purpose === 'sale' ? 'sale' : (rentTypeEl ? rentTypeEl.value : 'night');
      const titleDeedsEl = document.getElementById('prop-title-deeds');
      const titleDeeds = titleDeedsEl ? titleDeedsEl.value : 'Clean Title Deeds';
      const price = parseFloat(document.getElementById('prop-price').value);
      const standSize = document.getElementById('prop-stand-size').value;
      const bedrooms = parseInt(document.getElementById('prop-bedrooms').value, 10) || 3;
      const bathrooms = parseInt(document.getElementById('prop-bathrooms').value, 10) || 2;
      const guests = parseInt(document.getElementById('prop-guests').value, 10) || 4;
      const contactName = document.getElementById('prop-contact-name').value;
      const sellerRole = document.getElementById('prop-seller-role').value;
      const contactPhone = document.getElementById('prop-contact-phone').value;
      const contactWhatsapp = document.getElementById('prop-contact-whatsapp').value;
      const contactEmail = document.getElementById('prop-contact-email').value;
      const imgUrl = document.getElementById('prop-image-url').value;
      const desc = document.getElementById('prop-description').value;

      try {
        const newP = ROJADB.addProperty({
          landlordId: currentUser ? currentUser.id : 1,
          hostName: contactName,
          title: title,
          description: desc,
          location: location,
          listingType: purpose,
          rentType: rentType,
          price: price,
          maxGuests: guests,
          bedrooms: bedrooms,
          bathrooms: bathrooms,
          standSize: standSize,
          titleDeeds: titleDeeds,
          contactName: contactName,
          contactPhone: contactPhone,
          contactWhatsapp: contactWhatsapp,
          contactEmail: contactEmail,
          sellerRole: sellerRole,
          images: imgUrl ? [imgUrl] : [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
          ],
          amenities: ['Wifi', 'Solar Power', 'Borehole Water', 'Car Parking']
        });

        properties = ROJADB.getProperties();
        renderProperties(getFilteredProperties());
        closeModal('listing-modal');
        addPropForm.reset();
        showToast(`Listing created: "${newP.title}" (${newP.listingType === 'sale' ? 'For Sale' : 'For Rent'}) is now live!`, 'success');

        if (currentView === 'landlord') renderHostDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Enquiry form submit
  const enquiryForm = document.getElementById('enquiry-form');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fn = document.getElementById('enquiry-first-name').value;
      showToast(`Thank you ${fn}! Our property and reservation team will contact you shortly.`, 'success');
      closeModal('enquiry-modal');
      enquiryForm.reset();
    });
  }

  // My Bookings modal trigger
  const dropdownBookings = document.getElementById('dropdown-bookings-btn');
  if (dropdownBookings) {
    dropdownBookings.addEventListener('click', () => {
      openBookingsModal();
    });
  }

  // Wishlist drawer close
  const closeWishlist = document.getElementById('close-wishlist-drawer');
  const wishlistOverlay = document.getElementById('wishlist-overlay');
  if (closeWishlist) closeWishlist.addEventListener('click', closeWishlistDrawer);
  if (wishlistOverlay) wishlistOverlay.addEventListener('click', closeWishlistDrawer);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// ─── PROPERTY DETAIL & BOOKING / VIEWING ENGINE ───────────────
function openPropertyDetail(propertyId) {
  const prop = ROJADB.getPropertyById(propertyId);
  if (!prop) return;
  currentDetailProperty = prop;

  const isSale = prop.listingType === 'sale';

  const modal = document.getElementById('detail-modal');
  const titleEl = document.getElementById('detail-title');
  const locEl = document.getElementById('detail-location');
  const metaEl = document.getElementById('detail-meta');
  const descEl = document.getElementById('detail-description');
  const imgEl = document.getElementById('detail-main-img');
  const amenitiesContainer = document.getElementById('detail-amenities');

  // Type badge in gallery
  const typeBadgeEl = document.getElementById('detail-type-badge');
  if (typeBadgeEl) {
    typeBadgeEl.textContent = isSale ? 'FOR SALE (TOTAL PURCHASE)' : (prop.rentType === 'month' ? 'FOR LEASE' : 'SHORT STAY');
    typeBadgeEl.className = `detail-badge-pill ${isSale ? 'badge-sale' : 'badge-rent'}`;
  }

  if (titleEl) titleEl.textContent = prop.title;
  if (locEl) locEl.textContent = prop.location;
  if (metaEl) {
    metaEl.textContent = isSale
      ? `${prop.bedrooms || 4} Beds · ${prop.bathrooms || 3} Baths · ${prop.standSize || '2,000 m²'} · ${prop.rating}★ verified listing`
      : `${prop.guests || 2} guests · ${prop.category} · ${prop.rating}★ (${prop.reviews} reviews)`;
  }
  if (descEl) descEl.textContent = prop.description;
  if (imgEl) imgEl.src = (prop.images && prop.images[0]) || '';

  // Specifications Bar
  const specBeds = document.getElementById('detail-spec-beds');
  const specBaths = document.getElementById('detail-spec-baths');
  const specStand = document.getElementById('detail-spec-stand');
  const specDeeds = document.getElementById('detail-spec-deeds');

  if (specBeds) specBeds.textContent = `${prop.bedrooms || 3} Beds`;
  if (specBaths) specBaths.textContent = `${prop.bathrooms || 2} Baths`;
  if (specStand) specStand.textContent = prop.standSize || (isSale ? '2,000 m² stand' : 'Private Stand');
  if (specDeeds) specDeeds.textContent = prop.titleDeeds || (isSale ? 'Clean Title Deeds Ready' : 'Verified Lease');

  // Seller / Landlord Contact Box
  const sellerAvatar = document.getElementById('detail-seller-avatar');
  const sellerNameEl = document.getElementById('detail-seller-name');
  const sellerRoleEl = document.getElementById('detail-seller-role');
  const sellerDeedsEl = document.getElementById('detail-seller-deeds');
  const callBtn = document.getElementById('detail-call-btn');
  const phoneText = document.getElementById('detail-phone-text');
  const waBtn = document.getElementById('detail-whatsapp-btn');
  const emailBtn = document.getElementById('detail-email-btn');

  const sellerName = prop.contactName || prop.host || 'Verified Lister';
  const sellerPhone = prop.contactPhone || '+263 77 210 0200';
  const waNumber = (prop.contactWhatsapp || sellerPhone).replace(/[^0-9]/g, '');
  const emailAddress = prop.contactEmail || 'info@accommodationconnect.co.zw';
  const waInquiryMsg = encodeURIComponent(`Hi ${sellerName}, I am inquiring about "${prop.title}" on ACCOMMODATION CONNECT ZW. Is it currently available?`);

  if (sellerAvatar) sellerAvatar.textContent = sellerName.slice(0, 2).toUpperCase();
  if (sellerNameEl) sellerNameEl.textContent = sellerName;
  if (sellerRoleEl) sellerRoleEl.textContent = prop.sellerRole || (isSale ? 'Direct Property Seller' : 'Verified Landlord');
  if (sellerDeedsEl) sellerDeedsEl.textContent = prop.titleDeeds || (isSale ? 'Clean Title Deeds' : 'Verified Listing');

  if (callBtn) callBtn.href = `tel:${sellerPhone}`;
  if (phoneText) phoneText.textContent = `Call: ${sellerPhone}`;
  if (waBtn) waBtn.href = `https://wa.me/${waNumber}?text=${waInquiryMsg}`;
  if (emailBtn) emailBtn.href = `mailto:${emailAddress}?subject=${encodeURIComponent('Inquiry: ' + prop.title)}`;

  // Amenities
  if (amenitiesContainer) {
    const list = prop.amenities || ['Solar Power', 'Borehole Water', 'Wifi', 'Car Parking'];
    amenitiesContainer.innerHTML = list.map(a => `
      <div class="amenity-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${a}</span>
      </div>
    `).join('');
  }

  // Sidebar widget toggling
  const rentalWidget = document.getElementById('rental-booking-widget');
  const saleWidget = document.getElementById('sale-inquiry-widget');

  if (isSale) {
    if (rentalWidget) rentalWidget.style.display = 'none';
    if (saleWidget) {
      saleWidget.style.display = 'flex';
      const salePriceEl = document.getElementById('sale-bw-price');
      const saleDeedsTag = document.getElementById('sale-deeds-tag');
      if (salePriceEl) salePriceEl.textContent = fmtPrice(prop.price);
      if (saleDeedsTag) saleDeedsTag.textContent = prop.titleDeeds || 'Clean Title Deeds Ready';

      const viewingDateInput = document.getElementById('viewing-date');
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      if (viewingDateInput) {
        viewingDateInput.min = tomorrow;
        viewingDateInput.value = tomorrow;
      }
    }
  } else {
    if (rentalWidget) rentalWidget.style.display = 'flex';
    if (saleWidget) saleWidget.style.display = 'none';

    const priceEl = document.getElementById('bw-price');
    const unitEl = document.getElementById('bw-unit');
    if (priceEl) priceEl.textContent = fmtPrice(prop.price);
    if (unitEl) unitEl.textContent = prop.rentType === 'month' ? '/ month' : '/ night';

    const bookCheckin = document.getElementById('book-checkin');
    const bookCheckout = document.getElementById('book-checkout');
    const bookGuests = document.getElementById('book-guests');

    const todayStr = new Date().toISOString().split('T')[0];
    if (bookCheckin) bookCheckin.min = todayStr;
    if (bookCheckout) bookCheckout.min = todayStr;

    if (bookCheckin && currentSearch.checkIn) bookCheckin.value = currentSearch.checkIn;
    if (bookCheckout && currentSearch.checkOut) bookCheckout.value = currentSearch.checkOut;
    if (bookGuests && currentSearch.capacity) bookGuests.value = currentSearch.capacity;

    updateBookingCalculation();
  }

  openModal('detail-modal');
}

function setupBookingEngine() {
  const ciInput = document.getElementById('book-checkin');
  const coInput = document.getElementById('book-checkout');
  const guestsSelect = document.getElementById('book-guests');
  const reserveBtn = document.getElementById('booking-submit-btn');

  if (ciInput) ciInput.addEventListener('change', updateBookingCalculation);
  if (coInput) coInput.addEventListener('change', updateBookingCalculation);
  if (guestsSelect) guestsSelect.addEventListener('change', updateBookingCalculation);

  if (reserveBtn) {
    reserveBtn.addEventListener('click', () => {
      executeBookingReservation();
    });
  }

  // Real estate private viewing request submission
  const viewingBtn = document.getElementById('viewing-submit-btn');
  if (viewingBtn) {
    viewingBtn.addEventListener('click', () => {
      if (!currentDetailProperty) return;
      const dateVal = document.getElementById('viewing-date').value;
      const nameVal = document.getElementById('viewing-buyer-name').value;
      const phoneVal = document.getElementById('viewing-buyer-phone').value;
      const financeVal = document.getElementById('viewing-finance').value;

      if (!nameVal || !phoneVal) {
        showToast('Please enter your full name and phone number', 'error');
        return;
      }

      try {
        const viewing = ROJADB.addViewingRequest({
          propertyId: currentDetailProperty.id,
          buyerName: nameVal,
          buyerPhone: phoneVal,
          preferredDate: dateVal,
          financeStatus: financeVal
        });

        closeModal('detail-modal');
        showToast(`Viewing request scheduled! Ref: ${viewing.reference}. The seller (${currentDetailProperty.contactName || currentDetailProperty.host}) has been notified.`, 'success');

        // Optional direct WhatsApp prompt
        const sellerName = currentDetailProperty.contactName || currentDetailProperty.host || 'Seller';
        const waNum = (currentDetailProperty.contactWhatsapp || currentDetailProperty.contactPhone || '263772100200').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(`Hi ${sellerName}, I have just booked a viewing for "${currentDetailProperty.title}" (Ref: ${viewing.reference}) for ${dateVal}. Name: ${nameVal}, Phone: ${phoneVal}.`);
        
        setTimeout(() => {
          if (confirm(`Would you like to open WhatsApp now to notify ${sellerName} directly?`)) {
            window.open(`https://wa.me/${waNum}?text=${waMsg}`, '_blank');
          }
        }, 600);

      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function updateBookingCalculation() {
  if (!currentDetailProperty) return;

  const ci = document.getElementById('book-checkin').value;
  const co = document.getElementById('book-checkout').value;
  const summaryBlock = document.getElementById('booking-price-summary');
  const nightsLabel = document.getElementById('summary-price-nights');
  const baseEl = document.getElementById('summary-price-base');
  const feeEl = document.getElementById('summary-price-fee');
  const totalEl = document.getElementById('summary-price-total');

  if (!ci || !co || co <= ci) {
    if (summaryBlock) summaryBlock.style.display = 'none';
    return;
  }

  const d1 = new Date(ci);
  const d2 = new Date(co);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

  const basePriceUSD = currentDetailProperty.price * nights;
  const serviceFeeUSD = 35;
  const totalUSD = basePriceUSD + serviceFeeUSD;

  if (summaryBlock) summaryBlock.style.display = 'flex';
  if (nightsLabel) nightsLabel.textContent = `${fmtPrice(currentDetailProperty.price)} x ${nights} nights`;
  if (baseEl) baseEl.textContent = fmtPrice(basePriceUSD);
  if (feeEl) feeEl.textContent = fmtPrice(serviceFeeUSD);
  if (totalEl) totalEl.textContent = fmtPrice(totalUSD);
}

function executeBookingReservation() {
  if (!currentDetailProperty) return;

  const ci = document.getElementById('book-checkin').value;
  const co = document.getElementById('book-checkout').value;
  const guests = parseInt(document.getElementById('book-guests').value, 10) || 1;

  if (!ci || !co) {
    showToast('Please select valid check-in and check-out dates', 'error');
    return;
  }
  if (co <= ci) {
    showToast('Check-out must be after check-in', 'error');
    return;
  }

  const d1 = new Date(ci);
  const d2 = new Date(co);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

  const baseAmount = currentDetailProperty.price * nights;
  const serviceFee = 35;
  const totalAmount = baseAmount + serviceFee;

  const tenantId = currentUser ? currentUser.id : 2;
  const tenantName = currentUser ? currentUser.name : 'Farai Sibanda';

  try {
    const booking = ROJADB.addBooking({
      propertyId: currentDetailProperty.id,
      tenantId: tenantId,
      tenantName: tenantName,
      checkIn: ci,
      checkOut: co,
      durationText: `${nights} nights`,
      guestsCount: guests,
      baseAmount: baseAmount,
      serviceFee: serviceFee,
      totalAmount: totalAmount
    });

    closeModal('detail-modal');
    showToast(`Reservation Confirmed! Reference: ${booking.reference}`, 'success');

    if (currentView === 'landlord') renderHostDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── BOOKINGS MANAGEMENT MODAL ────────────────────────────────
function openBookingsModal() {
  if (!currentUser) {
    showToast('Please sign in to view your bookings', 'info');
    openModal('auth-modal');
    return;
  }

  const listEl = document.getElementById('tenant-bookings-list');
  if (!listEl) return;

  const bookings = ROJADB.getBookingsByTenant(currentUser.id);

  if (bookings.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--ac-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">No reservations found.</p>
        <p style="font-size: 0.9rem;">Book a stay in any of our verified luxury locations!</p>
      </div>
    `;
  } else {
    listEl.innerHTML = bookings.map(b => {
      const p = b.property || {};
      const statusColor = b.status === 'confirmed' ? '#2E7D32' : '#D32F2F';

      return `
        <div style="background: var(--ac-bg-section); border: 1px solid var(--ac-border); border-radius: 8px; padding: 18px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <strong style="font-size: 1.05rem; color: var(--ac-charcoal);">${p.title || 'Accommodation Booking'}</strong>
            <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: ${statusColor};">${b.status}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--ac-muted); margin-bottom: 8px;">Ref: <strong>${b.reference}</strong> · ${p.location || 'Zimbabwe'}</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 12px;">
            <span>Dates: <strong>${b.checkIn}</strong> to <strong>${b.checkOut}</strong></span>
            <span>Total: <strong>${fmtPrice(b.totalAmount)}</strong></span>
          </div>
          ${b.status === 'confirmed' ? `
            <button class="cancel-booking-btn" data-booking-id="${b.id}" style="font-size: 0.8rem; color: #D32F2F; font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer;">
              Cancel Reservation
            </button>
          ` : ''}
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.cancel-booking-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.bookingId, 10);
        if (confirm('Are you sure you want to cancel this reservation?')) {
          ROJADB.cancelBooking(id, currentUser.id);
          openBookingsModal();
          showToast('Reservation cancelled', 'info');
        }
      });
    });
  }

  openModal('bookings-modal');
}

// ─── WISHLIST DRAWER ──────────────────────────────────────────
function openWishlistDrawer() {
  const drawer = document.getElementById('wishlist-drawer');
  const overlay = document.getElementById('wishlist-overlay');
  const listEl = document.getElementById('wishlist-list');

  if (!drawer || !overlay || !listEl) return;

  const savedIds = currentUser ? ROJADB.getFavoritesForUser(currentUser.id) : [];
  const savedProps = properties.filter(p => savedIds.includes(p.id));

  if (savedProps.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--ac-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 6px;">No saved properties</p>
        <p style="font-size: 0.88rem;">Click the heart icon on any property to save it here!</p>
      </div>
    `;
  } else {
    listEl.innerHTML = savedProps.map(p => `
      <div style="display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--ac-border);">
        <img src="${(p.images && p.images[0]) || ''}" alt="${p.title}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px;">
        <div style="flex: 1;">
          <h4 style="font-size: 0.95rem; margin-bottom: 2px;">${p.title}</h4>
          <p style="font-size: 0.8rem; color: var(--ac-muted); margin-bottom: 6px;">${p.location} · ${fmtPrice(p.price)}/night</p>
          <button class="view-fav-btn" data-id="${p.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--ac-primary); text-transform: uppercase;">View Listing →</button>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.view-fav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        closeWishlistDrawer();
        openPropertyDetail(id);
      });
    });
  }

  drawer.classList.add('open');
  overlay.classList.add('open');
}

function closeWishlistDrawer() {
  const drawer = document.getElementById('wishlist-drawer');
  const overlay = document.getElementById('wishlist-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ─── HOST DASHBOARD CONTROLLER ────────────────────────────────
function setupHostDashboard() {
  const openListingBtn = document.getElementById('open-listing-modal-btn');
  if (openListingBtn) {
    openListingBtn.addEventListener('click', () => {
      openModal('listing-modal');
    });
  }
}

function renderHostDashboard() {
  const landlordId = currentUser ? currentUser.id : 1;
  const hostProps = ROJADB.getPropertiesByLandlord(landlordId);
  const hostBookings = ROJADB.getBookingsByLandlord(landlordId);

  // Stats
  const revenueStat = document.getElementById('landlord-revenue-stat');
  const bookingsStat = document.getElementById('landlord-bookings-stat');
  const activeCountStat = document.getElementById('active-listings-count');

  const totalRev = hostBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  if (revenueStat) revenueStat.textContent = fmtPrice(totalRev);
  if (bookingsStat) bookingsStat.textContent = hostBookings.length;
  if (activeCountStat) activeCountStat.textContent = hostProps.length;

  // Render Host Properties
  const container = document.getElementById('landlord-properties-container');
  if (container) {
    if (hostProps.length === 0) {
      container.innerHTML = `<p style="color: var(--ac-muted); padding: 20px 0;">You have no active listings yet. Click "List New Property" to add your first!</p>`;
    } else {
      container.innerHTML = hostProps.map(p => {
        const isSale = p.listingType === 'sale';
        const priceLabel = isSale ? `${fmtPrice(p.price)} <span style="font-size: 0.82rem; font-weight: normal; color: var(--ac-muted);">(Total Purchase)</span>` : `${fmtPrice(p.price)} / ${p.rentType === 'month' ? 'month' : 'night'}`;
        const specsText = isSale ? `${p.bedrooms || 3} Beds · ${p.bathrooms || 2} Baths · ${p.standSize || 'Stand'}` : `Max Capacity: ${p.guests || 2}`;
        return `
        <div class="acf-card-slide" style="flex: 0 0 calc(33.333% - 16px); margin-bottom: 24px;">
          <div class="acf-card">
            <div class="acf-card-image">
              <img src="${(p.images && p.images[0]) || ''}" alt="${p.title}">
              <span class="listing-badge ${isSale ? 'badge-sale' : 'badge-rent'}">
                ${isSale ? 'FOR SALE' : (p.rentType === 'month' ? 'FOR LEASE' : 'SHORT STAY')}
              </span>
            </div>
            <div class="acf-card-content">
              <h3>${p.title}</h3>
              <p class="location">${p.location}</p>
              <p class="maxCapacity">${specsText}</p>
              <p class="price">${priceLabel}</p>
            </div>
            <button class="bookNowBtn" onclick="openPropertyDetail(${p.id})">View Listing &amp; Details</button>
          </div>
        </div>
      `;
      }).join('');
    }
  }

  // Render Host Bookings Table
  const tableBody = document.getElementById('landlord-bookings-container');
  if (tableBody) {
    if (hostBookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="padding: 24px; text-align: center; color: var(--ac-muted);">No bookings received yet.</td></tr>`;
    } else {
      tableBody.innerHTML = hostBookings.map(b => {
        const p = b.property || {};
        const statusColor = b.status === 'confirmed' ? '#2E7D32' : '#D32F2F';

        return `
          <tr style="border-bottom: 1px solid var(--ac-border);">
            <td style="padding: 14px 18px; font-weight: 700;">${b.reference}</td>
            <td style="padding: 14px 18px;">${p.title || 'Property #' + b.propertyId}</td>
            <td style="padding: 14px 18px;">${b.tenantName}</td>
            <td style="padding: 14px 18px;">${b.checkIn}</td>
            <td style="padding: 14px 18px;">${b.checkOut}</td>
            <td style="padding: 14px 18px; font-weight: 700;">${fmtPrice(b.totalAmount)}</td>
            <td style="padding: 14px 18px; color: ${statusColor}; font-weight: 700; text-transform: uppercase;">${b.status}</td>
          </tr>
        `;
      }).join('');
    }
  }
}
