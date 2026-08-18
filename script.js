// ==========================================
// ROJA Zimbabwe Rental Marketplace - JS Logic
// ==========================================

// --- Initial Dummy Property JSON Data (Zimbabwean Localized) ---
let properties = ROJADB.getProperties();

// --- State Variables ---
let currentUser = null; // Stores login status: { name, email, role }
let currentView = "tenant"; // "tenant" or "landlord"
let favorites = []; // Array of saved property IDs
let uploadedPictures = []; // Temp storage for newly added listing pictures (dataURLs)
let activeFilterCategory = "suburban";

// --- DOM Elements ---
const switchBtn = document.getElementById("switch-perspective-btn");
const tenantView = document.getElementById("tenant-view");
const landlordView = document.getElementById("landlord-view");
const propertiesContainer = document.getElementById("properties-container");
const landlordPropertiesContainer = document.getElementById("landlord-properties-container");
const userMenuTrigger = document.getElementById("user-menu-trigger");
const userDropdownMenu = document.getElementById("user-dropdown-menu");
const logoBtn = document.getElementById("logo-btn");

// Modals & Forms
const authModal = document.getElementById("auth-modal");
const listingModal = document.getElementById("listing-modal");
const detailModal = document.getElementById("detail-modal");

const openListingBtn = document.getElementById("open-listing-modal-btn");
const closeAuthBtn = document.getElementById("close-auth-btn");
const closeListingBtn = document.getElementById("close-listing-btn");
const closeDetailBtn = document.getElementById("close-detail-btn");

const dropdownLoginBtn = document.getElementById("dropdown-login-btn");
const dropdownHostBtn = document.getElementById("dropdown-host-btn");
const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");

// Auth Tabs and Fields
const tabLogin = document.getElementById("tab-login-btn");
const tabSignup = document.getElementById("tab-signup-btn");
const authForm = document.getElementById("auth-form");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authNameGroup = document.getElementById("auth-name-group");
const authRoleGroup = document.getElementById("auth-role-group");
const authNameInput = document.getElementById("auth-name");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");

// Property Listing Fields & Drag-drop
const addPropertyForm = document.getElementById("add-property-form");
const uploadZone = document.getElementById("upload-zone");
const fileInput = document.getElementById("prop-file-input");
const previewContainer = document.getElementById("upload-preview-container");

// Category filter bar
const categoryTabs = document.querySelectorAll(".category-tab");

// Booking Widget
const bookingForm = document.getElementById("booking-form");
const checkinInput = document.getElementById("book-checkin");
const checkoutInput = document.getElementById("book-checkout");
const guestsSelect = document.getElementById("book-guests");
const bookingPriceSummary = document.getElementById("booking-price-summary");
const bookingNightsText = document.getElementById("summary-price-nights");
const bookingNightsBase = document.getElementById("summary-price-base");
const bookingNightsDepositRow = document.getElementById("summary-deposit-row");
const bookingNightsDeposit = document.getElementById("summary-price-deposit");
const bookingNightsFee = document.getElementById("summary-price-fee");
const bookingNightsTotal = document.getElementById("summary-price-total");
let currentDetailedPropertyId = null;

// ==========================================
// 1. Perspective Toggles (Tenant / Landlord)
// ==========================================
function switchPerspective(targetView) {
  if (targetView === "landlord") {
    currentView = "landlord";
    switchBtn.textContent = "Switch to Renting";
    tenantView.classList.remove("active");
    landlordView.classList.add("active");
    renderLandlordDashboard();
  } else {
    currentView = "tenant";
    switchBtn.textContent = "Switch to Hosting";
    landlordView.classList.remove("active");
    tenantView.classList.add("active");
    renderProperties();
  }
  userDropdownMenu.classList.remove("active");
}

