// ==========================================================
// ROJA Zimbabwean Rental Marketplace - Backend Database Driver
// ==========================================================
// Provides local relational storage layer mimicking SQL tables (schema.sql),
// cryptographic password hashing (SHA-256 + salt via Web Crypto API),
// user accounts lifecycle, persistent sessions, property listings,
// and booking transactions.

class ROJADB {
  // Storage Keys
  static KEYS = {
    USERS: "roja_users",
    PROPERTIES: "roja_properties",
    BOOKINGS: "roja_bookings",
    FAVORITES: "roja_favorites",
    SESSION: "roja_session"
  };

  // --- CRYPTOGRAPHIC PASSWORD HASHING (Web Crypto API) ---

  // Generates a random cryptographic salt in hex format
  static generateSalt(length = 16) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hashes password with salt using SHA-256
  static async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- INITIALIZATION & SEEDING ---

  static async init() {
    // 1. Initialize Users Table
    if (!localStorage.getItem(this.KEYS.USERS)) {
      // Seed default accounts
      const landlordSalt = this.generateSalt();
      const landlordHash = await this.hashPassword("password123", landlordSalt);

      const tenantSalt = this.generateSalt();
      const tenantHash = await this.hashPassword("password123", tenantSalt);

      const defaultUsers = [
        {
          id: 1,
          name: "Tendai Moyo",
          email: "landlord@roja.co.zw",
          salt: landlordSalt,
          passwordHash: landlordHash,
          role: "landlord",
          createdAt: new Date("2025-01-15T08:00:00Z").toISOString()
        },
        {
          id: 2,
          name: "Farai Sibanda",
          email: "tenant@roja.co.zw",
          salt: tenantSalt,
          passwordHash: tenantHash,
          role: "tenant",
          createdAt: new Date("2025-02-10T10:30:00Z").toISOString()
        }
      ];
      localStorage.setItem(this.KEYS.USERS, JSON.stringify(defaultUsers));
    }

    // 2. Initialize Bookings Table
    if (!localStorage.getItem(this.KEYS.BOOKINGS)) {
      const defaultBookings = [
        {
          id: 1,
          reference: "ROJA-BKG-1001",
          propertyId: 1,
          tenantId: 2,
          tenantName: "Farai Sibanda",
          checkIn: "2026-09-01",
          checkOut: "2026-12-01",
          durationText: "3 months",
          guestsCount: 2,
          baseAmount: 4500,
          depositAmount: 1500,
          serviceFee: 50,
          totalAmount: 6050,
          status: "confirmed",
          createdAt: new Date("2026-08-01T14:20:00Z").toISOString()
        }
      ];
      localStorage.setItem(this.KEYS.BOOKINGS, JSON.stringify(defaultBookings));
    }

    // 3. Initialize Favorites Table
    if (!localStorage.getItem(this.KEYS.FAVORITES)) {
      const defaultFavorites = [
        { userId: 2, propertyId: 1, createdAt: new Date().toISOString() },
        { userId: 2, propertyId: 2, createdAt: new Date().toISOString() }
      ];
      localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(defaultFavorites));
    }

