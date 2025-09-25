-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 25, 2025 at 09:33 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `igcfms`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `user_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `details` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `user_role`, `activity_type`, `activity_description`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES
(41, 1, 'System Administrator', 'Admin', 'fund_account_created', 'System Administrator (Admin) created fund account: COKE', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"action\": \"created\", \"account_code\": \"EXP001\", \"account_name\": \"COKE\", \"account_type\": \"Expense\", \"fund_account_id\": 12}', '2025-09-20 13:11:14'),
(42, 1, 'System Administrator', 'Admin', 'collection_created', 'System Administrator (Admin) created a Collection transaction of ₱1,500.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 1500, \"category\": \"Revenue Collection\", \"department\": \"General\", \"receipt_no\": \"RCPT-20250920-0001\", \"reference_no\": \"COL-2025-0001\", \"transaction_id\": 31, \"fund_account_id\": 12, \"transaction_type\": \"Collection\"}', '2025-09-20 13:12:31'),
(43, 1, 'System Administrator', 'Admin', 'cheque_issued', 'System Administrator (Admin) issued a cheque disbursement of ₱1,500.00 to Berkshire Hathaway', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 1500, \"method\": \"Cheque\", \"bank_name\": \"BDO\", \"payee_name\": \"Berkshire Hathaway\", \"cheque_number\": \"CHQ-20250921-1102\", \"transaction_id\": 31, \"disbursement_id\": 10}', '2025-09-20 13:15:48'),
(44, 1, 'System Administrator', 'Admin', 'collection_created', 'System Administrator (Admin) created a Collection transaction of ₱500.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 500, \"category\": \"Revenue Collection\", \"department\": \"General\", \"receipt_no\": \"RCPT-20250920-0002\", \"reference_no\": \"COL-2025-0002\", \"transaction_id\": 32, \"fund_account_id\": 12, \"transaction_type\": \"Collection\"}', '2025-09-20 13:19:57'),
(45, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱500.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 500, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250920-0001\", \"reference_no\": \"DIS-2025-0001\", \"transaction_id\": 33, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-20 13:57:58'),
(46, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱500.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 500, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250920-0002\", \"reference_no\": \"DIS-2025-0002\", \"transaction_id\": 34, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-20 14:09:35'),
(47, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"COKE Collection Account\", \"cheque_number\": null, \"transaction_id\": 34, \"disbursement_id\": 11}', '2025-09-20 14:09:40'),
(48, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱499.99', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 499.99, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250920-0003\", \"reference_no\": \"DIS-2025-0003\", \"transaction_id\": 35, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-20 14:20:35'),
(49, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"COKE Collection Account\", \"cheque_number\": null, \"transaction_id\": 35, \"disbursement_id\": 12}', '2025-09-20 14:20:40'),
(50, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-20T22:51:44.865303Z\", \"session_id\": \"FhspnoNMTlat0YJCO2AFRazTTfY2DKjciuLve1oG\"}', '2025-09-20 14:51:44'),
(51, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱4,999.98', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 4999.98, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250920-0004\", \"reference_no\": \"DIS-2025-0004\", \"transaction_id\": 36, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-20 14:53:20'),
(52, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"COKE Collection Account\", \"cheque_number\": null, \"transaction_id\": 36, \"disbursement_id\": 13}', '2025-09-20 14:53:23'),
(53, 1, 'System Administrator', 'Admin', 'collection_created', 'System Administrator (Admin) created a Collection transaction of ₱2,000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 2000, \"category\": \"Revenue Collection\", \"department\": \"General\", \"receipt_no\": \"RCPT-20250920-0003\", \"reference_no\": \"COL-2025-0003\", \"transaction_id\": 37, \"fund_account_id\": 12, \"transaction_type\": \"Collection\"}', '2025-09-20 15:01:03'),
(54, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱-5,000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": -5000, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250920-0005\", \"reference_no\": \"DIS-2025-0005\", \"transaction_id\": 38, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-20 15:02:02'),
(55, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"COKE Collection Account\", \"cheque_number\": null, \"transaction_id\": 38, \"disbursement_id\": 14}', '2025-09-20 15:02:06'),
(56, 1, 'System Administrator', 'Admin', 'collection_created', 'System Administrator (Admin) created a Collection transaction of ₱5,000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 5000, \"category\": \"Revenue Collection\", \"department\": \"General\", \"receipt_no\": \"RCPT-20250920-0004\", \"reference_no\": \"COL-2025-0004\", \"transaction_id\": 39, \"fund_account_id\": 12, \"transaction_type\": \"Collection\"}', '2025-09-20 15:05:47'),
(57, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱-5,000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": -5000, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250920-0006\", \"reference_no\": \"DIS-2025-0006\", \"transaction_id\": 40, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-20 15:07:13'),
(58, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"COKE Collection Account\", \"cheque_number\": null, \"transaction_id\": 40, \"disbursement_id\": 15}', '2025-09-20 15:07:18'),
(59, 4, 'Marvic Pajaganas', 'Cashier', 'login', 'Marvic Pajaganas (Cashier) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-21T21:26:01.690446Z\", \"session_id\": \"FN23EUkM1vNCXyY7RxDmixIb2Xukq9cdxEWCUA4u\"}', '2025-09-21 13:26:01'),
(60, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-21T21:26:08.756433Z\", \"session_id\": \"mP1F1goB1LZiwMzNO45EpjgibjRCNk68sr4HAo9s\"}', '2025-09-21 13:26:08'),
(61, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: admin@gmail.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"admin@gmail.com\", \"attempt_time\": \"2025-09-21T22:27:23.499202Z\"}', '2025-09-21 14:27:23'),
(62, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: admin@gmail.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"admin@gmail.com\", \"attempt_time\": \"2025-09-21T22:28:11.497389Z\"}', '2025-09-21 14:28:11'),
(63, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-21T22:30:00.805439Z\", \"session_id\": \"Yz3xZAgC9fBWE8wSZ39Js42kh8wV7ARNxrj2o5i7\"}', '2025-09-21 14:30:00'),
(64, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: admin@gmail.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"admin@gmail.com\", \"attempt_time\": \"2025-09-21T22:38:48.006417Z\"}', '2025-09-21 14:38:48'),
(65, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-21T22:39:12.775161Z\", \"session_id\": \"AkF5kkEh9RP2SU90P6NwKpc1jtLwfpb3J0N3TWmw\"}', '2025-09-21 14:39:12'),
(66, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: admin@gmail.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"admin@gmail.com\", \"attempt_time\": \"2025-09-21T22:55:59.094393Z\"}', '2025-09-21 14:55:59'),
(67, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-21T22:56:16.138114Z\", \"session_id\": \"lPDRHUHdM7H8qakdzFi90JaunrvsB20orB3zXsZS\"}', '2025-09-21 14:56:16'),
(68, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱-5,000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": -5000, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250921-0001\", \"reference_no\": \"DIS-2025-0007\", \"transaction_id\": 41, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-21 14:57:04'),
(69, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"COKE Collection Account\", \"cheque_number\": null, \"transaction_id\": 41, \"disbursement_id\": 16}', '2025-09-21 14:57:07'),
(70, 1, 'System Administrator', 'Admin', 'fund_account_created', 'System Administrator (Admin) created fund account: sample', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"action\": \"created\", \"account_code\": \"EXP002\", \"account_name\": \"sample\", \"account_type\": \"Expense\", \"fund_account_id\": 13}', '2025-09-21 15:12:49'),
(71, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱-500.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": -500, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250921-0002\", \"reference_no\": \"DIS-2025-0008\", \"transaction_id\": 42, \"fund_account_id\": 13, \"transaction_type\": \"Disbursement\"}', '2025-09-21 15:24:58'),
(72, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to another sample', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"another sample\", \"cheque_number\": null, \"transaction_id\": 42, \"disbursement_id\": 17}', '2025-09-21 15:25:03'),
(73, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T09:54:45.117787Z\", \"session_id\": \"KZE6ApbH7SBCtDX47kBGAV6AaYPEcOzzHip7qXXl\"}', '2025-09-24 01:54:45'),
(74, 2, 'Jhoneca Jungoy', 'Collecting Officer', 'login', 'Jhoneca Jungoy (Collecting Officer) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T09:56:55.021331Z\", \"session_id\": \"4T8Kvrmo4a029HNPlzFnQteqzOdRZLZ1mUbD5VNi\"}', '2025-09-24 01:56:55'),
(75, 4, 'Marvic Pajaganas', 'Cashier', 'login', 'Marvic Pajaganas (Cashier) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T10:03:58.273212Z\", \"session_id\": \"BVPmXxDAMNJRdVWCzfnuTw1KANDmEIALOmFN9KQZ\"}', '2025-09-24 02:03:58'),
(76, 3, 'Ian Jane Butaslac', 'Disbursing Officer', 'login', 'Ian Jane Butaslac (Disbursing Officer) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T10:08:21.466480Z\", \"session_id\": \"tPo43pe5z7juZztqzG8hrOvmbvvFF7l9LvmKIf4J\"}', '2025-09-24 02:08:21'),
(77, 3, 'Ian Jane Butaslac', 'Disbursing Officer', 'cheque_issued', 'Ian Jane Butaslac (Disbursing Officer) issued a cheque disbursement of ₱500.00 to another sample', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 500, \"method\": \"Cheque\", \"bank_name\": \"BDO\", \"payee_name\": \"another sample\", \"cheque_number\": \"CHQ-20250924-8691\", \"transaction_id\": 42, \"disbursement_id\": 18}', '2025-09-24 02:13:54'),
(78, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: collector@gmail.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"collector@gmail.com\", \"attempt_time\": \"2025-09-24T10:15:21.416973Z\"}', '2025-09-24 02:15:21'),
(79, 2, 'Jhoneca Jungoy', 'Collecting Officer', 'login', 'Jhoneca Jungoy (Collecting Officer) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T10:21:30.811190Z\", \"session_id\": \"si7PprAWE5nd2VkA8JKgLLfGMRkTw255TCa4apnJ\"}', '2025-09-24 02:21:30'),
(80, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T15:02:37.537463Z\", \"session_id\": \"FlvHzkxjVqt5fQCS9vPEUphCS099ft7N5Eo4LzWF\"}', '2025-09-24 07:02:37'),
(81, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: cashier@gamil.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"cashier@gamil.com\", \"attempt_time\": \"2025-09-24T15:24:58.305211Z\"}', '2025-09-24 07:24:58'),
(82, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: cashier@gamil.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"cashier@gamil.com\", \"attempt_time\": \"2025-09-24T15:25:14.052733Z\"}', '2025-09-24 07:25:14'),
(83, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: cashier@gamil.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"cashier@gamil.com\", \"attempt_time\": \"2025-09-24T15:25:22.320430Z\"}', '2025-09-24 07:25:22'),
(84, 4, 'Marvic Pajaganas', 'Cashier', 'login', 'Marvic Pajaganas (Cashier) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T15:25:37.995159Z\", \"session_id\": \"l5opAohQe8wtCLA3297HVLd93v0lLfkyhZZY9nBb\"}', '2025-09-24 07:25:37'),
(85, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T15:46:36.216908Z\", \"session_id\": \"1qAvQGPVD0hNzshcHxJDYC5GJC8CaBNs7Jw38bR4\"}', '2025-09-24 07:46:36'),
(86, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T16:34:50.820791Z\", \"session_id\": \"8PKH5sxIkfSCAeSCXwiUb73Jy9hAr29yWdOS1lCd\"}', '2025-09-24 08:34:50'),
(87, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) created a Disbursement transaction of ₱-1,000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": -1000, \"category\": \"Disbursement\", \"department\": \"General\", \"receipt_no\": \"DIS-20250924-0001\", \"reference_no\": \"DIS-2025-0009\", \"transaction_id\": 43, \"fund_account_id\": 12, \"transaction_type\": \"Disbursement\"}', '2025-09-24 10:28:18'),
(88, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to lllllll', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"lllllll\", \"cheque_number\": null, \"transaction_id\": 43, \"disbursement_id\": 19}', '2025-09-24 10:28:24'),
(89, 1, 'System Administrator', 'Admin', 'collection_created', 'System Administrator (Admin) created a Collection transaction of ₱1,000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 1000, \"category\": \"Collection\", \"department\": \"General\", \"receipt_no\": \"RCPT-20250924-0001\", \"reference_no\": \"COL-2025-0005\", \"transaction_id\": 44, \"fund_account_id\": 12, \"transaction_type\": \"Collection\"}', '2025-09-24 10:30:20'),
(90, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to lololo', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"lololo\", \"cheque_number\": null, \"transaction_id\": 44, \"disbursement_id\": 20}', '2025-09-24 10:30:26'),
(91, 4, 'Marvic Pajaganas', 'Cashier', 'login', 'Marvic Pajaganas (Cashier) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T18:55:23.255257Z\", \"session_id\": \"qU0GVXyQBmvGQxX9mDwblIllcdUCJJSkYZayp5Ye\"}', '2025-09-24 10:55:23'),
(92, NULL, 'Unknown', 'Unknown', 'login_failed', 'Failed login attempt for email: admin@gmail.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"email\": \"admin@gmail.com\", \"attempt_time\": \"2025-09-24T18:57:03.182012Z\"}', '2025-09-24 10:57:03'),
(93, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-24T18:57:11.741088Z\", \"session_id\": \"ZUIvf3ENNhiGBJIekFTMz4iwaE8IqY8d1KV2MVab\"}', '2025-09-24 10:57:11'),
(94, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-25T00:25:58.659302Z\", \"session_id\": \"4VnQ2zNhD3zWryyOWpuO09j4doQ1HwaPteqFDGLu\"}', '2025-09-24 16:25:58'),
(95, 1, 'System Administrator', 'Admin', 'login', 'System Administrator (Admin) logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"login_time\": \"2025-09-25T06:30:47.309147Z\", \"session_id\": \"Zto45D7ShX70IUDjCDuKUMCeNVm3E4MCMVgFGiUk\"}', '2025-09-24 22:30:47'),
(96, 1, 'System Administrator', 'Admin', 'fund_account_created', 'System Administrator (Admin) created fund account: f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"action\": \"created\", \"account_code\": \"EXP003\", \"account_name\": \"f\", \"account_type\": \"Expense\", \"fund_account_id\": 14}', '2025-09-25 00:13:11'),
(97, 1, 'System Administrator', 'Admin', 'collection_created', 'System Administrator (Admin) created a Collection transaction of ₱10.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": 10, \"category\": \"Collection\", \"department\": \"General\", \"receipt_no\": \"RCPT-20250925-0001\", \"reference_no\": \"COL-2025-0006\", \"transaction_id\": 45, \"fund_account_id\": 14, \"transaction_type\": \"Collection\"}', '2025-09-25 00:21:33'),
(98, 1, 'System Administrator', 'Admin', 'disbursement_created', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to another sample', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '{\"amount\": null, \"method\": \"Cash\", \"bank_name\": null, \"payee_name\": \"another sample\", \"cheque_number\": null, \"transaction_id\": 45, \"disbursement_id\": 21}', '2025-09-25 00:21:38');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `disbursements`
--

CREATE TABLE `disbursements` (
  `id` bigint UNSIGNED NOT NULL,
  `transaction_id` bigint UNSIGNED NOT NULL,
  `payee_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` enum('Cash','Cheque') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cheque_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `memo` text COLLATE utf8mb4_unicode_ci,
  `fund_account_id` bigint UNSIGNED DEFAULT NULL,
  `issued_by` bigint UNSIGNED DEFAULT NULL,
  `issued_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `disbursements`