switchBtn.addEventListener("click", () => {
  if (currentView === "tenant") {
    if (!currentUser) {
      showToast("Please log in or sign up first!", "error");
      openModal(authModal);
      switchToAuthTab("signup");
      const landlordRadio = document.querySelector('input[name="auth-role"][value="landlord"]');
      if (landlordRadio) landlordRadio.checked = true;
    } else if (currentUser.role !== "landlord") {
      currentUser.role = "landlord";
      showToast("Upgraded profile to Landlord! Welcome to Hosting.", "success");
      switchPerspective("landlord");
    } else {
      switchPerspective("landlord");
    }
  } else {
    switchPerspective("tenant");
  }
});

logoBtn.addEventListener("click", (e) => {
  e.preventDefault();
  switchPerspective("tenant");
});

// ==========================================
// 2. Auth Modal & Session Simulation
// ==========================================
let authTabState = "login"; // "login" or "signup"

function openModal(modal) {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.classList.remove("active");
  document.body.style.overflow = "";
  if (modal === authModal) {
    authForm.reset();
  } else if (modal === listingModal) {
    addPropertyForm.reset();
    previewContainer.innerHTML = "";
    uploadedPictures = [];
  }
}

function switchToAuthTab(tab) {
  authTabState = tab;
  if (tab === "login") {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    authNameGroup.style.display = "none";
    authRoleGroup.style.display = "none";
    authSubmitBtn.textContent = "Log In";
    authNameInput.removeAttribute("required");
  } else {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    authNameGroup.style.display = "flex";
    authRoleGroup.style.display = "flex";
    authSubmitBtn.textContent = "Create Account";
    authNameInput.setAttribute("required", "");
  }
}

tabLogin.addEventListener("click", () => switchToAuthTab("login"));
tabSignup.addEventListener("click", () => switchToAuthTab("signup"));

dropdownLoginBtn.addEventListener("click", () => {
  switchToAuthTab("login");
  openModal(authModal);
  userDropdownMenu.classList.remove("active");
});

closeAuthBtn.addEventListener("click", () => closeModal(authModal));
closeListingBtn.addEventListener("click", () => closeModal(listingModal));
closeDetailBtn.addEventListener("click", () => closeModal(detailModal));

// Handles Outside Clicks for Modals & Dropdown
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    closeModal(e.target);
  }
});

userMenuTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  userDropdownMenu.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!userMenuTrigger.contains(e.target) && !userDropdownMenu.contains(e.target)) {
    userDropdownMenu.classList.remove("active");
  }
});

// Dropdown Dashboard shortcuts
dropdownHostBtn.addEventListener("click", () => {
  userDropdownMenu.classList.remove("active");
  if (!currentUser) {
    switchToAuthTab("signup");
    const landlordRadio = document.querySelector('input[name="auth-role"][value="landlord"]');
    if (landlordRadio) landlordRadio.checked = true;
    openModal(authModal);
  } else {
    switchPerspective("landlord");
    openModal(listingModal);
  }
});

// Sign-In/Sign-Up Form Submission
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const email = authEmailInput.value.trim();
  const name = authNameState() ? authNameInput.value.trim() : email.split("@")[0];
  const role = authTabState === "signup" ? document.querySelector('input[name="auth-role"]:checked').value : "tenant";
  
  currentUser = {
    name: name,
    email: email,
    role: role
  };
  
  showToast(`Welcome back, ${name}! Logged in as ${role === "tenant" ? "Tenant" : "Landlord"}.`, "success");
  closeModal(authModal);
  
  dropdownLoginBtn.style.display = "none";
  dropdownLogoutBtn.style.display = "block";
  document.querySelector(".user-avatar").innerHTML = `<span style="font-weight: 700; color: white;">${name.slice(0, 2).toUpperCase()}</span>`;
  document.querySelector(".user-avatar").style.backgroundColor = "var(--primary)";
  
  if (role === "landlord") {
    switchPerspective("landlord");
  } else {
    switchPerspective("tenant");
  }
});

function authNameState() {
  return authTabState === "signup";
}