    // 4. Initialize Properties Table
    if (!localStorage.getItem(this.KEYS.PROPERTIES)) {
      const defaultProperties = [
        {
          id: 1,
          landlordId: 1,
          host: "Tendai Moyo",
          hostInitials: "TM",
          title: "Luxury Avondale Townhouse with Solar",
          description: "Located in the quiet, secure suburb of Avondale in Harare, this modern duplex townhouse features 3 spacious bedrooms, a double garage, automated gate, active security patrol, a fully functional borehole, and an 8kVA solar backup system. Perfect for families looking for a stress-free lease.",
          location: "Harare",
          category: "suburban",
          rentType: "month",
          price: 1500,
          rating: 4.92,
          reviews: 24,
          guests: 6,
          images: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Borehole Water", "Wifi", "Security System", "Car Parking", "Kitchen"],
          createdAt: new Date("2025-03-01T09:00:00Z").toISOString()
        },
        {
          id: 2,
          landlordId: 1,
          host: "Tendai Moyo",
          hostInitials: "TM",
          title: "Victoria Falls Safari Cottage",
          description: "Experience the majestic Victoria Falls from this cozy self-catering holiday BnB cottage. Located just 5 minutes from the rain forest entrance, this cottage features a cool veranda, native timber furniture, solar air conditioning, and a splash pool to cool down.",
          location: "Victoria Falls",
          category: "stays",
          rentType: "night",
          price: 160,
          rating: 4.97,
          reviews: 112,
          guests: 4,
          images: [
            "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Wifi", "Car Parking", "Kitchen"],
          createdAt: new Date("2025-03-05T11:00:00Z").toISOString()
        },
        {
          id: 3,
          landlordId: 1,
          host: "Tendai Moyo",
          hostInitials: "TM",
          title: "Borrowdale Brooke Executive Mansion",
          description: "Situated inside the elite Borrowdale Brooke Golf Estate in Harare, this lavish double-storey home features a swimming pool, massive entertainment deck, modern fitted kitchen, and uninterrupted borehole water and solar grid power. Ideal for executive leases.",
          location: "Harare",
          category: "suburban",
          rentType: "month",
          price: 3200,
          rating: 4.98,
          reviews: 12,
          guests: 8,
          images: [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Borehole Water", "Wifi", "Security System", "Car Parking", "Kitchen"],
          createdAt: new Date("2025-03-10T12:30:00Z").toISOString()
        },
        {
          id: 4,
          landlordId: 103,
          host: "Rudo Chikwava",
          hostInitials: "RC",
          title: "Nyanga Pine Cabin Escape",
          description: "Escape to the crisp mountains of Nyanga in this rustic A-frame log cabin. Cozy fireplace, pine paneling, private forest views, and close access to Nyangombe Falls. The perfect highland get-away from the hot city.",
          location: "Nyanga",
          category: "highlands",
          rentType: "night",
          price: 110,
          rating: 4.89,
          reviews: 84,
          guests: 2,
          images: [
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Wifi", "Kitchen", "Car Parking"],
          createdAt: new Date("2025-03-12T14:00:00Z").toISOString()
        },
        {
          id: 5,
          landlordId: 104,
          host: "Clive & Nyasha",
          hostInitials: "CN",
          title: "Kariba Lakefront Resort Lodge",
          description: "Enjoy stunning sunsets over Lake Kariba in this resort-style lodge. Features a deck overlooking the water, frequent wildlife sightings right at the fence, solar power backup, clean running water, and options for houseboat rental bookings.",
          location: "Kariba",
          category: "waterfront",
          rentType: "night",
          price: 195,
          rating: 4.85,
          reviews: 43,
          guests: 5,
          images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Wifi", "Car Parking", "Kitchen"],
          createdAt: new Date("2025-03-15T16:00:00Z").toISOString()
        },
        {
          id: 6,
          landlordId: 105,
          host: "Memory Sibanda",
          hostInitials: "MS",
          title: "Cozy Garden Suite in Bulawayo Suburbs",
          description: "Located in the quiet residential area of Suburbs, Bulawayo, this self-contained guest garden wing features high ceilings, historic stone architecture, a private entrance, superfast fiber, and a borehole feeding the premises.",
          location: "Bulawayo",
          category: "stays",
          rentType: "month",
          price: 550,
          rating: 4.91,
          reviews: 31,
          guests: 2,
          images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Borehole Water", "Wifi", "Car Parking", "Kitchen"],
          createdAt: new Date("2025-03-18T10:15:00Z").toISOString()
        }
      ];
      localStorage.setItem(this.KEYS.PROPERTIES, JSON.stringify(defaultProperties));
    }
  }

  // --- RAW GET / SET UTILITIES ---
  static getUsers() {
    return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
  }

  static getProperties() {
    return JSON.parse(localStorage.getItem(this.KEYS.PROPERTIES)) || [];
  }

  static getBookings() {
    return JSON.parse(localStorage.getItem(this.KEYS.BOOKINGS)) || [];
  }

  static getFavorites() {
    return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES)) || [];
  }

  static saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  }

  static saveProperties(properties) {
    localStorage.setItem(this.KEYS.PROPERTIES, JSON.stringify(properties));
  }

  static saveBookings(bookings) {
    localStorage.setItem(this.KEYS.BOOKINGS, JSON.stringify(bookings));
  }

  static saveFavorites(favorites) {
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
  }

  // --- SESSION MANAGEMENT ---

  static getCurrentSession() {
    const session = localStorage.getItem(this.KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  }

  static setSession(user) {
    const sanitized = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(sanitized));
    return sanitized;
  }

  static clearSession() {
    localStorage.removeItem(this.KEYS.SESSION);
  }

  // --- USER AUTHENTICATION & ACCOUNTS ---

  // Registers a new user account with salted SHA-256 password hash
  static async createUser({ name, email, password, role = "tenant" }) {
    if (!name || name.trim().length === 0) {
      throw new Error("Full name is required.");
    }

    const cleanEmail = (email || "").toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const users = this.getUsers();
    if (users.find(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error("An account is already registered with this email address.");
    }

    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);

    const maxId = users.reduce((max, u) => Math.max(max, u.id || 0), 0);
    const newUser = {
      id: maxId + 1,
      name: name.trim(),
      email: cleanEmail,
      salt: salt,
      passwordHash: passwordHash,
      role: role === "landlord" ? "landlord" : "tenant",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    return this.setSession(newUser);
  }

  // Authenticates a user by email and password using salted hash comparison
  static async verifyUser(email, password) {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail || !password) {
      throw new Error("Email and password are required.");
    }

    const users = this.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      throw new Error("No account found with this email address.");
    }

    // Verify hash
    const inputHash = await this.hashPassword(password, foundUser.salt);
    if (inputHash !== foundUser.passwordHash) {
      throw new Error("Incorrect password. Please try again.");
    }

    return this.setSession(foundUser);
  }

  // Updates role of an existing user (e.g. upgrading from Tenant to Landlord)
  static updateUserRole(userId, newRole) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.role = newRole;
      this.saveUsers(users);

      const session = this.getCurrentSession();
      if (session && session.id === userId) {
        session.role = newRole;
        this.setSession(session);
      }
    }
  }

  // --- PROPERTY LISTINGS (CRUD) ---

  static getPropertyById(id) {
    const properties = this.getProperties();
    return properties.find(p => p.id === parseInt(id, 10)) || null;
  }

  static getPropertiesByLandlord(landlordId) {
    const properties = this.getProperties();
    return properties.filter(p => p.landlordId === parseInt(landlordId, 10));
  }

  // Adds a new property listing and persists to localStorage
  static addProperty({
    landlordId,
    hostName,
    title,
    description,
    location,
    category,
    rentType,
    price,
    maxGuests,
    images = [],
    amenities = []
  }) {
    if (!title || !description || !location || !price) {
      throw new Error("Missing required property fields.");
    }

    const properties = this.getProperties();
    const maxId = properties.reduce((max, p) => Math.max(max, p.id || 0), 0);

    const newProperty = {
      id: maxId + 1,
      landlordId: landlordId || 1,
      host: hostName || "Verified Host",
      hostInitials: (hostName || "VH").slice(0, 2).toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      location: location,
      category: category || "suburban",
      rentType: rentType || "month",
      price: parseFloat(price),
      rating: 5.0,
      reviews: 0,
      guests: parseInt(maxGuests, 10) || 1,
      images: images.length > 0 ? images : [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
      ],
      amenities: amenities,
      createdAt: new Date().toISOString()
    };

    properties.unshift(newProperty);
    this.saveProperties(properties);
    return newProperty;
  }

  // Deletes a property listing
  static deleteProperty(propertyId, landlordId) {
    let properties = this.getProperties();
    const target = properties.find(p => p.id === parseInt(propertyId, 10));

    if (!target) {
      throw new Error("Property listing not found.");
    }

    if (landlordId && target.landlordId !== parseInt(landlordId, 10)) {
      throw new Error("You do not have permission to delete this listing.");
    }

    properties = properties.filter(p => p.id !== parseInt(propertyId, 10));
    this.saveProperties(properties);
    return true;
  }

  // --- BOOKING TRANSACTIONS ---

  // Adds a reservation or lease booking
  static addBooking({
    propertyId,
    tenantId,
    tenantName,
    checkIn,
    checkOut,
    guestsCount,
    baseAmount,
    depositAmount = 0,
    serviceFee = 50,
    totalAmount,
    durationText = ""
  }) {
    if (!propertyId || !tenantId || !checkIn || !checkOut) {
      throw new Error("Missing required booking details.");
    }

    const bookings = this.getBookings();
    const maxId = bookings.reduce((max, b) => Math.max(max, b.id || 0), 0);
    const reference = `ROJA-BKG-${1000 + maxId + 1}`;

    const newBooking = {
      id: maxId + 1,
      reference: reference,
      propertyId: parseInt(propertyId, 10),
      tenantId: parseInt(tenantId, 10),
      tenantName: tenantName || "ROJA Guest",
      checkIn: checkIn,
      checkOut: checkOut,
      durationText: durationText,
      guestsCount: parseInt(guestsCount, 10) || 1,
      baseAmount: parseFloat(baseAmount),
      depositAmount: parseFloat(depositAmount),
      serviceFee: parseFloat(serviceFee),
      totalAmount: parseFloat(totalAmount),
      status: "confirmed",
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    this.saveBookings(bookings);
    return newBooking;
  }

  // Retrieves all bookings for a specific tenant, enriched with property details
  static getBookingsByTenant(tenantId) {
    const bookings = this.getBookings();
    const properties = this.getProperties();

    return bookings
      .filter(b => b.tenantId === parseInt(tenantId, 10))
      .map(b => {
        const property = properties.find(p => p.id === b.propertyId) || null;
        return {
          ...b,
          property: property
        };
      });
  }

  // Retrieves all bookings made on properties owned by a specific landlord
  static getBookingsByLandlord(landlordId) {
    const bookings = this.getBookings();
    const properties = this.getProperties();
    const landlordProperties = properties.filter(p => p.landlordId === parseInt(landlordId, 10));
    const propertyIds = new Set(landlordProperties.map(p => p.id));

    return bookings
      .filter(b => propertyIds.has(b.propertyId))
      .map(b => {
        const property = properties.find(p => p.id === b.propertyId) || null;
        return {
          ...b,
          property: property
        };
      });
  }

  // Cancels a booking
  static cancelBooking(bookingId, userId) {
    const bookings = this.getBookings();
    const booking = bookings.find(b => b.id === parseInt(bookingId, 10));

    if (!booking) {
      throw new Error("Booking not found.");
    }

    if (userId && booking.tenantId !== parseInt(userId, 10)) {
      // Check if landlord
      const property = this.getPropertyById(booking.propertyId);
      if (!property || property.landlordId !== parseInt(userId, 10)) {
        throw new Error("You do not have permission to cancel this booking.");
      }
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date().toISOString();
    this.saveBookings(bookings);
    return booking;
  }

  // --- FAVORITES / BOOKMARKS ---

  static toggleFavorite(userId, propertyId) {
    if (!userId) return false;

    let favorites = this.getFavorites();
    const uId = parseInt(userId, 10);
    const pId = parseInt(propertyId, 10);

    const index = favorites.findIndex(f => f.userId === uId && f.propertyId === pId);

    if (index === -1) {
      favorites.push({ userId: uId, propertyId: pId, createdAt: new Date().toISOString() });
      this.saveFavorites(favorites);
      return true; // Added
    } else {
      favorites.splice(index, 1);
      this.saveFavorites(favorites);
      return false; // Removed
    }
  }

  static getFavoritesForUser(userId) {
    if (!userId) return [];
    const favorites = this.getFavorites();
    const uId = parseInt(userId, 10);
    return favorites.filter(f => f.userId === uId).map(f => f.propertyId);
  }

  // Reset database back to default seed state
  static async resetDatabase() {
    localStorage.removeItem(this.KEYS.USERS);
    localStorage.removeItem(this.KEYS.PROPERTIES);
    localStorage.removeItem(this.KEYS.BOOKINGS);
    localStorage.removeItem(this.KEYS.FAVORITES);
    localStorage.removeItem(this.KEYS.SESSION);
    await this.init();
  }
}

// Auto-initialize DB structures asynchronously
ROJADB.init();