--

INSERT INTO `disbursements` (`id`, `transaction_id`, `payee_name`, `method`, `cheque_number`, `bank_name`, `account_number`, `amount`, `issue_date`, `memo`, `fund_account_id`, `issued_by`, `issued_at`, `created_at`, `updated_at`) VALUES
(10, 31, 'Berkshire Hathaway', 'Cheque', 'CHQ-20250921-1102', 'BDO', '112233', 1500.00, '2025-09-20', NULL, 12, 1, '2025-09-20 13:15:48', '2025-09-20 13:15:48', '2025-09-20 13:15:48'),
(11, 34, 'COKE Collection Account', 'Cash', NULL, NULL, NULL, NULL, '2025-09-20', NULL, 12, 1, '2025-09-20 14:09:40', '2025-09-20 14:09:40', '2025-09-20 14:09:40'),
(12, 35, 'COKE Collection Account', 'Cash', NULL, NULL, NULL, NULL, '2025-09-20', NULL, 12, 1, '2025-09-20 14:20:40', '2025-09-20 14:20:40', '2025-09-20 14:20:40'),
(13, 36, 'COKE Collection Account', 'Cash', NULL, NULL, NULL, NULL, '2025-09-20', NULL, 12, 1, '2025-09-20 14:53:23', '2025-09-20 14:53:23', '2025-09-20 14:53:23'),
(14, 38, 'COKE Collection Account', 'Cash', NULL, NULL, NULL, NULL, '2025-09-20', NULL, 12, 1, '2025-09-20 15:02:06', '2025-09-20 15:02:06', '2025-09-20 15:02:06'),
(15, 40, 'COKE Collection Account', 'Cash', NULL, NULL, NULL, NULL, '2025-09-20', NULL, 12, 1, '2025-09-20 15:07:18', '2025-09-20 15:07:18', '2025-09-20 15:07:18'),
(16, 41, 'COKE Collection Account', 'Cash', NULL, NULL, NULL, NULL, '2025-09-21', NULL, 12, 1, '2025-09-21 14:57:07', '2025-09-21 14:57:07', '2025-09-21 14:57:07'),
(17, 42, 'another sample', 'Cash', NULL, NULL, NULL, NULL, '2025-09-21', NULL, 13, 1, '2025-09-21 15:25:03', '2025-09-21 15:25:03', '2025-09-21 15:25:03'),
(18, 42, 'another sample', 'Cheque', 'CHQ-20250924-8691', 'BDO', '123123', 500.00, '2025-09-24', NULL, 12, 3, '2025-09-24 02:13:54', '2025-09-24 02:13:54', '2025-09-24 02:13:54'),
(19, 43, 'lllllll', 'Cash', NULL, NULL, NULL, NULL, '2025-09-24', NULL, 12, 1, '2025-09-24 10:28:24', '2025-09-24 10:28:24', '2025-09-24 10:28:24'),
(20, 44, 'lololo', 'Cash', NULL, NULL, NULL, NULL, '2025-09-24', NULL, 12, 1, '2025-09-24 10:30:26', '2025-09-24 10:30:26', '2025-09-24 10:30:26'),
(21, 45, 'another sample', 'Cash', NULL, NULL, NULL, NULL, '2025-09-25', NULL, 14, 1, '2025-09-25 00:21:38', '2025-09-25 00:21:38', '2025-09-25 00:21:38');

-- --------------------------------------------------------

--
-- Table structure for table `fund_accounts`
--