// Log Out Handler
dropdownLogoutBtn.addEventListener("click", () => {
  currentUser = null;
  showToast("Logged out successfully.", "success");
  userDropdownMenu.classList.remove("active");
  
  dropdownLoginBtn.style.display = "block";
  dropdownLogoutBtn.style.display = "none";
  document.querySelector(".user-avatar").innerHTML = `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
      <path d="M16 14c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5zm0 2c-4.4 0-13 2.2-13 6.6V26c0 1.1.9 2 2 2h22c1.1 0 2-.9 2-2v-3.4c0-4.4-8.6-6.6-13-6.6z"/>
    </svg>`;
  document.querySelector(".user-avatar").style.backgroundColor = "var(--text-muted)";
  
  switchPerspective("tenant");
});

// ==========================================
// 3. Filtering & Rendering Properties (Tenant)
// ==========================================
function renderProperties(filteredList = null) {
  propertiesContainer.innerHTML = "";
  
  const list = filteredList || properties.filter(p => p.category === activeFilterCategory);
  
  if (list.length === 0) {
    propertiesContainer.innerHTML = `
      <div class="no-results">
        <svg viewBox="0 0 32 32" width="64" height="64">
          <path d="M16,2.3L2,14.6l1.3,1.5L5,14.6V28c0,1.1,.9,2,2,2h6v-8h6v8h6c1.1,0,2-.9,2-2V14.6l1.7,1.5,1.3-1.5L16,2.3z M25,26h-4v-8H11v8H7V12.8l9-7.9,9,7.9V26z" />
        </svg>
        <h3>No Listings Found</h3>
        <p>Try modifying your location search, duration terms, or selecting a different tab.</p>
        <button class="btn-secondary" id="reset-search-btn" style="margin-top: 8px;">Reset Filters</button>
      </div>
    `;
    
    document.getElementById("reset-search-btn").addEventListener("click", () => {
      document.getElementById("search-form").reset();
      activeFilterCategory = "suburban";
      categoryTabs.forEach(t => t.classList.remove("active"));
      document.querySelector('[data-category="suburban"]').classList.add("active");
      renderProperties();
    });
    return;
  }
  
  list.forEach(property => {
    const isFav = favorites.includes(property.id) ? "active" : "";
    const card = document.createElement("div");
    card.className = "property-card";
    card.setAttribute("data-id", property.id);
    
    const unitLabel = property.rentType === "month" ? "month" : "night";
    
    card.innerHTML = `
      <div class="property-img-wrapper">
        <img src="${property.images[0]}" alt="${property.title}" loading="lazy">
        <button class="fav-btn ${isFav}" aria-label="Favorite">
          <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
            <path d="M16,28.2c-0.3,0-0.5-0.1-0.7-0.3C8.4,21.8,4,17.4,4,12.5C4,7.8,7.8,4,12.5,4c2.8,0,5.3,1.4,6.8,3.7 C20.7,5.4,23.2,4,26,4C30.7,4,34.5,7.8,34.5,12.5c0,4.9-4.4,9.3-11.3,15.4C22.5,28.1,22.3,28.2,22,28.2L16,28.2z"/>
          </svg>
        </button>
      </div>
      <div class="property-info">
        <div class="property-meta">
          <span class="property-location">${property.location}, Zimbabwe</span>
          <span class="property-rating">
            <svg viewBox="0 0 32 32" width="12" height="12"><path d="M16 2l4.85 9.83L31.7 13.3l-8 7.8 1.88 10.9L16 26.85 6.42 32l1.88-10.9-8-7.8 10.85-1.47z"/></svg>
            ${property.rating.toFixed(2)}
          </span>
        </div>
        <div class="property-title">${property.title}</div>
        <div class="property-price"><span>$${property.price}</span> / ${unitLabel}</div>
      </div>
    `;
    
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;
      openDetailModal(property.id);
    });
    
    const favBtn = card.querySelector(".fav-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(property.id, favBtn);
    });
    
    propertiesContainer.appendChild(card);
  });
}

function toggleFavorite(id, btn) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
    btn.classList.add("active");
    showToast("Added listing to your favorites collection! ❤️", "success");
  } else {
    favorites.splice(index, 1);
    btn.classList.remove("active");
    showToast("Removed listing from favorites.", "success");
  }
}

