-- ==========================================================
-- ROJA Zimbabwean Rental Marketplace - Database Schema (SQL)
-- ==========================================================
-- Suitable for PostgreSQL, SQLite, or MySQL. Handles user profiles,
-- property listings, image mappings, booking logs, and bookmarks.

-- 1. USERS TABLE
-- Stores profile details for landlords and tenants.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Stored as hashed bcrypt/argon2 strings
    role VARCHAR(20) NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email to guarantee fast logins and credentials validation
CREATE INDEX idx_users_email ON users(email);


-- 2. PROPERTIES TABLE
-- Stores property descriptions, locations, categories, and lease pricing structures.
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    landlord_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100) NOT NULL, -- e.g. "Harare", "Victoria Falls", "Bulawayo"
    category VARCHAR(50) NOT NULL CHECK (category IN ('suburban', 'stays', 'highlands', 'waterfront')),
    rent_type VARCHAR(20) NOT NULL CHECK (rent_type IN ('night', 'month')), -- 'night' for BnB stays, 'month' for long-term lease
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0.00), -- Pricing unit is USD
    max_guests INTEGER NOT NULL DEFAULT 1 CHECK (max_guests > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes to optimize property search and category filter triggers
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_category ON properties(category);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);


-- 3. PROPERTY AMENITIES JUNCTION TABLE
-- Maps multiple amenities to listings (Solar backup, Borehole water, Wifi, Security, etc.)
CREATE TABLE property_amenities (
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (property_id, amenity_name)
);


-- 4. PROPERTY IMAGES TABLE
-- Maps multiple image URLs or file Data-URIs to property listings.
CREATE TABLE property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Can house absolute URLs or Base64 file paths
    is_primary BOOLEAN DEFAULT FALSE, -- Identifies main thumbnail cover
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_images_property ON property_images(property_id);


-- 5. BOOKINGS TABLE
-- Tracks short-term stays (BnBs) and long-term lease contracts.
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1 CHECK (guests_count > 0),
    base_amount DECIMAL(12, 2) NOT NULL CHECK (base_amount >= 0.00), -- rent_price * duration
    deposit_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (deposit_amount >= 0.00), -- Refundable security deposit for long leases
    service_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (service_fee >= 0.00), -- platform ROJA service fee
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0.00), -- base_amount + deposit + service_fee
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_dates CHECK (check_out > check_in)
);

CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);


-- 6. FAVORITES TABLE
-- Maps user favorites collection.
CREATE TABLE favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, property_id)
);
