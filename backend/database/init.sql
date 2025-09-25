-- Initialize IGCFMS Database for Docker
-- This script runs when the MySQL container starts for the first time

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS igcfms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create the user if it doesn't exist
CREATE USER IF NOT EXISTS 'igcfms_user'@'%' IDENTIFIED BY 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON igcfms.* TO 'igcfms_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Use the igcfms database
USE igcfms;

-- The Laravel migrations will create the actual tables
-- This script just ensures the database and user are ready