// Category tabs filters listener
categoryTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    categoryTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilterCategory = tab.getAttribute("data-category");
    document.getElementById("search-form").reset();
    renderProperties();
  });
});

// Search functionality with Stay vs. Lease term checks
document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const locationQuery = document.getElementById("search-location").value.trim().toLowerCase();
  const termQuery = document.getElementById("search-term").value; // "any", "short", "long"
  const guestsVal = parseInt(document.getElementById("search-guests").value);
  
  const filtered = properties.filter(prop => {
    // Location match
    const matchLocation = !locationQuery || 
                          prop.location.toLowerCase().includes(locationQuery) || 
                          prop.title.toLowerCase().includes(locationQuery);
    
    // Duration term match
    let matchTerm = true;
    if (termQuery === "short") {
      matchTerm = prop.rentType === "night";
    } else if (termQuery === "long") {
      matchTerm = prop.rentType === "month";
    }
    
    // Occupants match
    const matchGuests = prop.guests >= guestsVal;
    
    return matchLocation && matchTerm && matchGuests;
  });
  
  categoryTabs.forEach(t => t.classList.remove("active"));
  
  renderProperties(filtered);
  showToast(`Found ${filtered.length} property match${filtered.length === 1 ? '' : 'es'} in Zimbabwe.`, "success");
});

document.getElementById("mini-search-btn").addEventListener("click", () => {
  switchPerspective("tenant");
  document.getElementById("search-location").focus();
  showToast("Specify location or term type in the search bar below.", "success");
});

// ==========================================
// 4. Landlord Hosting Dashboard Logic
// ==========================================
function renderLandlordDashboard() {
  landlordPropertiesContainer.innerHTML = "";
  
  const landlordList = properties;
  document.getElementById("active-listings-count").textContent = landlordList.length;
  
  landlordList.forEach(property => {
    const card = document.createElement("div");
    card.className = "property-card";
    card.setAttribute("data-id", property.id);
    
    const unitLabel = property.rentType === "month" ? "month" : "night";
    
    card.innerHTML = `
      <div class="property-img-wrapper">
        <img src="${property.images[0]}" alt="${property.title}">
      </div>
      <div class="property-info">
        <div class="property-meta">
          <span class="property-location">${property.location}, Zimbabwe</span>
          <span class="property-rating">
            <svg viewBox="0 0 32 32" width="12" height="12"><path d="M16 2l4.85 9.83L31.7 13.3l-8 7.8 1.88 10.9L16 26.85 6.42 32l1.88-10.9-8-7.8 10.85-1.47z"/></svg>
            ${property.rating.toFixed(2)}
          </span>
        </div>
        <div class="property-title">${property.title}</div>
        <div class="property-price"><span>$${property.price}</span> / ${unitLabel}</div>
      </div>
    `;
    
    card.addEventListener("click", () => openDetailModal(property.id));
    landlordPropertiesContainer.appendChild(card);
  });
}

openListingBtn.addEventListener("click", () => {
  if (!currentUser) {
    switchToAuthTab("signup");
    const landlordRadio = document.querySelector('input[name="auth-role"][value="landlord"]');
    if (landlordRadio) landlordRadio.checked = true;
    openModal(authModal);
    showToast("Please sign up as a landlord to list properties.", "error");
  } else {
    openModal(listingModal);
  }
});

// Drag and drop & File Upload triggers
uploadZone.addEventListener("click", () => fileInput.click());

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("dragover");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  handleUploadedFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", () => {
  handleUploadedFiles(fileInput.files);
});

