// ==========================================================
// ROJA Zimbabwean Rental Marketplace - Local Database Driver
// ==========================================================
// Provides functional client-side persistence mimicking relational tables.
// Seeds the database on first load with default Zimbabwean properties.

class ROJADB {
  
  // Initialize Database keys in LocalStorage if they don't exist
  static init() {
    if (!localStorage.getItem("roja_users")) {
      localStorage.setItem("roja_users", JSON.stringify([]));
    }
    if (!localStorage.getItem("roja_bookings")) {
      localStorage.setItem("roja_bookings", JSON.stringify([]));
    }
    if (!localStorage.getItem("roja_favorites")) {
      localStorage.setItem("roja_favorites", JSON.stringify([]));
    }
    if (!localStorage.getItem("roja_properties")) {
      // Seed default Zimbabwean property listings
      const defaultProperties = [
        {
          id: 1,
          title: "Luxury Avondale Townhouse with Solar",
          description: "Located in the quiet, secure suburb of Avondale in Harare, this modern duplex townhouse features 3 spacious bedrooms, a double garage, automated gate, active security patrol, a fully functional borehole, and an 8kVA solar backup system. Perfect for families looking for a stress-free lease.",
          location: "Harare",
          category: "suburban",
          rentType: "month",
          price: 1500,
          rating: 4.92,
          reviews: 24,
          host: "Tendai",
          hostInitials: "TN",
          hostId: 100, // Simulated static host
          guests: 6,
          images: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Borehole Water", "Wifi", "Security System", "Car Parking", "Kitchen"]
        },
        {
          id: 2,
          title: "Victoria Falls Safari Cottage",
          description: "Experience the majestic Victoria Falls from this cozy self-catering holiday BnB cottage. Located just 5 minutes from the rain forest entrance, this cottage features a cool veranda, native timber furniture, solar air conditioning, and a splash pool to cool down.",
          location: "Victoria Falls",
          category: "stays",
          rentType: "night",
          price: 160,
          rating: 4.97,
          reviews: 112,
          host: "Julia & Sean",
          hostInitials: "JS",
          hostId: 101,
          guests: 4,
          images: [
            "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Wifi", "Car Parking", "Kitchen"]
        },
        {
          id: 3,
          title: "Borrowdale Brooke Executive Mansion",
          description: "Situated inside the elite Borrowdale Brooke Golf Estate in Harare, this lavish double-storey home features a swimming pool, massive entertainment deck, modern fitted kitchen, and uninterrupted borehole water and solar grid power. Ideal for executive leases.",
          location: "Harare",
          category: "suburban",
          rentType: "month",
          price: 3200,
          rating: 4.98,
          reviews: 12,
          host: "Farai",
          hostInitials: "FR",
          hostId: 102,
          guests: 8,
          images: [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Borehole Water", "Wifi", "Security System", "Car Parking", "Kitchen"]
        },
        {
          id: 4,
          title: "Nyanga Pine Cabin Escape",
          description: "Escape to the crisp mountains of Nyanga in this rustic A-frame log cabin. Cozy fireplace, pine paneling, private forest views, and close access to Nyangombe Falls. The perfect highland get-away from the hot city.",
          location: "Nyanga",
          category: "highlands",
          rentType: "night",
          price: 110,
          rating: 4.89,
          reviews: 84,
          host: "Rudo",
          hostInitials: "RD",
          hostId: 103,
          guests: 2,
          images: [
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Wifi", "Kitchen", "Car Parking"]
        },
        {
          id: 5,
          title: "Kariba Lakefront Resort Lodge",
          description: "Enjoy stunning sunsets over Lake Kariba in this resort-style lodge. Features a deck overlooking the water, frequent wildlife sightings right at the fence, solar power backup, clean running water, and options for houseboat rental bookings.",
          location: "Kariba",
          category: "waterfront",
          rentType: "night",
          price: 195,
          rating: 4.85,
          reviews: 43,
          host: "Clive & Nyasha",
          hostInitials: "CN",
          hostId: 104,
          guests: 5,
          images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Solar Power", "Wifi", "Car Parking", "Kitchen"]
        },
        {
          id: 6,
          title: "Cozy Garden Suite in Bulawayo Suburbs",
          description: "Located in the quiet residential area of Suburbs, Bulawayo, this self-contained guest garden wing features high ceilings, historic stone architecture, a private entrance, superfast fiber, and a borehole feeding the premises.",
          location: "Bulawayo",
          category: "stays",
          rentType: "month",
          price: 550,
          rating: 4.91,
          reviews: 31,
          host: "Memory",
          hostInitials: "MM",
          hostId: 105,
          guests: 2,
          images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Borehole Water", "Wifi", "Car Parking", "Kitchen"]
        }
      ];
      localStorage.setItem("roja_properties", JSON.stringify(defaultProperties));
    }
  }

  // --- GET DATA OPERATIONS ---
  static getUsers() {
    return JSON.parse(localStorage.getItem("roja_users")) || [];
  }

  static getProperties() {
    return JSON.parse(localStorage.getItem("roja_properties")) || [];
  }

  static getBookings() {
    return JSON.parse(localStorage.getItem("roja_bookings")) || [];
  }

  static getFavorites() {
    return JSON.parse(localStorage.getItem("roja_favorites")) || [];
  }

  // --- WRITE DATA OPERATIONS ---
  static saveUsers(users) {
    localStorage.setItem("roja_users", JSON.stringify(users));
  }

  static saveProperties(properties) {
    localStorage.setItem("roja_properties", JSON.stringify(properties));
  }

  static saveBookings(bookings) {
    localStorage.setItem("roja_bookings", JSON.stringify(bookings));
  }

  static saveFavorites(favorites) {
    localStorage.setItem("roja_favorites", JSON.stringify(favorites));
  }

  // --- AUTH OPERATIONS ---
  
  // Creates a new user record. Throws error if email is registered already.
  static createUser(name, email, password, role) {
    const users = this.getUsers();
    const cleanEmail = email.toLowerCase().trim();
    
    // Check constraint validation
    if (users.find(u => u.email === cleanEmail)) {
      throw new Error("This email is already registered under a ROJA account!");
    }
    
    const newUser = {
      id: users.length + 1,
      name: name.trim(),
      email: cleanEmail,
      password: password, // In a real backend, this is hashed (e.g. bcrypt)
      role: role,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  // Verifies user credentials. Returns user details or null.
  static verifyUser(email, password) {
    const users = this.getUsers();
    const cleanEmail = email.toLowerCase().trim();
    
    const foundUser = users.find(u => u.email === cleanEmail && u.password === password);
    return foundUser ? { id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role } : null;
  }

  // --- PROPERTY OPERATIONS ---

  // Saves a new landlord listing to the database.
  static addProperty(landlordId, hostName, title, description, location, category, rentType, price, maxGuests, images, amenities) {
    const properties = this.getProperties();
    
    const newProperty = {
      id: properties.length + 1,
      landlordId: landlordId,
      host: hostName,
      hostInitials: hostName.slice(0, 2).toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      location: location,
      category: category,
      rentType: rentType,
      price: price,
      rating: 5.0,
      reviews: 0,
      guests: maxGuests,
      images: images,
      amenities: amenities,
      createdAt: new Date().toISOString()
    };
    
    properties.unshift(newProperty); // Prepend to list
    this.saveProperties(properties);
    return newProperty;
  }

  // --- BOOKING OPERATIONS ---

  // Stores a stay reservation or lease request
  static addBooking(propertyId, tenantId, checkIn, checkOut, guestsCount, baseAmount, depositAmount, serviceFee, totalAmount) {
    const bookings = this.getBookings();
    
    const newBooking = {
      id: bookings.length + 1,
      propertyId: propertyId,
      tenantId: tenantId,
      checkIn: checkIn,
      checkOut: checkOut,
      guestsCount: guestsCount,
      baseAmount: baseAmount,
      depositAmount: depositAmount,
      serviceFee: serviceFee,
      totalAmount: totalAmount,
      status: "confirmed",
      createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    this.saveBookings(bookings);
    return newBooking;
  }

  // --- FAVORITE OPERATIONS ---

  // Toggles the bookmarks list mapping. Returns true if added, false if removed.
  static toggleFavorite(userId, propertyId) {
    let favorites = this.getFavorites();
    const index = favorites.findIndex(f => f.userId === userId && f.propertyId === propertyId);
    
    if (index === -1) {
      favorites.push({ userId, propertyId, createdAt: new Date().toISOString() });
      this.saveFavorites(favorites);
      return true; // Added
    } else {
      favorites.splice(index, 1);
      this.saveFavorites(favorites);
      return false; // Removed
    }
  }

  // Returns list of property IDs bookmarked by a user
  static getFavoritesForUser(userId) {
    const favorites = this.getFavorites();
    return favorites.filter(f => f.userId === userId).map(f => f.propertyId);
  }
}

// Automatically boot-up database structures on load
ROJADB.init();