CREATE TABLE `fund_accounts` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `initial_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `current_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `account_type` enum('Revenue','Expense','Asset','Liability','Equity') COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_reconciled_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fund_accounts`
--

INSERT INTO `fund_accounts` (`id`, `name`, `code`, `description`, `initial_balance`, `current_balance`, `balance`, `account_type`, `department`, `is_active`, `last_reconciled_at`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(12, 'COKE', 'EXP001', 'This Fund for Coke Prizes', 5000.00, 5000.00, 0.00, 'Expense', NULL, 1, NULL, 1, '2025-09-20 13:11:14', '2025-09-20 13:11:14', NULL),
(13, 'sample', 'EXP002', 'sample', 4999.90, 4999.90, 0.00, 'Expense', NULL, 1, NULL, 1, '2025-09-21 15:12:49', '2025-09-21 15:12:49', NULL),
(14, 'f', 'EXP003', 'sfasdf', 10.00, 10.00, 0.00, 'Expense', NULL, 1, NULL, 1, '2025-09-25 00:13:11', '2025-09-25 00:13:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2025_09_15_172331_create_users_table', 1),
(2, '2025_09_15_172424_create_fund_accounts_table', 1),
(3, '2025_09_15_172501_create_transactions_table', 1),
(4, '2025_09_15_172646_create_receipts_table', 1),
(5, '2025_09_15_172721_create_disbursements_table', 1),
(6, '2025_09_15_172748_create_override_requests_table', 1),
(7, '2025_09_15_172817_create_audit_logs_table', 1),
(8, '2025_09_15_172846_create_reports_table', 1),
(9, '2025_09_15_173713_create_personal_access_tokens_table', 2),
(10, '2025_09_15_220604_create_registration_requests_table', 3),
(11, '2025_09_18_014900_add_deleted_at_to_fund_accounts_table', 4),
(12, '2025_09_19_100000_add_cheque_fields_to_disbursements_table', 5),
(13, '2025_09_19_100001_add_report_fields_to_reports_table', 5),
(14, '2025_09_19_100002_add_balance_field_to_fund_accounts_table', 5),
(15, '2025_09_19_100003_fix_timestamp_issues', 5),
(16, '2025_09_19_100004_create_notifications_table', 6),
(17, '2025_09_19_130000_create_activity_logs_table', 7),
(18, '2025_09_21_001000_create_recipient_accounts_table', 8),
(19, '2025_09_22_000000_add_recipient_fields_to_transactions', 9),
(20, '2025_09_25_000000_add_profile_fields_to_users_table', 10),
(21, '2025_09_25_000001_create_system_settings_table', 10);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at`) VALUES
(42, 1, 'user_activity', '🏦 Fund Account Created', 'System Administrator (Admin) created fund account: COKE', '{\"timestamp\": \"2025-09-20T21:11:14.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 41, \"activity_type\": \"fund_account_created\"}', 1, '2025-09-20 13:11:14'),
(43, 1, 'user_activity', '💰 New Collection', 'System Administrator (Admin) created a Collection transaction of ₱1,500.00', '{\"timestamp\": \"2025-09-20T21:12:31.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 42, \"activity_type\": \"collection_created\"}', 1, '2025-09-20 13:12:31'),
(44, 1, 'user_activity', '💳 Cheque Issued', 'System Administrator (Admin) issued a cheque disbursement of ₱1,500.00 to Berkshire Hathaway', '{\"timestamp\": \"2025-09-20T21:15:48.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 43, \"activity_type\": \"cheque_issued\"}', 1, '2025-09-20 13:15:48'),
(45, 1, 'user_activity', '💰 New Collection', 'System Administrator (Admin) created a Collection transaction of ₱500.00', '{\"timestamp\": \"2025-09-20T21:19:57.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 44, \"activity_type\": \"collection_created\"}', 1, '2025-09-20 13:19:57'),
(46, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱500.00', '{\"timestamp\": \"2025-09-20T21:57:58.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 45, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 13:57:58'),
(47, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱500.00', '{\"timestamp\": \"2025-09-20T22:09:35.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 46, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 14:09:35'),
(48, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '{\"timestamp\": \"2025-09-20T22:09:40.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 47, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 14:09:40'),
(49, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱499.99', '{\"timestamp\": \"2025-09-20T22:20:35.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 48, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 14:20:35'),
(50, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '{\"timestamp\": \"2025-09-20T22:20:40.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 49, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 14:20:40'),
(51, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-20T22:51:44.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 50, \"activity_type\": \"login\"}', 1, '2025-09-20 14:51:44'),
(52, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱4,999.98', '{\"timestamp\": \"2025-09-20T22:53:20.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 51, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 14:53:20'),
(53, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '{\"timestamp\": \"2025-09-20T22:53:23.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 52, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 14:53:23'),
(54, 1, 'user_activity', '💰 New Collection', 'System Administrator (Admin) created a Collection transaction of ₱2,000.00', '{\"timestamp\": \"2025-09-20T23:01:03.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 53, \"activity_type\": \"collection_created\"}', 1, '2025-09-20 15:01:03'),
(55, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱-5,000.00', '{\"timestamp\": \"2025-09-20T23:02:02.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 54, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 15:02:02'),
(56, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '{\"timestamp\": \"2025-09-20T23:02:06.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 55, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 15:02:06'),
(57, 1, 'user_activity', '💰 New Collection', 'System Administrator (Admin) created a Collection transaction of ₱5,000.00', '{\"timestamp\": \"2025-09-20T23:05:47.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 56, \"activity_type\": \"collection_created\"}', 1, '2025-09-20 15:05:47'),
(58, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱-5,000.00', '{\"timestamp\": \"2025-09-20T23:07:13.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 57, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 15:07:13'),
(59, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '{\"timestamp\": \"2025-09-20T23:07:18.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 58, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-20 15:07:18'),
(60, 1, 'user_activity', '🔐 User Login', 'Marvic Pajaganas (Cashier) logged into the system', '{\"timestamp\": \"2025-09-21T21:26:01.000000Z\", \"user_name\": \"Marvic Pajaganas\", \"user_role\": \"Cashier\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 59, \"activity_type\": \"login\"}', 1, '2025-09-21 13:26:01'),
(61, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-21T21:26:08.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 60, \"activity_type\": \"login\"}', 1, '2025-09-21 13:26:08'),
(62, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: admin@gmail.com', '{\"timestamp\": \"2025-09-21T22:27:23.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 61, \"activity_type\": \"login_failed\"}', 1, '2025-09-21 14:27:23'),
(63, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: admin@gmail.com', '{\"timestamp\": \"2025-09-21T22:28:11.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 62, \"activity_type\": \"login_failed\"}', 1, '2025-09-21 14:28:11'),
(64, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-21T22:30:00.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 63, \"activity_type\": \"login\"}', 1, '2025-09-21 14:30:00'),
(65, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: admin@gmail.com', '{\"timestamp\": \"2025-09-21T22:38:48.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 64, \"activity_type\": \"login_failed\"}', 1, '2025-09-21 14:38:48'),
(66, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-21T22:39:12.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 65, \"activity_type\": \"login\"}', 1, '2025-09-21 14:39:12'),
(67, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: admin@gmail.com', '{\"timestamp\": \"2025-09-21T22:55:59.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 66, \"activity_type\": \"login_failed\"}', 1, '2025-09-21 14:55:59'),
(68, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-21T22:56:16.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 67, \"activity_type\": \"login\"}', 1, '2025-09-21 14:56:16'),
(69, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱-5,000.00', '{\"timestamp\": \"2025-09-21T22:57:04.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 68, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-21 14:57:04'),
(70, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to COKE Collection Account', '{\"timestamp\": \"2025-09-21T22:57:07.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 69, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-21 14:57:07'),
(71, 1, 'user_activity', '🏦 Fund Account Created', 'System Administrator (Admin) created fund account: sample', '{\"timestamp\": \"2025-09-21T23:12:49.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 70, \"activity_type\": \"fund_account_created\"}', 1, '2025-09-21 15:12:49'),
(72, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱-500.00', '{\"timestamp\": \"2025-09-21T23:24:58.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 71, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-21 15:24:58'),
(73, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to another sample', '{\"timestamp\": \"2025-09-21T23:25:03.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 72, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-21 15:25:03'),
(74, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-24T09:54:45.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 73, \"activity_type\": \"login\"}', 1, '2025-09-24 01:54:45'),
(75, 1, 'user_activity', '🔐 User Login', 'Jhoneca Jungoy (Collecting Officer) logged into the system', '{\"timestamp\": \"2025-09-24T09:56:55.000000Z\", \"user_name\": \"Jhoneca Jungoy\", \"user_role\": \"Collecting Officer\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 74, \"activity_type\": \"login\"}', 1, '2025-09-24 01:56:55'),
(76, 1, 'user_activity', '🔐 User Login', 'Marvic Pajaganas (Cashier) logged into the system', '{\"timestamp\": \"2025-09-24T10:03:58.000000Z\", \"user_name\": \"Marvic Pajaganas\", \"user_role\": \"Cashier\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 75, \"activity_type\": \"login\"}', 1, '2025-09-24 02:03:58'),
(77, 1, 'user_activity', '🔐 User Login', 'Ian Jane Butaslac (Disbursing Officer) logged into the system', '{\"timestamp\": \"2025-09-24T10:08:21.000000Z\", \"user_name\": \"Ian Jane Butaslac\", \"user_role\": \"Disbursing Officer\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 76, \"activity_type\": \"login\"}', 1, '2025-09-24 02:08:21'),
(78, 1, 'user_activity', '💳 Cheque Issued', 'Ian Jane Butaslac (Disbursing Officer) issued a cheque disbursement of ₱500.00 to another sample', '{\"timestamp\": \"2025-09-24T10:13:54.000000Z\", \"user_name\": \"Ian Jane Butaslac\", \"user_role\": \"Disbursing Officer\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 77, \"activity_type\": \"cheque_issued\"}', 1, '2025-09-24 02:13:54'),
(79, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: collector@gmail.com', '{\"timestamp\": \"2025-09-24T10:15:21.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 78, \"activity_type\": \"login_failed\"}', 1, '2025-09-24 02:15:21'),
(80, 1, 'user_activity', '🔐 User Login', 'Jhoneca Jungoy (Collecting Officer) logged into the system', '{\"timestamp\": \"2025-09-24T10:21:30.000000Z\", \"user_name\": \"Jhoneca Jungoy\", \"user_role\": \"Collecting Officer\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 79, \"activity_type\": \"login\"}', 1, '2025-09-24 02:21:30'),
(81, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-24T15:02:37.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 80, \"activity_type\": \"login\"}', 1, '2025-09-24 07:02:37'),
(82, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: cashier@gamil.com', '{\"timestamp\": \"2025-09-24T15:24:58.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 81, \"activity_type\": \"login_failed\"}', 1, '2025-09-24 07:24:58'),
(83, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: cashier@gamil.com', '{\"timestamp\": \"2025-09-24T15:25:14.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 82, \"activity_type\": \"login_failed\"}', 1, '2025-09-24 07:25:14'),
(84, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: cashier@gamil.com', '{\"timestamp\": \"2025-09-24T15:25:22.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 83, \"activity_type\": \"login_failed\"}', 1, '2025-09-24 07:25:22'),
(85, 1, 'user_activity', '🔐 User Login', 'Marvic Pajaganas (Cashier) logged into the system', '{\"timestamp\": \"2025-09-24T15:25:37.000000Z\", \"user_name\": \"Marvic Pajaganas\", \"user_role\": \"Cashier\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 84, \"activity_type\": \"login\"}', 1, '2025-09-24 07:25:38'),
(86, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-24T15:46:36.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 85, \"activity_type\": \"login\"}', 1, '2025-09-24 07:46:36'),
(87, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-24T16:34:50.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 86, \"activity_type\": \"login\"}', 1, '2025-09-24 08:34:50'),
(88, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) created a Disbursement transaction of ₱-1,000.00', '{\"timestamp\": \"2025-09-24T18:28:18.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 87, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-24 10:28:18'),
(89, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to lllllll', '{\"timestamp\": \"2025-09-24T18:28:24.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 88, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-24 10:28:24'),
(90, 1, 'user_activity', '💰 New Collection', 'System Administrator (Admin) created a Collection transaction of ₱1,000.00', '{\"timestamp\": \"2025-09-24T18:30:20.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 89, \"activity_type\": \"collection_created\"}', 1, '2025-09-24 10:30:20'),
(91, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to lololo', '{\"timestamp\": \"2025-09-24T18:30:26.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 90, \"activity_type\": \"disbursement_created\"}', 1, '2025-09-24 10:30:26'),
(92, 1, 'user_activity', '🔐 User Login', 'Marvic Pajaganas (Cashier) logged into the system', '{\"timestamp\": \"2025-09-24T18:55:23.000000Z\", \"user_name\": \"Marvic Pajaganas\", \"user_role\": \"Cashier\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 91, \"activity_type\": \"login\"}', 1, '2025-09-24 10:55:23'),
(93, 1, 'user_activity', '⚠️ Failed Login Attempt', 'Failed login attempt for email: admin@gmail.com', '{\"timestamp\": \"2025-09-24T18:57:03.000000Z\", \"user_name\": \"Unknown\", \"user_role\": \"Unknown\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 92, \"activity_type\": \"login_failed\"}', 1, '2025-09-24 10:57:03'),
(94, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-24T18:57:11.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 93, \"activity_type\": \"login\"}', 1, '2025-09-24 10:57:11'),
(95, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-25T00:25:58.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 94, \"activity_type\": \"login\"}', 1, '2025-09-24 16:25:58'),
(96, 1, 'user_activity', '🔐 User Login', 'System Administrator (Admin) logged into the system', '{\"timestamp\": \"2025-09-25T06:30:47.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 95, \"activity_type\": \"login\"}', 0, '2025-09-24 22:30:47'),
(97, 1, 'user_activity', '🏦 Fund Account Created', 'System Administrator (Admin) created fund account: f', '{\"timestamp\": \"2025-09-25T08:13:11.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 96, \"activity_type\": \"fund_account_created\"}', 0, '2025-09-25 00:13:11'),
(98, 1, 'user_activity', '💰 New Collection', 'System Administrator (Admin) created a Collection transaction of ₱10.00', '{\"timestamp\": \"2025-09-25T08:21:33.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 97, \"activity_type\": \"collection_created\"}', 0, '2025-09-25 00:21:33'),
(99, 1, 'user_activity', '💸 New Disbursement', 'System Administrator (Admin) issued a cash disbursement of ₱0.00 to another sample', '{\"timestamp\": \"2025-09-25T08:21:38.000000Z\", \"user_name\": \"System Administrator\", \"user_role\": \"Admin\", \"ip_address\": \"127.0.0.1\", \"activity_id\": 98, \"activity_type\": \"disbursement_created\"}', 0, '2025-09-25 00:21:38');

-- --------------------------------------------------------

--
-- Table structure for table `override_requests`
--

CREATE TABLE `override_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `transaction_id` bigint UNSIGNED NOT NULL,
  `requested_by` bigint UNSIGNED NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `changes` longtext COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint UNSIGNED DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(2, 'App\\Models\\User', 3, 'auth_token', '7884ea1a3013058f392333ae0bf8eafbdd251012cb092e6d7e5fadb40bea3ffd', '[\"*\"]', NULL, NULL, '2025-09-15 10:55:14', '2025-09-15 10:55:14'),
(3, 'App\\Models\\User', 3, 'auth_token', '8975511c0ca2df3255bb939727f2faf6127491951b0c47eecd602a0c805e7320', '[\"*\"]', NULL, NULL, '2025-09-15 10:55:20', '2025-09-15 10:55:20'),
(4, 'App\\Models\\User', 1, 'auth_token', '946010873d10776ee8fc705ae85bab1ef359a430e25b12ad14702f0288535667', '[\"*\"]', NULL, NULL, '2025-09-15 10:58:18', '2025-09-15 10:58:18'),
(5, 'App\\Models\\User', 2, 'auth_token', 'dec16bb367072f0f5212490fd90efef278d05c8dd237fd998f9f14f026b03033', '[\"*\"]', NULL, NULL, '2025-09-15 11:59:44', '2025-09-15 11:59:44'),
(6, 'App\\Models\\User', 2, 'auth_token', '86c587df43136a723110dc7d74de5d11c0e645f22877d2ff8919f1dfec8b16ae', '[\"*\"]', NULL, NULL, '2025-09-15 12:00:03', '2025-09-15 12:00:03'),
(7, 'App\\Models\\User', 3, 'auth_token', '25e741dafd54c92d285e8d6bfc174ae359fb444e3dfc2547dfc9d8adac60885b', '[\"*\"]', NULL, NULL, '2025-09-15 12:03:35', '2025-09-15 12:03:35'),
(8, 'App\\Models\\User', 3, 'auth_token', 'a6ddd88cf2865be1e7c8c14262884cd55dff29764d0b749194d700fcc0e0fd38', '[\"*\"]', NULL, NULL, '2025-09-15 12:05:34', '2025-09-15 12:05:34'),
(9, 'App\\Models\\User', 3, 'auth_token', '6c492990f54392a1c0b6e246b4d016943b36ff4d8d900a9ef21a27c3db37bb1c', '[\"*\"]', NULL, NULL, '2025-09-15 12:06:44', '2025-09-15 12:06:44'),
(10, 'App\\Models\\User', 2, 'auth_token', '1f0b18a999427b025a429510e17d6dac672ae4d3f6a6ed8a13c0787fa459e3cc', '[\"*\"]', NULL, NULL, '2025-09-15 12:07:05', '2025-09-15 12:07:05'),
(11, 'App\\Models\\User', 2, 'auth_token', 'e9339edc012b88dd396a0cdc64ad88d15fc5f00662240996c97221f558925084', '[\"*\"]', NULL, NULL, '2025-09-15 12:08:38', '2025-09-15 12:08:38'),
(12, 'App\\Models\\User', 2, 'auth_token', '32a69199b90cd60b2abe902bf1fd62ffac4e5449e894198f1d356ace6e5196cd', '[\"*\"]', NULL, NULL, '2025-09-15 12:13:03', '2025-09-15 12:13:03'),
(13, 'App\\Models\\User', 2, 'auth_token', '331a4ca2163e1686e183689503a996aa03fa7c027bd9cd69d4d498ec541a7c3e', '[\"*\"]', NULL, NULL, '2025-09-15 12:58:47', '2025-09-15 12:58:47'),
(14, 'App\\Models\\User', 5, 'auth_token', '618ede0e0f52f68b4fd84b72183e1221e90b38b7a4932b7c17619b4319ac0d41', '[\"*\"]', NULL, NULL, '2025-09-15 16:24:29', '2025-09-15 16:24:29'),
(15, 'App\\Models\\User', 5, 'auth_token', '623a5d90e8d12ca38ae3c7a221285c171c5742a12a9b24ad904e61db2bf78677', '[\"*\"]', NULL, NULL, '2025-09-15 17:06:19', '2025-09-15 17:06:19'),
(16, 'App\\Models\\User', 13, 'auth_token', '2d1bde7fb7af8913eb4c2f64a82a6a9af1602129cb3002d811d1a8aeebef66ce', '[\"*\"]', NULL, NULL, '2025-09-15 18:22:37', '2025-09-15 18:22:37'),
(17, 'App\\Models\\User', 13, 'auth_token', 'eeebdefa3f3465728ec1a0ef049fd2472aaaf49197c7376e5279e586fa2d719a', '[\"*\"]', NULL, NULL, '2025-09-15 18:22:52', '2025-09-15 18:22:52'),
(18, 'App\\Models\\User', 13, 'auth_token', '9ff8e756ee31f38e78bfa67243d980712dbf1eb2c74d39a486a08ceb60e47710', '[\"*\"]', NULL, NULL, '2025-09-15 18:23:10', '2025-09-15 18:23:10'),
(19, 'App\\Models\\User', 4, 'auth_token', '462fe27904f72fadac031dc27c73e2e736136cdf2aab6cdc9a446ed7a35822a7', '[\"*\"]', NULL, NULL, '2025-09-16 06:50:37', '2025-09-16 06:50:37'),
(20, 'App\\Models\\User', 3, 'auth_token', '9e88ae2c91d1f6653ac28929124558296acc75268a5394fec1e1a4f795d1d112', '[\"*\"]', NULL, NULL, '2025-09-16 06:50:51', '2025-09-16 06:50:51'),
(21, 'App\\Models\\User', 2, 'auth_token', 'e9a612fbea96660628ba13137dba8c5e679785b2fe9a7bc8074d93f80d83849f', '[\"*\"]', NULL, NULL, '2025-09-16 06:51:09', '2025-09-16 06:51:09'),
(22, 'App\\Models\\User', 21, 'auth_token', 'b2a4123a4e469ac77e847b4c3f8bc826d1ebc26ad731971ca0f724e137d954d8', '[\"*\"]', NULL, NULL, '2025-09-16 06:51:46', '2025-09-16 06:51:46'),
(23, 'App\\Models\\User', 21, 'auth_token', '35e5b5bf6e851237ef1beadea4f436f652cfbc9e1ebcaa664567c14738971746', '[\"*\"]', NULL, NULL, '2025-09-16 06:52:14', '2025-09-16 06:52:14'),
(24, 'App\\Models\\User', 22, 'auth_token', 'f76a1239cd54ea2c8c86fc4c3956544a92cc16eeaa0fd4a466c6feca2c12d5b8', '[\"*\"]', NULL, NULL, '2025-09-16 06:55:15', '2025-09-16 06:55:15'),
(25, 'App\\Models\\User', 22, 'auth_token', '36f36c1c4fdf4ae7299ab80acd2f65b2a18941dd8af654da236209a4ce662365', '[\"*\"]', NULL, NULL, '2025-09-16 07:01:46', '2025-09-16 07:01:46'),
(26, 'App\\Models\\User', 2, 'auth_token', 'bc31193fe0632502f7cb35bba5bc402572bea1c42cd7705723e359bda803d0c7', '[\"*\"]', NULL, NULL, '2025-09-16 07:07:54', '2025-09-16 07:07:54'),
(27, 'App\\Models\\User', 22, 'auth_token', '489d8a0d1a9b04e36b6807aa6e63e5f6c339c55c48f6715cbeb2ec7297d3a017', '[\"*\"]', NULL, NULL, '2025-09-16 07:10:02', '2025-09-16 07:10:02'),
(28, 'App\\Models\\User', 1, 'auth_token', '97253edf654158425da754e5f576b615a2a1f7c4d3bbf5c1e426357e9619bc6f', '[\"*\"]', NULL, NULL, '2025-09-16 07:28:55', '2025-09-16 07:28:55'),
(29, 'App\\Models\\User', 2, 'auth_token', 'de793773a8192692be3e4e7079a219faabbd17e9d871a7991c09f6c34df46890', '[\"*\"]', NULL, NULL, '2025-09-16 07:29:24', '2025-09-16 07:29:24'),
(30, 'App\\Models\\User', 4, 'auth_token', '75b3799a7e9d76bb1d6119e870e9c9159422e1453f8d2ba293e816d6fe1f2a98', '[\"*\"]', NULL, NULL, '2025-09-16 07:32:30', '2025-09-16 07:32:30'),
(31, 'App\\Models\\User', 1, 'auth_token', '1159556718a609181c9c9f50f3a7389f924703f6e8116f9001ede83518276a60', '[\"*\"]', NULL, NULL, '2025-09-16 07:52:20', '2025-09-16 07:52:20'),
(32, 'App\\Models\\User', 21, 'auth_token', 'a56edca64b5abdc7fd6b2be0cc00a5821a168fd5eac3180e598bcba87943a2ae', '[\"*\"]', NULL, NULL, '2025-09-16 07:59:58', '2025-09-16 07:59:58'),
(33, 'App\\Models\\User', 21, 'auth_token', '44a1cb3fe6136c265fdb69a655d1557a7b2ffa51550be3b504665e93fc45188d', '[\"*\"]', NULL, NULL, '2025-09-16 08:02:58', '2025-09-16 08:02:58'),
(34, 'App\\Models\\User', 21, 'auth_token', 'a1914e2b55c1a4fa7a159286c6e7a0e8dc6dbb319740b2083acb178f7395902f', '[\"*\"]', NULL, NULL, '2025-09-16 08:04:50', '2025-09-16 08:04:50'),
(35, 'App\\Models\\User', 21, 'auth_token', 'ed113bd5c63c34c7aff11b43d6b1d3b8a393d43f9b207567d44da20b5d329dfa', '[\"*\"]', NULL, NULL, '2025-09-16 08:28:25', '2025-09-16 08:28:25'),
(36, 'App\\Models\\User', 21, 'auth_token', '79e9036c56093a04ff5025f4781a8ccf6251a21929cc6a98d09e8a5d9722c0b1', '[\"*\"]', NULL, NULL, '2025-09-16 08:37:37', '2025-09-16 08:37:37'),
(37, 'App\\Models\\User', 21, 'auth_token', '6506e4781f959011072f51699638a7014dada48abc4959628492ff0b328fa7a4', '[\"*\"]', NULL, NULL, '2025-09-16 08:41:20', '2025-09-16 08:41:20'),
(38, 'App\\Models\\User', 21, 'auth_token', 'a096d2b0f9ac0e100bc7581fec61f8fab62ceeb8fe52b5764a72cfd0d134ea99', '[\"*\"]', NULL, NULL, '2025-09-16 08:43:32', '2025-09-16 08:43:32'),
(39, 'App\\Models\\User', 21, 'auth_token', '52cedd05ce581ed1325e9bcf5f25bd43d8365dfd0f4b96884ec757aa2866922c', '[\"*\"]', NULL, NULL, '2025-09-16 08:45:47', '2025-09-16 08:45:47'),
(40, 'App\\Models\\User', 21, 'auth_token', 'c913e49d47324ad8befb48a672af506fdca64d58c9a0cf00508879ecc7f36138', '[\"*\"]', NULL, NULL, '2025-09-16 08:48:54', '2025-09-16 08:48:54'),
(41, 'App\\Models\\User', 21, 'auth_token', '68b931287c60c69879ea136ce9874f97db8e728c8bc4baa507e2abc571036b70', '[\"*\"]', NULL, NULL, '2025-09-16 08:50:38', '2025-09-16 08:50:38'),
(42, 'App\\Models\\User', 21, 'auth_token', 'ef233e905b3dd5f90ffbf0209c12cd062ca29c6fe869447ba42b01dd8bd33a67', '[\"*\"]', NULL, NULL, '2025-09-16 08:53:59', '2025-09-16 08:53:59'),
(43, 'App\\Models\\User', 1, 'auth_token', '909b528823c38f639443c02a07ea135d640f658fe298d95609d7ad3fd74ac69c', '[\"*\"]', NULL, NULL, '2025-09-16 08:54:56', '2025-09-16 08:54:56'),
(44, 'App\\Models\\User', 21, 'auth_token', 'cc46af2a465b05340da82e777ab9bd9cb0fc6a9676362e6a5ad7b711273655d1', '[\"*\"]', NULL, NULL, '2025-09-16 09:00:34', '2025-09-16 09:00:34'),
(45, 'App\\Models\\User', 21, 'auth_token', '0868b31050020c5bf98db14f14eb6a8240f4fa25a5bef21cda6f7f70d2d6a4dd', '[\"*\"]', NULL, NULL, '2025-09-16 09:01:49', '2025-09-16 09:01:49'),
(46, 'App\\Models\\User', 1, 'auth_token', '4c8cd5433f269c44f9b54299436f862c41d1b19d4db1e87456e0f7c5218d1268', '[\"*\"]', NULL, NULL, '2025-09-16 09:03:35', '2025-09-16 09:03:35'),
(47, 'App\\Models\\User', 21, 'auth_token', 'c29d1bd3cc8a0466a889691b8b31b1d78a53d5f57a74eb33d9a45709a13b503d', '[\"*\"]', NULL, NULL, '2025-09-16 09:05:53', '2025-09-16 09:05:53'),
(48, 'App\\Models\\User', 1, 'auth_token', '79bf7a2238209796f27b050cff4a44cee2ff59e85022fe33ace43e786c216d63', '[\"*\"]', NULL, NULL, '2025-09-16 09:11:18', '2025-09-16 09:11:18'),
(49, 'App\\Models\\User', 21, 'auth_token', 'cb1827051c4c59715250a30c5655fae5da638c87a6c9e4f7f2c191d229673098', '[\"*\"]', NULL, NULL, '2025-09-16 09:14:03', '2025-09-16 09:14:03'),
(50, 'App\\Models\\User', 1, 'auth_token', '600bd23db77452a7a41d312a93ae8f1ad99f472619b3c421ecb3c3396a283b79', '[\"*\"]', NULL, NULL, '2025-09-16 09:14:24', '2025-09-16 09:14:24'),
(51, 'App\\Models\\User', 22, 'auth_token', 'ed5eec9961470136357ed172f84108d93c6d112c2b88bd15a11e31e9e9e2f782', '[\"*\"]', NULL, NULL, '2025-09-16 09:14:40', '2025-09-16 09:14:40'),
(52, 'App\\Models\\User', 21, 'auth_token', 'bbb00dfc1db1beee03ecb9030fc173d3a08bc58deaeb048603639a660d6bf61c', '[\"*\"]', NULL, NULL, '2025-09-16 10:16:51', '2025-09-16 10:16:51'),
(53, 'App\\Models\\User', 1, 'auth_token', '77f9c93eff8d2fe958b782110add93f26ec357a83a131471ee3b22149326f5d5', '[\"*\"]', NULL, NULL, '2025-09-16 10:30:18', '2025-09-16 10:30:18'),
(54, 'App\\Models\\User', 1, 'auth_token', 'e02cc81a2a0c2e2e8b725a1786abec8e0fa162f46e163b24207d77ee94a71cde', '[\"*\"]', NULL, NULL, '2025-09-16 10:47:41', '2025-09-16 10:47:41'),
(55, 'App\\Models\\User', 21, 'auth_token', '148388130b4aaf1a275d827fb7e8934a6be1be6e07ef9afc099dc8fcaebff40f', '[\"*\"]', NULL, NULL, '2025-09-16 10:54:38', '2025-09-16 10:54:38'),
(56, 'App\\Models\\User', 22, 'auth_token', 'd1634aa03c7037cd1fdf1aa422a484e81ad4d1b3b19686d7e1c2a048113bd0b6', '[\"*\"]', NULL, NULL, '2025-09-16 10:57:53', '2025-09-16 10:57:53'),
(57, 'App\\Models\\User', 1, 'auth_token', '53b068b89169a242be60bd25d390e272f28e91840a1bdd520772c74bab9c5ac9', '[\"*\"]', NULL, NULL, '2025-09-16 11:04:42', '2025-09-16 11:04:42'),
(58, 'App\\Models\\User', 1, 'auth_token', 'aa0657e66f4d74872c06bd0c2ea29c65c613d117867479a62565f97b4d7e61ce', '[\"*\"]', NULL, NULL, '2025-09-16 11:29:10', '2025-09-16 11:29:10'),
(59, 'App\\Models\\User', 22, 'auth_token', 'b6b7a09b94927d437f3f98f6c1fb6f7816c250d6fd0f082a73cecbcc90ec9e90', '[\"*\"]', NULL, NULL, '2025-09-16 11:30:11', '2025-09-16 11:30:11'),
(60, 'App\\Models\\User', 1, 'auth_token', '6291d70018fa076adff6f7f0de53400219a110b840f98addfa01beb09b4e4a10', '[\"*\"]', NULL, NULL, '2025-09-16 11:35:59', '2025-09-16 11:35:59'),
(61, 'App\\Models\\User', 2, 'auth_token', '0a351f5bbbb04b4db515ba80c5d969f843db448f127fc2eb2fd079ab5ad9cb1f', '[\"*\"]', NULL, NULL, '2025-09-16 11:40:21', '2025-09-16 11:40:21'),
(62, 'App\\Models\\User', 3, 'auth_token', '78a459056f1abbda033d9059163a1ad83ef0a21037120d3cd3ff23248395fee2', '[\"*\"]', NULL, NULL, '2025-09-16 11:41:12', '2025-09-16 11:41:12'),
(63, 'App\\Models\\User', 1, 'auth_token', 'cc9ee724c04a85ae0dcffe30d19d4807b02c3773bd277f7ca4548bc6147547e5', '[\"*\"]', NULL, NULL, '2025-09-16 11:58:23', '2025-09-16 11:58:23'),
(64, 'App\\Models\\User', 3, 'auth_token', '3fe23004d85420ac3f4b478c8f0ed594777e6cbce981f737185a3cd62d0601c9', '[\"*\"]', NULL, NULL, '2025-09-16 12:24:19', '2025-09-16 12:24:19'),
(65, 'App\\Models\\User', 2, 'auth_token', 'aac991cbfd6dbb84933a4a26ffe965af22ca59b3aed4688697236795c6d84ee1', '[\"*\"]', NULL, NULL, '2025-09-16 12:24:48', '2025-09-16 12:24:48'),
(66, 'App\\Models\\User', 1, 'auth_token', 'ce6019dd12a7ca482dcb6d9971dff284a25d2119cc05f620d077357a8d6d8f9f', '[\"*\"]', NULL, NULL, '2025-09-16 12:25:07', '2025-09-16 12:25:07'),
(67, 'App\\Models\\User', 3, 'auth_token', '7f9d18b368b30378697ba550a4b44f1e63c9674435fe86a49076d43d2d16a64b', '[\"*\"]', NULL, NULL, '2025-09-16 12:33:45', '2025-09-16 12:33:45'),
(68, 'App\\Models\\User', 1, 'auth_token', '67aa43514734ab0b3e7f2d7aaefa583575cb86a8a1cd3eb951514076a1ac17f3', '[\"*\"]', NULL, NULL, '2025-09-16 12:34:27', '2025-09-16 12:34:27'),
(69, 'App\\Models\\User', 2, 'auth_token', 'dff14dc7c43c3bed6357e15c6a7a2f20288a91e2c0804757f4ab69c1e481bf38', '[\"*\"]', NULL, NULL, '2025-09-16 12:36:30', '2025-09-16 12:36:30'),
(70, 'App\\Models\\User', 1, 'auth_token', 'aa4ac6239d0a6881b8b6d4a7ec73e90377385370206f9fabc9852893993bbd0d', '[\"*\"]', NULL, NULL, '2025-09-16 12:36:55', '2025-09-16 12:36:55'),
(71, 'App\\Models\\User', 2, 'auth_token', '0c4aac4cbb32156869cbe5e4f3c5d1c1f37e8b5f8fb42a1d714c2727ac81cd4d', '[\"*\"]', NULL, NULL, '2025-09-16 12:38:35', '2025-09-16 12:38:35'),
(72, 'App\\Models\\User', 4, 'auth_token', '60d936c354807d01be79e6b9d1e075be7491f92ff5338e233a6e9978cd6683a3', '[\"*\"]', NULL, NULL, '2025-09-16 12:48:00', '2025-09-16 12:48:00'),
(73, 'App\\Models\\User', 2, 'auth_token', '2adc73ac475d9c4e683a00d984b93b500bdac3c794db535ae9bd544c36776062', '[\"*\"]', NULL, NULL, '2025-09-16 12:51:34', '2025-09-16 12:51:34'),
(74, 'App\\Models\\User', 1, 'auth_token', '9a87e7f7959b56aafd65c2b8df3ca136b47e21f3704935c15bd29d9023e10ddc', '[\"*\"]', NULL, NULL, '2025-09-16 12:55:29', '2025-09-16 12:55:29'),
(75, 'App\\Models\\User', 2, 'auth_token', '34f4f10ec24d05f4dc4ca5fa9b241741fa963541cf562925014a4125043e8ce1', '[\"*\"]', NULL, NULL, '2025-09-16 12:55:49', '2025-09-16 12:55:49'),
(76, 'App\\Models\\User', 4, 'auth_token', 'fbaf79c081245f3e27281981ebab11fe277a3b422337f5cacae22f25f2e8b6b5', '[\"*\"]', NULL, NULL, '2025-09-16 13:11:23', '2025-09-16 13:11:23'),
(77, 'App\\Models\\User', 4, 'auth_token', 'ac152d70976a17b309ceeb960fadbb006088f7b7d0d6679f4e9f58acbe092ba2', '[\"*\"]', NULL, NULL, '2025-09-16 22:58:01', '2025-09-16 22:58:01'),
(78, 'App\\Models\\User', 2, 'auth_token', '31a268846d9de86a8c692cd57d7a15b2eccbc5081f41a9faaca78d7ea0a66ddd', '[\"*\"]', NULL, NULL, '2025-09-16 22:58:26', '2025-09-16 22:58:26'),
(79, 'App\\Models\\User', 3, 'auth_token', '23cfc8216a156752a3ca2563c8f190bf9a962a6cf91b6e9d866c3472f5bf9449', '[\"*\"]', NULL, NULL, '2025-09-16 22:59:42', '2025-09-16 22:59:42'),
(80, 'App\\Models\\User', 1, 'auth_token', 'f97ed9e6927b354045c3ccede9e11bca732f2b527d98a09315dd925d47bea9ae', '[\"*\"]', NULL, NULL, '2025-09-16 23:00:02', '2025-09-16 23:00:02'),
(81, 'App\\Models\\User', 4, 'auth_token', '486c0f46ea3d9f0f676f692177abf5de5d5906385dc0df2f00f5214adfd3663f', '[\"*\"]', NULL, NULL, '2025-09-17 00:15:36', '2025-09-17 00:15:36'),
(82, 'App\\Models\\User', 1, 'auth_token', 'b73c46d2da221078afc3d76cd5a0ee964f3f8956b6241d58986678bf0c5b0dee', '[\"*\"]', NULL, NULL, '2025-09-17 00:17:32', '2025-09-17 00:17:32'),
(83, 'App\\Models\\User', 4, 'auth_token', 'a3963b2b0d0629b99c318d0dd6aa487f095e480f22a23ec5ca831190b3404081', '[\"*\"]', NULL, NULL, '2025-09-17 00:18:18', '2025-09-17 00:18:18'),
(84, 'App\\Models\\User', 4, 'auth_token', '3d1649fdd984d17456badd007a20d221f843e45e0185f61cabe829e44d469c23', '[\"*\"]', NULL, NULL, '2025-09-17 00:19:48', '2025-09-17 00:19:48'),
(85, 'App\\Models\\User', 4, 'auth_token', 'a7b5c2b849caec50b67979a9b5e840f5b1a8e656dbac4f65e2581c11337be987', '[\"*\"]', NULL, NULL, '2025-09-17 00:52:22', '2025-09-17 00:52:22'),
(86, 'App\\Models\\User', 4, 'auth_token', 'f79015262eaf8313422c8a944ebfd107719fc96a7a67415d257a6c9153b6af1a', '[\"*\"]', NULL, NULL, '2025-09-17 00:54:48', '2025-09-17 00:54:48'),
(87, 'App\\Models\\User', 1, 'auth_token', 'f624346671084508e7a2c1e1c20d29418dc5a6b737793f9b41c23b780a474cbf', '[\"*\"]', NULL, NULL, '2025-09-17 00:56:18', '2025-09-17 00:56:18'),
(88, 'App\\Models\\User', 1, 'auth_token', 'c6a6027bf1683cbd20759c23bd0f718ffcd9c30bda2d7796dd6354ea2b1c77e2', '[\"*\"]', NULL, NULL, '2025-09-17 00:57:50', '2025-09-17 00:57:50'),
(89, 'App\\Models\\User', 1, 'auth_token', 'f581d1d483c211ceffff6a5914b8a5e53518c04d33eabeb0b72fc11ce81f0ab3', '[\"*\"]', NULL, NULL, '2025-09-17 01:02:46', '2025-09-17 01:02:46'),
(90, 'App\\Models\\User', 1, 'auth_token', 'b092da98731587c7fc745956b9b5f4d34473ffb5f23ffc969f5c693620424f88', '[\"*\"]', NULL, NULL, '2025-09-17 01:04:20', '2025-09-17 01:04:20'),
(91, 'App\\Models\\User', 1, 'auth_token', '1d9387a20fdfb6e109d610688bcc75a7b8066608da00d3ccbe363a5362424697', '[\"*\"]', NULL, NULL, '2025-09-17 01:04:24', '2025-09-17 01:04:24'),
(92, 'App\\Models\\User', 1, 'auth_token', '605b415549cff82ca7a3b5da5a1a5681903c54f5e6b967bc677b190ffe0fb580', '[\"*\"]', NULL, NULL, '2025-09-17 01:04:26', '2025-09-17 01:04:26'),
(93, 'App\\Models\\User', 1, 'auth_token', 'c90d49cda38ef84337410dfb524d3c49a373b40ad9ad1b6628304d929a663a66', '[\"*\"]', NULL, NULL, '2025-09-17 01:04:34', '2025-09-17 01:04:34'),
(94, 'App\\Models\\User', 1, 'auth_token', 'b718ad60f623da67869baa995561cb85ffc3439f05602fbd647f7d678b875f2d', '[\"*\"]', NULL, NULL, '2025-09-17 01:06:28', '2025-09-17 01:06:28'),
(95, 'App\\Models\\User', 1, 'auth_token', '935aaf526ae0f5ceb21541e66b0f18656fdcc819dff5cab4c048efcad3fbeb93', '[\"*\"]', NULL, NULL, '2025-09-17 01:14:06', '2025-09-17 01:14:06'),
(96, 'App\\Models\\User', 1, 'auth_token', '4e9c51aae8ff83e6389668e85246bab43c083d6722491301f0b0480895aa9c55', '[\"*\"]', NULL, NULL, '2025-09-17 01:16:24', '2025-09-17 01:16:24'),
(97, 'App\\Models\\User', 1, 'auth_token', '7a5f988696c5b496e359847bc468a33dc37f3b462327122d886e55ee0fc92998', '[\"*\"]', NULL, NULL, '2025-09-17 01:16:44', '2025-09-17 01:16:44'),
(98, 'App\\Models\\User', 1, 'auth_token', '8c6cf81c356355bcc46296b0097606a027613b54dec89d6c7fda2d647b7f11c1', '[\"*\"]', NULL, NULL, '2025-09-17 01:17:07', '2025-09-17 01:17:07'),
(99, 'App\\Models\\User', 1, 'auth_token', 'b7571a2826a220a54d5a55054cdd8ad13aa561dba2c7d53b8cba31d2636048dd', '[\"*\"]', NULL, NULL, '2025-09-17 01:18:30', '2025-09-17 01:18:30'),
(100, 'App\\Models\\User', 1, 'auth_token', '88ca0aac5e56f54fc33b2a640d91a3c46c37011097e97cd7b2dc422f1a2214ba', '[\"*\"]', NULL, NULL, '2025-09-17 01:19:47', '2025-09-17 01:19:47'),
(101, 'App\\Models\\User', 1, 'auth_token', 'f556de8805707b3fa8c4875ebb829328f1ecb3653b90dc0941f0528c580422e2', '[\"*\"]', NULL, NULL, '2025-09-17 01:21:02', '2025-09-17 01:21:02'),
(102, 'App\\Models\\User', 1, 'auth_token', '327d19ed053946fd20be57f8e021b49fdfcb5a98d4376e3f6e30d1048d958df8', '[\"*\"]', NULL, NULL, '2025-09-17 01:22:43', '2025-09-17 01:22:43'),
(103, 'App\\Models\\User', 4, 'auth_token', '0602d0d0893a67c254aaeb4f4941eb16407cd4f0ddb2c33223f27dfff909edc6', '[\"*\"]', NULL, NULL, '2025-09-17 01:23:55', '2025-09-17 01:23:55'),
(104, 'App\\Models\\User', 1, 'auth_token', 'b6387c434756a6c05230f17b6c75852cc104206aa3fbb176fbbce500f241b8a1', '[\"*\"]', NULL, NULL, '2025-09-17 01:26:32', '2025-09-17 01:26:32'),
(105, 'App\\Models\\User', 4, 'auth_token', '0d8daadf189c1432856bdeab17e9d20fe1ba4bdef76100a42fff863521c05b41', '[\"*\"]', NULL, NULL, '2025-09-17 01:27:14', '2025-09-17 01:27:14'),
(106, 'App\\Models\\User', 1, 'auth_token', '2a1f0c9b710b754e5dd38cd1bfa0bc4a7daa7f348d01783fb61ba0c8d16182cc', '[\"*\"]', NULL, NULL, '2025-09-17 01:32:19', '2025-09-17 01:32:19'),
(107, 'App\\Models\\User', 3, 'auth_token', '448af6047e970e92a84d86c8022bceb7fbab824347cbd6e3c3303b31fa59b09d', '[\"*\"]', NULL, NULL, '2025-09-17 01:33:01', '2025-09-17 01:33:01'),
(108, 'App\\Models\\User', 2, 'auth_token', 'b934f908b9339fec7722891f398b82b592bc879f3f6770e5e19fd8093bebc94a', '[\"*\"]', NULL, NULL, '2025-09-17 01:33:41', '2025-09-17 01:33:41'),
(109, 'App\\Models\\User', 1, 'auth_token', '4553f85c74717d508bff6765b895618137d0587dc268182310cf78d38c9e91f2', '[\"*\"]', '2025-09-17 04:27:52', NULL, '2025-09-17 03:29:19', '2025-09-17 04:27:52'),
(110, 'App\\Models\\User', 4, 'auth_token', '3edf93d54ce2cc84741499d2b87ad8f7fb24871deab645765fbace703f4333a1', '[\"*\"]', '2025-09-17 11:03:38', NULL, '2025-09-17 03:29:44', '2025-09-17 11:03:38'),
(111, 'App\\Models\\User', 3, 'auth_token', '78e8b08b0d0546390b4f2279a2e39bbf1675dc49ee3b52ecd3ddf7516f79b979', '[\"*\"]', '2025-09-17 11:28:15', NULL, '2025-09-17 03:30:14', '2025-09-17 11:28:15'),
(112, 'App\\Models\\User', 2, 'auth_token', 'e5b2a4a32061be93af6b57b76668044884a1dff9c2465db66fb1b49873652f3b', '[\"*\"]', '2025-09-17 11:28:20', NULL, '2025-09-17 03:31:24', '2025-09-17 11:28:20'),
(113, 'App\\Models\\User', 24, 'auth_token', '776b90fc4c78e7ac07d8be2d7676b18ddcc13512f9e40f7d7002f25ea88abe04', '[\"*\"]', '2025-09-17 07:03:02', NULL, '2025-09-17 04:27:38', '2025-09-17 07:03:02'),
(114, 'App\\Models\\User', 1, 'auth_token', 'bc2d86ce612d6f59b8cfe1753b48eec5be93839c78a219e7f7dbd529b1545a51', '[\"*\"]', '2025-09-17 11:03:01', NULL, '2025-09-17 04:28:21', '2025-09-17 11:03:01'),
(115, 'App\\Models\\User', 4, 'auth_token', '8842e16d10292dd690ff0683f3d0e03a52215d863c330af3024d0d196374b4aa', '[\"*\"]', '2025-09-17 11:28:12', NULL, '2025-09-17 11:06:35', '2025-09-17 11:28:12'),
(116, 'App\\Models\\User', 1, 'auth_token', '70e48f36a10efc9fa5205b9b6b3003d2d9c8d53c0c3de70f1fe97f1959dc40ad', '[\"*\"]', NULL, NULL, '2025-09-17 12:45:05', '2025-09-17 12:45:05'),
(117, 'App\\Models\\User', 1, 'auth_token', 'f31357440292ee2a21f78c7c3da8691dfd34eace4cd7f3eeb8b0ca2a4bef3d29', '[\"*\"]', NULL, NULL, '2025-09-17 12:51:53', '2025-09-17 12:51:53'),
(118, 'App\\Models\\User', 1, 'auth_token', '0f6e6eeb36825ceeb5aa7ca4e0505a8d323131d2a50d3279a0775b94537ad8ad', '[\"*\"]', NULL, NULL, '2025-09-17 12:54:24', '2025-09-17 12:54:24'),
(119, 'App\\Models\\User', 1, 'auth_token', '0f8c7b421be597108c4e3c519f3c345f12121b6f0c64480a51f3968e782e01af', '[\"*\"]', '2025-09-17 13:09:15', NULL, '2025-09-17 13:09:02', '2025-09-17 13:09:15'),
(120, 'App\\Models\\User', 1, 'auth_token', '2fc897cafa42293ab642d8137ecd0e475567fd200b2482253073839534f23f46', '[\"*\"]', '2025-09-17 13:44:58', NULL, '2025-09-17 13:18:43', '2025-09-17 13:44:58'),
(121, 'App\\Models\\User', 1, 'auth_token', 'f85ae3f044e6850a889085977b97420840bfa93a8b5ff0b04b87ecf29ff878c8', '[\"*\"]', '2025-09-17 14:27:19', NULL, '2025-09-17 14:07:24', '2025-09-17 14:27:19'),
(122, 'App\\Models\\User', 1, 'auth_token', '6cbfcd2986ee1a7c96da1225ef8b25b16f666a305900be92953f3fbb8a314e3c', '[\"*\"]', '2025-09-17 14:33:35', NULL, '2025-09-17 14:33:06', '2025-09-17 14:33:35'),
(123, 'App\\Models\\User', 1, 'auth_token', '7b261a61269c866bce3dd96eec58313531e9d613c8be650f419d8bef3d439d88', '[\"*\"]', NULL, NULL, '2025-09-17 16:01:18', '2025-09-17 16:01:18'),
(124, 'App\\Models\\User', 1, 'auth_token', 'a39c950548ce71c4c592979151c9affcbec70c1629950d0d7b6aaf75351c21f4', '[\"*\"]', NULL, NULL, '2025-09-17 16:01:35', '2025-09-17 16:01:35'),
(125, 'App\\Models\\User', 1, 'auth_token', 'cc3ce0590c65b5d6e72f9f7c361f1b06e53393211a2c7d203ba14b4d10a11f61', '[\"*\"]', '2025-09-17 16:09:29', NULL, '2025-09-17 16:02:18', '2025-09-17 16:09:29'),
(126, 'App\\Models\\User', 1, 'auth_token', 'f8b0c3c56457df6aa6e6a32a5bea177777304d2971216779c6ae07edeacccd78', '[\"*\"]', NULL, NULL, '2025-09-17 16:12:14', '2025-09-17 16:12:14'),
(127, 'App\\Models\\User', 1, 'auth_token', '8c8075379b36c3cf57915613ebcedcec50351a1fc9e4eb181a343c865857383c', '[\"*\"]', '2025-09-17 16:20:12', NULL, '2025-09-17 16:19:32', '2025-09-17 16:20:12'),
(128, 'App\\Models\\User', 1, 'auth_token', 'e7cb0d5aabda7caf365f3168ced740010a6fbdf3a13f9b7776076cde7d31f117', '[\"*\"]', NULL, NULL, '2025-09-17 16:34:33', '2025-09-17 16:34:33'),
(129, 'App\\Models\\User', 1, 'auth_token', '63f5acb82a69a2edd25ff83686ac6538296639946f2888b9f4e96e3072098b8d', '[\"*\"]', NULL, NULL, '2025-09-17 16:38:25', '2025-09-17 16:38:25'),
(130, 'App\\Models\\User', 1, 'auth_token', '8906816796e71f4a2bbf80ef02a223195abc59be1e5840cfd16a70d5da3e1f7c', '[\"*\"]', '2025-09-17 16:41:16', NULL, '2025-09-17 16:40:35', '2025-09-17 16:41:16'),
(131, 'App\\Models\\User', 4, 'auth_token', '44f7da8eaf642f37652e7e46318d15cf04b17238a026f13d4abbabd55666c443', '[\"*\"]', NULL, NULL, '2025-09-17 16:41:53', '2025-09-17 16:41:53'),
(132, 'App\\Models\\User', 1, 'auth_token', 'c994aa166653e5aee6d1abb036cff1dc5e90738d7d2191b32a0fd9bba8653b2b', '[\"*\"]', '2025-09-17 16:42:43', NULL, '2025-09-17 16:42:30', '2025-09-17 16:42:43'),
(133, 'App\\Models\\User', 1, 'auth_token', '88f75f143d5be18addb6e439d5c31417f5f3ca5e734964415a6eb9daf5001561', '[\"*\"]', '2025-09-17 16:50:26', NULL, '2025-09-17 16:42:54', '2025-09-17 16:50:26'),
(134, 'App\\Models\\User', 4, 'auth_token', 'e7175781440cf97ffaf23f0a7657641ce43d8fa8b3b69df251c252849cacc3cc', '[\"*\"]', '2025-09-17 18:42:16', NULL, '2025-09-17 16:51:53', '2025-09-17 18:42:16'),
(135, 'App\\Models\\User', 1, 'auth_token', '25d5f6ed92151da4bcaa4ba00c467af63fa23289a7bd90f6c60f847d0d21d9fd', '[\"*\"]', '2025-09-17 16:54:28', NULL, '2025-09-17 16:52:30', '2025-09-17 16:54:28'),
(136, 'App\\Models\\User', 3, 'auth_token', '4f35b73e9b01b47e6dc2900e93321d3439f8ea80afb922d0ce24f8f9fbef2c09', '[\"*\"]', '2025-09-17 17:10:30', NULL, '2025-09-17 16:53:07', '2025-09-17 17:10:30'),
(137, 'App\\Models\\User', 2, 'auth_token', 'a4a00511efbf7ea213988ef70513c933e81b1c79c9ee287c4f84ca6d8c48071a', '[\"*\"]', '2025-09-17 17:10:13', NULL, '2025-09-17 16:53:33', '2025-09-17 17:10:13'),
(138, 'App\\Models\\User', 1, 'auth_token', '8ea23bf696b6e49cc952198de3d6b993d9d9a8c902c2d7ff872bf0c424754d54', '[\"*\"]', '2025-09-17 23:31:10', NULL, '2025-09-17 23:28:48', '2025-09-17 23:31:10'),
(139, 'App\\Models\\User', 1, 'auth_token', '0310c9865dec15af79a42b81b53e977ec2eb59ac68a1adf02218e6f8115ee336', '[\"*\"]', '2025-09-18 12:41:25', NULL, '2025-09-18 12:33:28', '2025-09-18 12:41:25'),
(140, 'App\\Models\\User', 4, 'auth_token', '9d8f61c36748d70bf6ba3352e66cd1d92bf46bc7a958b29dd8170fc9c2e814c5', '[\"*\"]', '2025-09-18 12:43:48', NULL, '2025-09-18 12:37:34', '2025-09-18 12:43:48'),
(141, 'App\\Models\\User', 1, 'auth_token', '075e6895307753c1d5e131cb1d7911f85c798bfd0406d2aed103edde1e781b8f', '[\"*\"]', '2025-09-18 14:06:34', NULL, '2025-09-18 12:41:32', '2025-09-18 14:06:34'),
(142, 'App\\Models\\User', 2, 'auth_token', '93a2cba5ed042b33753872f2f0179682655df89d6ec4cd94deacc6630d6ff529', '[\"*\"]', '2025-09-18 13:34:55', NULL, '2025-09-18 13:34:50', '2025-09-18 13:34:55'),
(143, 'App\\Models\\User', 4, 'auth_token', 'ec2383e7c4d2d7965e0856e2910a3baad1422a7b29db7ae3b61ad914f4307438', '[\"*\"]', '2025-09-18 14:04:49', NULL, '2025-09-18 13:48:32', '2025-09-18 14:04:49'),
(144, 'App\\Models\\User', 4, 'auth_token', 'c2dbc761c345ff10e3899a630605a8f14f9eba3d947400e69252be62cd6b72d5', '[\"*\"]', '2025-09-18 14:07:02', NULL, '2025-09-18 14:06:37', '2025-09-18 14:07:02'),
(145, 'App\\Models\\User', 1, 'auth_token', '751ffdebe50750d172fc26b303384553ab6d7ceb2cfea3ca4c198a8ea22de171', '[\"*\"]', '2025-09-18 14:14:40', NULL, '2025-09-18 14:07:37', '2025-09-18 14:14:40'),
(146, 'App\\Models\\User', 4, 'auth_token', '29b9de23822d651d9fa4ff98d3cb052f5b865de803de1ca07814cea3286fba82', '[\"*\"]', '2025-09-18 14:35:18', NULL, '2025-09-18 14:08:01', '2025-09-18 14:35:18'),
(147, 'App\\Models\\User', 2, 'auth_token', '0ead6e7180c6249a6dcdcc3a60463cb0555c1bb6b20d216b4dc90737970e7b83', '[\"*\"]', '2025-09-18 17:49:06', NULL, '2025-09-18 14:16:39', '2025-09-18 17:49:06'),
(148, 'App\\Models\\User', 3, 'auth_token', '2ffa611e1b4df85d674c2c6e6f97c3e533a4af2001df9464a56ab312ef50ab8d', '[\"*\"]', '2025-09-18 17:49:09', NULL, '2025-09-18 14:18:17', '2025-09-18 17:49:09'),
(149, 'App\\Models\\User', 1, 'auth_token', '244400c299e9457a3908a9fa1bbd2e1458ccd851afb8aba18e4b8fc3e0dd9e5a', '[\"*\"]', '2025-09-18 14:55:38', NULL, '2025-09-18 14:35:36', '2025-09-18 14:55:38'),
(150, 'App\\Models\\User', 4, 'auth_token', '02eddd494131d43af4083b0e48b978ead6939ea702c773be6301cebb233d532d', '[\"*\"]', '2025-09-18 18:55:17', NULL, '2025-09-18 15:51:38', '2025-09-18 18:55:17'),
(151, 'App\\Models\\User', 1, 'auth_token', '061c615237ad652e6ddb9c8591cfe975411459d34156f4b9e4fb4725db196cc0', '[\"*\"]', '2025-09-18 18:57:54', NULL, '2025-09-18 15:51:45', '2025-09-18 18:57:54'),
(152, 'App\\Models\\User', 1, 'auth_token', '36c36eaba1cb8e553ac2889d78493d40f2ab66ee58e13bf8b86d1cc4fb16d61c', '[\"*\"]', '2025-09-18 19:00:25', NULL, '2025-09-18 18:58:45', '2025-09-18 19:00:25'),
(153, 'App\\Models\\User', 1, 'auth_token', 'b0bfc244290afc6d34a06680db6c5a8936d9b5c541ed64bf9a0ba0eb9a0a0493', '[\"*\"]', '2025-09-19 02:34:45', NULL, '2025-09-18 19:01:50', '2025-09-19 02:34:45'),
(154, 'App\\Models\\User', 4, 'auth_token', '5ea7b024dd95dd1a501e45a0f376472479166895177bd473a99d24568cf5e731', '[\"*\"]', '2025-09-18 19:16:51', NULL, '2025-09-18 19:02:17', '2025-09-18 19:16:51'),
(155, 'App\\Models\\User', 3, 'auth_token', '03b63c00750e6f8b768f6d3955e128ed69d2e4195e2a9b091bcb482c57c7a11e', '[\"*\"]', '2025-09-19 07:06:17', NULL, '2025-09-19 02:36:30', '2025-09-19 07:06:17'),
(156, 'App\\Models\\User', 2, 'auth_token', 'ab144a41691da9abce0711065a7517f713237cfc6344424b0728d95e74fdc9f1', '[\"*\"]', '2025-09-19 07:07:03', NULL, '2025-09-19 02:36:50', '2025-09-19 07:07:03'),
(157, 'App\\Models\\User', 4, 'auth_token', '910925c24343ed069af5bf496c8af822ce0be1b463b6657fcc63f3407b8c2108', '[\"*\"]', '2025-09-19 07:06:09', NULL, '2025-09-19 02:37:32', '2025-09-19 07:06:09'),
(158, 'App\\Models\\User', 1, 'auth_token', 'ef121e8d0513a16c472829a512a49d0a111be526305a1cef8b6981a561eecf42', '[\"*\"]', '2025-09-19 07:06:12', NULL, '2025-09-19 02:37:49', '2025-09-19 07:06:12'),
(159, 'App\\Models\\User', 1, 'auth_token', '209a4d9efe249f731debf4e6d1aebbfa9b1d80ebaf03cb1f64ca2fed1c11af5d', '[\"*\"]', '2025-09-19 10:15:32', NULL, '2025-09-19 08:31:59', '2025-09-19 10:15:32'),
(160, 'App\\Models\\User', 4, 'auth_token', 'cd1513d4c54f2c0812539e472747783dacf7939f55777df4f719667566f5d9e2', '[\"*\"]', '2025-09-19 08:36:40', NULL, '2025-09-19 08:33:33', '2025-09-19 08:36:40'),
(161, 'App\\Models\\User', 3, 'auth_token', 'cc3e039c69006f727960449df9fa7b6f3c3935044e1b035ebc1a03e52ca46e0b', '[\"*\"]', '2025-09-19 09:53:28', NULL, '2025-09-19 09:03:05', '2025-09-19 09:53:28'),
(162, 'App\\Models\\User', 4, 'auth_token', 'ccb36afa671cb973be8c01c02ba136f0f4db7978742f49fd74d01d2f1c7092d4', '[\"*\"]', '2025-09-19 10:38:50', NULL, '2025-09-19 09:09:28', '2025-09-19 10:38:50'),
(163, 'App\\Models\\User', 1, 'auth_token', '69b63c5457b91f0857468a00f13b4957163c99a27cd6ca1c3324f4e945cb96e1', '[\"*\"]', '2025-09-19 10:38:54', NULL, '2025-09-19 10:08:32', '2025-09-19 10:38:54'),
(164, 'App\\Models\\User', 1, 'auth_token', '3d84d062ca6d933938a53e7da75c158d0e5f3b441b08274b401c132f232d7d4d', '[\"*\"]', '2025-09-20 06:31:33', NULL, '2025-09-20 05:34:20', '2025-09-20 06:31:33'),
(165, 'App\\Models\\User', 1, 'auth_token', '70b4e4b11663682d5cd7500cc4a74ca9f1fff7f986b44d6713d05171bf19bb48', '[\"*\"]', '2025-09-20 08:27:44', NULL, '2025-09-20 06:31:08', '2025-09-20 08:27:44'),
(166, 'App\\Models\\User', 1, 'auth_token', '86ef49da413da454520e7cfc0cf7cf6b5c23606e1f07f0897612cdeb9ce3f525', '[\"*\"]', '2025-09-20 12:46:54', NULL, '2025-09-20 08:28:00', '2025-09-20 12:46:54'),
(167, 'App\\Models\\User', 4, 'auth_token', '752bb5a58cbf76ff5a85edcfaf8536bfe41115378d9045282fc7eef34f873c50', '[\"*\"]', '2025-09-20 12:12:31', NULL, '2025-09-20 08:51:47', '2025-09-20 12:12:31'),
(168, 'App\\Models\\User', 1, 'auth_token', '0460b44b531bcfd09e7f1f8a1760bfb9265099b5070f3de767ea393f9eca49a3', '[\"*\"]', '2025-09-20 14:52:09', NULL, '2025-09-20 12:47:24', '2025-09-20 14:52:09'),
(169, 'App\\Models\\User', 1, 'auth_token', 'b069291c4208af594aa64540be6a3ce62322a1c79e50c67496504f4daeed6632', '[\"*\"]', '2025-09-21 13:26:12', NULL, '2025-09-20 14:51:44', '2025-09-21 13:26:12'),
(170, 'App\\Models\\User', 4, 'auth_token', 'de841d7afaaeea030ae189b7ccaabb610e546ebe8b385694d110c68bbf408857', '[\"*\"]', NULL, NULL, '2025-09-21 13:26:01', '2025-09-21 13:26:01'),
(171, 'App\\Models\\User', 1, 'auth_token', '30044184466b6f39fb2d261f944124ecdbed2a99356d461578ad68a3c743f3fe', '[\"*\"]', '2025-09-21 14:27:30', NULL, '2025-09-21 13:26:08', '2025-09-21 14:27:30'),
(172, 'App\\Models\\User', 1, 'auth_token', 'a5370f21ef5bc295f712f0e947cc2f3887f2ebe2f0eba711d90b1c91d8e195e6', '[\"*\"]', '2025-09-21 14:38:35', NULL, '2025-09-21 14:30:00', '2025-09-21 14:38:35'),
(173, 'App\\Models\\User', 1, 'auth_token', 'cb02950696a994dfc61726366ba4ec1c089965bc9deda8ca3e1e8dbac70e5b94', '[\"*\"]', '2025-09-21 14:55:57', NULL, '2025-09-21 14:39:12', '2025-09-21 14:55:57'),
(174, 'App\\Models\\User', 1, 'auth_token', 'd8ee3d2b5a1665ce29fe7ca3a3ac7b09cd50087bd6c0740d2303c2ce11444df6', '[\"*\"]', '2025-09-21 16:14:17', NULL, '2025-09-21 14:56:16', '2025-09-21 16:14:17'),
(175, 'App\\Models\\User', 1, 'auth_token', '9d61fe90e875f23f5b80db1a3a866026181146e3359eb08395bc1372f8cea4f0', '[\"*\"]', '2025-09-24 07:01:48', NULL, '2025-09-24 01:54:45', '2025-09-24 07:01:48'),
(176, 'App\\Models\\User', 2, 'auth_token', '948819fc59514017a8c04df30450c86a8b4d1dbca7068416d69fbb107c3d7753', '[\"*\"]', '2025-09-24 02:03:13', NULL, '2025-09-24 01:56:54', '2025-09-24 02:03:13'),
(177, 'App\\Models\\User', 4, 'auth_token', 'd26fb3dce60702ccf9a4e6891b142540d8a4fc91429035bc8e21fbe93f27d59c', '[\"*\"]', '2025-09-24 02:07:43', NULL, '2025-09-24 02:03:58', '2025-09-24 02:07:43'),
(178, 'App\\Models\\User', 3, 'auth_token', '4a345ff8171b20898b58412e8b785855f85c9154030da4da31bb1a0c3abd8d42', '[\"*\"]', '2025-09-24 02:15:00', NULL, '2025-09-24 02:08:21', '2025-09-24 02:15:00'),
(179, 'App\\Models\\User', 2, 'auth_token', 'd7a1416d4b3c6c0fe7e5f9d96a9d6265d0a59529f2d516a1fd95e602a04268c5', '[\"*\"]', '2025-09-24 06:22:45', NULL, '2025-09-24 02:21:30', '2025-09-24 06:22:45'),
(180, 'App\\Models\\User', 1, 'auth_token', 'd1378cd6b094652f7bffb53c26beaf9f53c0f252a4c715fbfb8dddffc1106874', '[\"*\"]', '2025-09-24 07:24:24', NULL, '2025-09-24 07:02:37', '2025-09-24 07:24:24'),
(181, 'App\\Models\\User', 4, 'auth_token', '5f614d1accb356aa8412b197f5beba789350c86218adc7e0b4434f2c96906bf0', '[\"*\"]', '2025-09-24 07:42:50', NULL, '2025-09-24 07:25:37', '2025-09-24 07:42:50'),
(182, 'App\\Models\\User', 1, 'auth_token', '65cd181f513959b9b058b1620da380d258c992b60520af702ce5c347da7171b4', '[\"*\"]', '2025-09-24 08:32:26', NULL, '2025-09-24 07:46:36', '2025-09-24 08:32:26'),
(183, 'App\\Models\\User', 1, 'auth_token', '4b7e4e1eb56ce57a86041c07ec85cad27f73ff192c0592e03e826742881288d9', '[\"*\"]', '2025-09-24 10:55:12', NULL, '2025-09-24 08:34:50', '2025-09-24 10:55:12'),
(184, 'App\\Models\\User', 4, 'auth_token', 'fad389df5fdfc380bf14948ee54f880ea0de492a42c83ebf83794c5a2eca52e9', '[\"*\"]', '2025-09-24 10:56:58', NULL, '2025-09-24 10:55:23', '2025-09-24 10:56:58'),
(185, 'App\\Models\\User', 1, 'auth_token', '38b2e1681691f2adb9b07ed8802caf4143d7334a5315cf4c239887feca23d90c', '[\"*\"]', '2025-09-24 16:26:50', NULL, '2025-09-24 10:57:11', '2025-09-24 16:26:50'),
(186, 'App\\Models\\User', 1, 'auth_token', '21fa26d499c8418a50e4e249c4224975a4e48d941580a236b32aad44b938d67b', '[\"*\"]', '2025-09-24 17:23:41', NULL, '2025-09-24 16:25:58', '2025-09-24 17:23:41'),
(187, 'App\\Models\\User', 1, 'auth_token', 'acf4111436ddfe3a352bd1683943f94af4eff760615d6f0af11a222f5ded8d69', '[\"*\"]', '2025-09-25 01:07:47', NULL, '2025-09-24 22:30:47', '2025-09-25 01:07:47');

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` bigint UNSIGNED NOT NULL,
  `transaction_id` bigint UNSIGNED NOT NULL,
  `payer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issued_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `receipts`
--

INSERT INTO `receipts` (`id`, `transaction_id`, `payer_name`, `receipt_number`, `issued_at`) VALUES
(29, 31, 'Berkshire Hathaway', 'RCPT-20250920-0001', '2025-09-20 13:12:31'),
(30, 32, 'sample', 'RCPT-20250920-0002', '2025-09-20 13:19:57'),
(31, 37, 'nikki', 'RCPT-20250920-0003', '2025-09-20 15:01:03'),
(32, 39, 'jj', 'RCPT-20250920-0004', '2025-09-20 15:05:46'),
(33, 40, 'COKE Collection Account', 'RCP-20250921-9066', '2025-09-20 15:08:03'),
(34, 44, 'lololo', 'RCPT-20250924-0001', '2025-09-24 10:30:20'),
(35, 44, 'lololo', 'RCP-20250925-4052', '2025-09-24 12:00:36'),
(36, 45, 'another sample', 'RCPT-20250925-0001', '2025-09-25 00:21:33');

-- --------------------------------------------------------

--
-- Table structure for table `recipient_accounts`
--

CREATE TABLE `recipient_accounts` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('disbursement','collection') COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fund_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `fund_account_id` bigint UNSIGNED DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `total_transactions` int NOT NULL DEFAULT '0',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `recipient_accounts`
--

INSERT INTO `recipient_accounts` (`id`, `name`, `type`, `contact_person`, `email`, `phone`, `address`, `tax_id`, `bank_account`, `fund_code`, `description`, `fund_account_id`, `status`, `total_transactions`, `total_amount`, `created_at`, `updated_at`) VALUES
(11, 'COKE Collection Account', 'collection', 'sample', 'anothersample@gmail.com', '09632122448', 'sample', NULL, NULL, 'CF-EXP001-7464', 'Collection account linked to COKE (Expense)', 12, 'active', 0, 0.00, '2025-09-20 13:22:41', '2025-09-20 13:22:41'),
(12, 'another sample', 'disbursement', 'sample person', 'sample@gmail.com', '87946531', 'x', NULL, NULL, NULL, NULL, NULL, 'active', 0, 0.00, '2025-09-21 15:24:10', '2025-09-21 15:24:10');

-- --------------------------------------------------------

--
-- Table structure for table `registration_requests`
--

CREATE TABLE `registration_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Collecting Officer','Disbursing Officer','Cashier','Admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` bigint UNSIGNED NOT NULL,
  `report_type` enum('daily','monthly','yearly') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_from` date DEFAULT NULL,
  `date_to` date DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `include_transactions` tinyint(1) NOT NULL DEFAULT '1',
  `include_overrides` tinyint(1) NOT NULL DEFAULT '0',
  `format` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pdf',
  `generated_by` bigint UNSIGNED NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` bigint UNSIGNED NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `type` enum('Collection','Disbursement','Override') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_account_id` bigint UNSIGNED DEFAULT NULL,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fund_account_id` bigint UNSIGNED DEFAULT NULL,
  `mode_of_payment` enum('Cash','Cheque','Bank Transfer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `type`, `amount`, `description`, `recipient`, `recipient_account_id`, `purpose`, `department`, `category`, `reference`, `receipt_no`, `reference_no`, `fund_account_id`, `mode_of_payment`, `created_by`, `approved_by`, `created_at`, `updated_at`) VALUES
(31, 'Collection', 1500.00, 'This is for the top 1 Winner', 'Berkshire Hathaway', NULL, NULL, 'General', 'Revenue Collection', 'COL-2025-0001', 'RCPT-20250920-0001', 'COL-2025-0001', 12, 'Cash', 1, 1, '2025-09-20 13:12:31', '2025-09-20 13:15:48'),
(32, 'Collection', 500.00, 'Collection transaction', 'sample', NULL, NULL, 'General', 'Revenue Collection', 'COL-2025-0002', 'RCPT-20250920-0002', 'COL-2025-0002', 12, 'Cash', 1, NULL, '2025-09-20 13:19:57', '2025-09-20 13:19:57'),
(33, 'Disbursement', 500.00, 'sample', 'COKE Collection Account', NULL, NULL, 'General', 'Disbursement', '332211', 'DIS-20250920-0001', 'DIS-2025-0001', 12, 'Cheque', 1, NULL, '2025-09-20 13:57:58', '2025-09-20 13:57:58'),
(34, 'Disbursement', 500.00, 'Supplier Payment - Payment to COKE Collection Account', 'COKE Collection Account', NULL, NULL, 'General', 'Disbursement', '564', 'DIS-20250920-0002', 'DIS-2025-0002', 12, 'Cash', 1, 1, '2025-09-20 14:09:35', '2025-09-20 14:09:40'),
(35, 'Disbursement', 499.99, 'Reimbursement - Payment to COKE Collection Account', 'COKE Collection Account', NULL, NULL, 'General', 'Disbursement', '546546546', 'DIS-20250920-0003', 'DIS-2025-0003', 12, 'Cash', 1, 1, '2025-09-20 14:20:35', '2025-09-20 14:20:40'),
(36, 'Disbursement', 4999.98, 'dd', 'COKE Collection Account', NULL, NULL, 'General', 'Disbursement', '589465132', 'DIS-20250920-0004', 'DIS-2025-0004', 12, 'Cash', 1, 1, '2025-09-20 14:53:20', '2025-09-20 14:53:23'),
(37, 'Collection', 2000.00, 'Collection transaction', 'nikki', NULL, NULL, 'General', 'Revenue Collection', 'COL-2025-0003', 'RCPT-20250920-0003', 'COL-2025-0003', 12, 'Cash', 1, NULL, '2025-09-20 15:01:03', '2025-09-20 15:01:03'),
(38, 'Disbursement', -5000.00, 'sdf', 'COKE Collection Account', NULL, NULL, 'General', 'Disbursement', '2323123', 'DIS-20250920-0005', 'DIS-2025-0005', 12, 'Cash', 1, 1, '2025-09-20 15:02:02', '2025-09-20 15:02:06'),
(39, 'Collection', 5000.00, 'Collection transaction', 'jj', NULL, NULL, 'General', 'Revenue Collection', 'COL-2025-0004', 'RCPT-20250920-0004', 'COL-2025-0004', 12, 'Cash', 1, NULL, '2025-09-20 15:05:46', '2025-09-20 15:05:46'),
(40, 'Disbursement', -5000.00, 'kk', 'COKE Collection Account', NULL, NULL, 'General', 'Disbursement', '3333333333', 'DIS-20250920-0006', 'DIS-2025-0006', 12, 'Cash', 1, 1, '2025-09-20 15:07:13', '2025-09-20 15:07:18'),
(41, 'Disbursement', -5000.00, 'Maintenance - Payment to COKE Collection Account', 'COKE Collection Account', 11, 'Maintenance', 'General', 'Disbursement', '6546454', 'DIS-20250921-0001', 'DIS-2025-0007', 12, 'Cash', 1, 1, '2025-09-21 14:57:04', '2025-09-21 14:57:07'),
(42, 'Disbursement', -500.00, 'Supplier Payment - Payment to another sample', 'another sample', 12, 'Supplier Payment', 'General', 'Disbursement', '32222252', 'DIS-20250921-0002', 'DIS-2025-0008', 13, 'Cash', 1, 3, '2025-09-21 15:24:58', '2025-09-24 02:13:54'),
(43, 'Disbursement', -1000.00, 'Salary - Disbursement to lllllll', 'lllllll', 12, 'Salary', 'General', 'Disbursement', '1231', 'DIS-20250924-0001', 'DIS-2025-0009', 12, 'Cash', 1, 1, '2025-09-24 10:28:18', '2025-09-24 10:28:24'),
(44, 'Collection', 1000.00, 'Office Supplies - Collection from lololo', 'lololo', 12, 'Office Supplies', 'General', 'Collection', '12321332', 'RCPT-20250924-0001', 'COL-2025-0005', 12, 'Cash', 1, 1, '2025-09-24 10:30:20', '2025-09-24 10:30:26'),
(45, 'Collection', 10.00, 'Maintenance - Collection from another sample', 'another sample', 12, 'Maintenance', 'General', 'Collection', '12312323', 'RCPT-20250925-0001', 'COL-2025-0006', 14, 'Cash', 1, 1, '2025-09-25 00:21:33', '2025-09-25 00:21:38');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Collecting Officer','Disbursing Officer','Cashier','Admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `department`, `phone`, `status`, `last_login`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', 'admin@gmail.com', '$2y$12$jLFVPPyYMI0aYy1IynIUPeDVn1VwDNnKGPKqY0nE7Wp9ZQ0RNX97K', 'Admin', NULL, NULL, 'active', NULL, NULL, '2025-09-15 09:32:04', '2025-09-15 09:32:04'),
(2, 'Jhoneca Jungoy', 'collector@gmail.com', '$2y$12$y/xnFO1EMsZiXx9luH2rSOwG6W6dBEGQxuWciWkgIxLYa2AeLZjZy', 'Collecting Officer', NULL, NULL, 'active', NULL, NULL, '2025-09-15 09:32:04', '2025-09-15 09:32:04'),
(3, 'Ian Jane Butaslac', 'disburser@gmail.com', '$2y$12$wo9CLj3oww.z4vNAisafoOPYUXApunv49pzOlSCa.WH6zEsd2UuYO', 'Disbursing Officer', NULL, NULL, 'active', NULL, NULL, '2025-09-15 09:32:04', '2025-09-15 09:32:04'),
(4, 'Marvic Pajaganas', 'cashier@gmail.com', '$2y$12$GcGpj05lb2nHIUNRaepBsummOOGmnykd/SVhFN2y1U6tbRmTzBKZe', 'Cashier', NULL, NULL, 'active', NULL, NULL, '2025-09-15 09:32:05', '2025-09-15 09:32:05'),
(24, 'BELENDA', 'evelynmagbanua1905@gmail.com', '$2y$12$2ClthENmUT84g7AjdHJJyOiJ9it0vejmSv6SDoJ8gf6dIs9dCgE9W', 'Cashier', NULL, NULL, 'active', NULL, NULL, '2025-09-17 04:26:14', '2025-09-17 04:26:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_user_id_created_at_index` (`user_id`,`created_at`),
  ADD KEY `activity_logs_activity_type_created_at_index` (`activity_type`,`created_at`),
  ADD KEY `activity_logs_user_role_created_at_index` (`user_role`,`created_at`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_user_id_foreign` (`user_id`);

--
-- Indexes for table `disbursements`
--
ALTER TABLE `disbursements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `disbursements_transaction_id_foreign` (`transaction_id`),
  ADD KEY `disbursements_fund_account_id_foreign` (`fund_account_id`),
  ADD KEY `disbursements_issued_by_foreign` (`issued_by`);

--
-- Indexes for table `fund_accounts`
--
ALTER TABLE `fund_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `fund_accounts_code_unique` (`code`),
  ADD KEY `fund_accounts_created_by_foreign` (`created_by`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_is_read_index` (`user_id`,`is_read`);

--
-- Indexes for table `override_requests`
--
ALTER TABLE `override_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `override_requests_transaction_id_foreign` (`transaction_id`),
  ADD KEY `override_requests_requested_by_foreign` (`requested_by`),
  ADD KEY `override_requests_reviewed_by_foreign` (`reviewed_by`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipts_receipt_number_unique` (`receipt_number`),
  ADD KEY `receipts_transaction_id_foreign` (`transaction_id`);

--
-- Indexes for table `recipient_accounts`
--
ALTER TABLE `recipient_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `recipient_accounts_email_unique` (`email`),
  ADD KEY `recipient_accounts_type_index` (`type`),
  ADD KEY `recipient_accounts_status_index` (`status`),
  ADD KEY `recipient_accounts_fund_account_id_index` (`fund_account_id`);

--
-- Indexes for table `registration_requests`
--
ALTER TABLE `registration_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_requests_email_unique` (`email`),
  ADD KEY `registration_requests_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reports_generated_by_foreign` (`generated_by`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `system_settings_key_unique` (`key`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transactions_fund_account_id_foreign` (`fund_account_id`),
  ADD KEY `transactions_created_by_foreign` (`created_by`),
  ADD KEY `transactions_approved_by_foreign` (`approved_by`),
  ADD KEY `transactions_recipient_account_id_index` (`recipient_account_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `disbursements`
--
ALTER TABLE `disbursements`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `fund_accounts`
--
ALTER TABLE `fund_accounts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `override_requests`
--
ALTER TABLE `override_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=188;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `recipient_accounts`
--
ALTER TABLE `recipient_accounts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `registration_requests`
--
ALTER TABLE `registration_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `disbursements`
--
ALTER TABLE `disbursements`
  ADD CONSTRAINT `disbursements_fund_account_id_foreign` FOREIGN KEY (`fund_account_id`) REFERENCES `fund_accounts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `disbursements_issued_by_foreign` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `disbursements_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

--
-- Constraints for table `fund_accounts`
--
ALTER TABLE `fund_accounts`
  ADD CONSTRAINT `fund_accounts_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `override_requests`
--
ALTER TABLE `override_requests`
  ADD CONSTRAINT `override_requests_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `override_requests_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `override_requests_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

--
-- Constraints for table `receipts`
--
ALTER TABLE `receipts`
  ADD CONSTRAINT `receipts_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

--
-- Constraints for table `recipient_accounts`
--
ALTER TABLE `recipient_accounts`
  ADD CONSTRAINT `recipient_accounts_fund_account_id_foreign` FOREIGN KEY (`fund_account_id`) REFERENCES `fund_accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `registration_requests`
--
ALTER TABLE `registration_requests`
  ADD CONSTRAINT `registration_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_fund_account_id_foreign` FOREIGN KEY (`fund_account_id`) REFERENCES `fund_accounts` (`id`),
  ADD CONSTRAINT `transactions_recipient_account_id_foreign` FOREIGN KEY (`recipient_account_id`) REFERENCES `recipient_accounts` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