function handleUploadedFiles(files) {
  if (files.length === 0) return;
  
  Array.from(files).forEach(file => {
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are allowed!", "error");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataURL = event.target.result;
      uploadedPictures.push(dataURL);
      
      const previewWrapper = document.createElement("div");
      previewWrapper.className = "preview-wrapper";
      previewWrapper.innerHTML = `
        <img src="${dataURL}" alt="Preview thumbnail">
        <button type="button" class="remove-preview-btn">×</button>
      `;
      
      previewWrapper.querySelector(".remove-preview-btn").addEventListener("click", () => {
        const index = uploadedPictures.indexOf(dataURL);
        if (index > -1) uploadedPictures.splice(index, 1);
        previewWrapper.remove();
      });
      
      previewContainer.appendChild(previewWrapper);
    };
    reader.readAsDataURL(file);
  });
  
  showToast("Image loaded preview successfully! 📸", "success");
}

// Add New Property Listing Form Submit (Zimbabwean options)
addPropertyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const title = document.getElementById("prop-title").value.trim();
  const description = document.getElementById("prop-description").value.trim();
  const location = document.getElementById("prop-location").value;
  const category = document.getElementById("prop-category").value;
  const rentType = document.getElementById("prop-rent-type").value; // "night" or "month"
  const price = parseFloat(document.getElementById("prop-price").value);
  const guests = parseInt(document.getElementById("prop-guests").value);
  
  const checkedCheckboxes = document.querySelectorAll('input[name="amenity"]:checked');
  const selectedAmenities = Array.from(checkedCheckboxes).map(cb => cb.value);
  
  // Custom fallback image lists
  const fallbackImages = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
  ];
  
  const finalImages = uploadedPictures.length > 0 ? uploadedPictures : fallbackImages;
  
  const newProperty = {
    id: properties.length + 1,
    title: title,
    description: description,
    location: location,
    category: category,
    rentType: rentType,
    price: price,
    rating: 5.0,
    reviews: 0,
    host: currentUser ? currentUser.name : "Local Host",
    hostInitials: currentUser ? currentUser.name.slice(0, 2).toUpperCase() : "LH",
    guests: guests,
    images: finalImages,
    amenities: selectedAmenities
  };
  
  properties.unshift(newProperty);
  showToast(`Property listed in ${location} successfully! 🏠`, "success");
  closeModal(listingModal);
  
  activeFilterCategory = category;
  categoryTabs.forEach(t => {
    if (t.getAttribute("data-category") === category) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });
  
  if (currentView === "landlord") {
    renderLandlordDashboard();
  } else {
    renderProperties();
  }
});

