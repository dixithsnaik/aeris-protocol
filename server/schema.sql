CREATE DATABASE IF NOT EXISTS aeris;
USE aeris;

-- Phone OTP users. Drop the old email table if it exists.
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(80) NULL,
  email VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  location VARCHAR(160) NOT NULL,
  area_name VARCHAR(120) NOT NULL,
  config VARCHAR(80) NOT NULL,
  price BIGINT NOT NULL,
  area_sqft INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  yield_pct DECIMAL(4,1) NOT NULL,
  yoy_pct DECIMAL(4,1) NOT NULL,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  verify_pending TINYINT(1) NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  owner_id INT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_config (config),
  INDEX idx_price (price),
  INDEX idx_verified (verified),
  INDEX idx_owner (owner_id)
);

CREATE TABLE interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_interest (user_id, property_id),
  INDEX idx_user (user_id),
  INDEX idx_property (property_id)
);

CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  buyer_id INT NOT NULL,
  sender_id INT NOT NULL,
  body VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_thread (property_id, buyer_id)
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  kind VARCHAR(24) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(400) NOT NULL,
  href VARCHAR(200) NOT NULL,
  property_id INT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_user_unread (user_id, read_at),
  INDEX idx_property (property_id)
);