// ==========================================
// 5. Property Detail Modal & Live Calculator
// ==========================================
function openDetailModal(id) {
  const property = properties.find(p => p.id === id);
  if (!property) return;
  
  currentDetailedPropertyId = id;
  
  // Set modal text
  document.getElementById("detail-title").textContent = property.title;
  document.getElementById("detail-rating-label").textContent = `${property.rating.toFixed(2)} (${property.reviews} review${property.reviews === 1 ? '' : 's'})`;
  document.getElementById("detail-location-label").textContent = `${property.location}, Zimbabwe`;
  document.getElementById("detail-description-text").textContent = property.description;
  document.getElementById("detail-host-name").textContent = `Hosted by ${property.host}`;
  document.getElementById("detail-host-avatar").textContent = property.hostInitials;
  
  // Set booking widget unit details based on stays vs monthly leases
  document.getElementById("booking-card-price").textContent = property.price;
  const unitLabel = property.rentType === "month" ? "/ month" : "/ night";
  document.getElementById("booking-card-unit").textContent = unitLabel;
  document.getElementById("booking-card-rating").textContent = property.rating.toFixed(2);
  
  // Toggle Date pickers labels based on stays vs monthly leases
  if (property.rentType === "month") {
    document.getElementById("book-date-in-label").textContent = "Move-in Date";
    document.getElementById("book-date-out-label").textContent = "Move-out Date";
    document.getElementById("book-guests-label").textContent = "Occupants";
    document.getElementById("booking-widget-submit-btn").textContent = "Request Lease";
  } else {
    document.getElementById("book-date-in-label").textContent = "Check-in Date";
    document.getElementById("book-date-out-label").textContent = "Check-out Date";
    document.getElementById("book-guests-label").textContent = "Guests";
    document.getElementById("booking-widget-submit-btn").textContent = "Reserve Stay";
  }
  
  // Images
  document.getElementById("detail-img-main").src = property.images[0];
  document.getElementById("detail-img-side-1").src = property.images[1] || property.images[0];
  document.getElementById("detail-img-side-2").src = property.images[2] || property.images[0];
  
  // Amenities list
  const amenitiesListContainer = document.getElementById("detail-amenities-list");
  amenitiesListContainer.innerHTML = "";
  
  const amenitySVGs = {
    "Solar Power": '<svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 2l3.4 9.8h10.6l-8.6 6.3 3.3 9.9-8.7-6.3-8.7 6.3 3.3-9.9-8.6-6.3h10.6z"/></svg>',
    "Borehole Water": '<svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 2C8.3 2 2 8.3 2 16c0 5 2.6 9.3 6.6 11.8l1.4-1.4C6.5 24.3 4 20.4 4 16c0-6.6 5.4-12 12-12s12 5.4 12 12c0 4.4-2.5 8.3-6 10.4l1.4 1.4c4-2.5 6.6-6.8 6.6-11.8 0-7.7-6.3-14-14-14z"/></svg>',
    "Wifi": '<svg viewBox="0 0 32 32" width="20" height="20"><path d="M16,4C10.5,4,5.4,6.2,1.7,9.9l1.4,1.4C6.4,8,11,6,16,6s9.6,2,12.9,5.3l1.4-1.4C26.6,6.2,21.5,4,16,4z M16,10c-3.9,0-7.5,1.5-10.2,4.2l1.4,1.4c2.3-2.3,5.4-3.6,8.8-3.6s6.5,1.3,8.8,3.6l1.4-1.4C23.5,11.5,19.9,10,16,10z"/></svg>',
    "Kitchen": '<svg viewBox="0 0 32 32" width="20" height="20"><path d="M12,2h-2v4H6c-1.1,0-2,.9-2,2v20c0,1.1,.9,2,2,2h20c1.1,0,2-.9,2-2V8c0-1.1-.9-2-2-2h-4V2h-2v4H12V2z M26,28H6V8h20V28z"/></svg>',
    "Security System": '<svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 2L4 7v10c0 5.5 5.1 10.7 12 13 6.9-2.3 12-7.5 12-13V7L16 2zm10 15c0 4.4-3.9 8.6-10 10.7-6.1-2.1-10-6.3-10-10.7V8.6l10-4.2 10 4.2V17z"/></svg>',
    "Car Parking": '<svg viewBox="0 0 32 32" width="20" height="20"><path d="M22,12H10v8h12v-8z M24,8c1.1,0,2,.9,2,2v12c0,1.1-.9,2-2,2H8c-1.1,0-2-.9-2-2V10c0-1.1,.9-2,2-2H24z"/></svg>'
  };
  
  if (property.amenities.length === 0) {
    amenitiesListContainer.innerHTML = '<span style="color: var(--text-muted);">Standard essentials included.</span>';
  } else {
    property.amenities.forEach(amenity => {
      const item = document.createElement("div");
      item.className = "amenity-item";
      const icon = amenitySVGs[amenity] || '<svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm1 20h-2v-2h2zm0-4h-2V10h2z"/></svg>';
      
      item.innerHTML = `
        ${icon}
        <span>${amenity}</span>
      `;
      amenitiesListContainer.appendChild(item);
    });
  }
  
  // Reset widget calculator
  bookingForm.reset();
  bookingPriceSummary.style.display = "none";
  
  openModal(detailModal);
}

// Pricing / Lease Cost Estimator
function calculateCost() {
  const property = properties.find(p => p.id === currentDetailedPropertyId);
  if (!property) return;
  
  const checkinVal = checkinInput.value;
  const checkoutVal = checkoutInput.value;
  
  if (checkinVal && checkoutVal) {
    const checkin = new Date(checkinVal);
    const checkout = new Date(checkoutVal);
    const timeDiff = checkout.getTime() - checkin.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (days <= 0) {
      bookingPriceSummary.style.display = "none";
      showToast("End date must occur after the start date.", "error");
      return;
    }
    
    let basePrice = 0;
    let fee = 50; // Flat fee
    let total = 0;
    
    if (property.rentType === "month") {
      // Calculate months
      const months = Math.ceil(days / 30);
      basePrice = property.price * months;
      
      // Calculate deposit (typically 1 month's rent)
      const deposit = property.price;
      
      bookingNightsText.textContent = `$${property.price} x ${months} month${months === 1 ? '' : 's'}`;
      bookingNightsBase.textContent = `$${basePrice}`;
      
      bookingNightsDepositRow.style.display = "flex";
      bookingNightsDeposit.textContent = `$${deposit}`;
      bookingNightsFee.textContent = `$${fee}`;
      
      total = basePrice + deposit + fee;
      bookingNightsTotal.textContent = `$${total}`;
    } else {
      // Stays / nightly calculations
      basePrice = property.price * days;
      
      bookingNightsText.textContent = `$${property.price} x ${days} night${days === 1 ? '' : 's'}`;
      bookingNightsBase.textContent = `$${basePrice}`;
      
      bookingNightsDepositRow.style.display = "none";
      bookingNightsFee.textContent = `$${fee}`;
      
      total = basePrice + fee;
      bookingNightsTotal.textContent = `$${total}`;
    }
    
    bookingPriceSummary.style.display = "flex";
  } else {
    bookingPriceSummary.style.display = "none";
  }
}

checkinInput.addEventListener("change", calculateCost);
checkoutInput.addEventListener("change", calculateCost);

// Reserve Stay / Request Lease Submit Action
bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    switchToAuthTab("signup");
    openModal(authModal);
    showToast("Please log in or sign up first to reserve properties.", "error");
    return;
  }
  
  const property = properties.find(p => p.id === currentDetailedPropertyId);
  const actionText = property.rentType === "month" ? "Lease request submitted" : "Booking stay submitted";
  showToast(`${actionText} for "${property.title}"! ✅ We will contact you shortly.`, "success");
  closeModal(detailModal);
});

// ==========================================
// 6. Interactive Toast Notification System
// ==========================================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type === 'success' ? 'success' : ''}`;
  
  const statusIcon = type === "success" 
    ? '<svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" style="color: var(--white);"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm-2 20l-6-6 1.4-1.4 4.6 4.6L22.6 10l1.4 1.4z"/></svg>' 
    : '<svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" style="color: var(--white);"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm1 20h-2v-2h2zm0-4h-2V10h2z"/></svg>';
  
  toast.innerHTML = `
    ${statusIcon}
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3500);
}

// ==========================================
// 6.5 Light / Dark Theme Management Engine
// ==========================================
let currentTheme = "light";
const themeToggleBtn = document.getElementById("theme-toggle-btn");

function initTheme() {
  const savedTheme = localStorage.getItem("roja-theme") || "light";
  setTheme(savedTheme);
}

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("roja-theme", theme);
  
  if (theme === "dark") {
    // Moon Icon SVG
    themeToggleBtn.innerHTML = `
      <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
        <path d="M16 2.03a14 14 0 1 0 14 14 14 14 0 0 0-14-14zm0 24a10 10 0 1 1 10-10 10 10 0 0 1-10 10z"/>
      </svg>
    `;
  } else {
    // Sun Icon SVG
    themeToggleBtn.innerHTML = `
      <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
        <path d="M16 8a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"/>
      </svg>
    `;
  }
}

themeToggleBtn.addEventListener("click", () => {
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(nextTheme);
  showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode! 🌗`, "success");
});

// ==========================================
// 7. Initial App Boot setup
// ==========================================
function initApp() {
  initTheme();
  renderProperties();
}

window.addEventListener("DOMContentLoaded", initApp);

// ==========================================
// 8. Footer Info Modals & Chatbot UI
// ==========================================
const infoModal = document.getElementById('info-modal');
const closeInfoBtn = document.getElementById('close-info-btn');
const infoTitle = document.getElementById('info-title');
const infoContent = document.getElementById('info-content');

// Content Dictionary based on user input
const footerContent = {
  "#contact": {
    title: "Contact Support",
    body: "<p>You can reach us anytime.</p><p><strong>Email:</strong> tatpise@gmail.com</p><p><strong>Phone:</strong> +263775588545</p>"
  },
  "#about": {
    title: "About ROJA",
    body: "<p>ROJA is Zimbabwe's premium rental marketplace. Our purpose is to seamlessly match verified property hosts with tenants for both short-term BnB stays and long-term house leases, ensuring trust, transparency, and ease of use.</p>"
  },
  "#safety": {
    title: "Tenant Safety",
    body: "<p><strong>Your Rights Protected:</strong> According to the Constitution of Zimbabwe, every person has the right to personal security and the right to privacy. ROJA enforces these constitutional rights by ensuring all listed properties meet strict safety standards and all hosts are verified, protecting you from arbitrary eviction or unsafe living conditions.</p>"
  },
  "#cancellation": {
    title: "Cancellation & Leases",
    body: "<h4>ROJA Standard Lease Agreement</h4><p><strong>Long-Term Leases:</strong> Subject to a minimum 30-day notice for cancellation by either party unless specified otherwise in the specific property agreement.</p><p><strong>Short-Term BnBs:</strong> Cancellations made within 48 hours of booking are fully refundable. Beyond that, a 50% cancellation fee applies.</p>"
  },
  "#careers": {
    title: "Careers",
    body: "<p>There are currently no open positions at ROJA. Please check back later!</p>"
  },
  "#news": {
    title: "Newsroom",
    body: "<p><strong>Latest at ROJA:</strong> We are currently tracking new estate developments across Zimbabwe to expand our listings, including prioritizing properties with solar and borehole installations to ensure uninterrupted living!</p>"
  },
  "#rules": {
    title: "Rental Regulations",
    body: "<p>All rentals on ROJA strictly comply with the statutory Rental Regulations of Zimbabwe.</p>"
  }
};

// Help Center Chatbot Generator
function generateChatbotUI() {
  infoTitle.innerText = "Help Center (Chatbot)";
  infoContent.innerHTML = `
    <div class="chatbot-container">
      <div class="chatbot-messages" id="chatbot-messages">
        <div class="chat-msg bot">Welcome to the ROJA Help Center! How can I assist you today?</div>
      </div>
      <div class="chatbot-input-area">
        <input type="text" id="chatbot-input" placeholder="Type your question...">
        <button id="chatbot-send-btn">
          <svg viewBox="0 0 32 32" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M2 16L30 2M30 2L16 30M30 2L12 20M12 20L2 16Z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Attach basic chatbot interaction
  const sendBtn = document.getElementById('chatbot-send-btn');
  const input = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.innerText = text;
    messages.appendChild(userMsg);
    
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Fake bot reply
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-msg bot';
      botMsg.innerText = "I am a simple demo chatbot. Please use the Contact Support info (tatpise@gmail.com) for real assistance.";
      messages.appendChild(botMsg);
      messages.scrollTop = messages.scrollHeight;
    }, 800);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// Hook up footer links
document.querySelectorAll('footer a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href.startsWith('#') && href !== '#') {
      e.preventDefault();
      
      if (href === '#help') {
        generateChatbotUI();
        infoModal.classList.add('active');
      } else if (footerContent[href]) {
        infoTitle.innerText = footerContent[href].title;
        infoContent.innerHTML = footerContent[href].body;
        infoModal.classList.add('active');
      }
    }
  });
});

closeInfoBtn.addEventListener('click', () => {
  infoModal.classList.remove('active');
});

infoModal.addEventListener('click', (e) => {
  if (e.target === infoModal) {
    infoModal.classList.remove('active');
  }
});
