-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 13, 2023 at 12:52 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `RealEstateGuesser`
--

-- --------------------------------------------------------

--
-- Table structure for table `estateData`
--

CREATE TABLE `estateData` (
  `estateId` int(11) NOT NULL,
  `location` varchar(128) NOT NULL,
  `price` int(11) NOT NULL,
  `images` varchar(1024) NOT NULL,
  `description` varchar(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `estateData`
--

INSERT INTO `estateData` (`estateId`, `location`, `price`, `images`, `description`) VALUES
(1, 'Country: USA, State: California City: Los Angeles', 649000, '[\"LA_PIC_1.webp\", \"LA_PIC_2.webp\", \"LA_PIC_3.webp\"]', '2 Bedrooms, 2 Bathrooms, 1106 square ft of space, Built in Laundry Room'),
(2, 'Country: USA, State: New York, City: Brooklyn', 1000000, '[\"BKLYN_PIC_1.webp\", \"BKLYN_PIC_2.webp\",\"BKLYN_PIC_3.webp\"]', '5 bedroom, 2 bathroom, 2700 square ft home built in 1991'),
(3, 'Country: USA, State: Texas, City: Austin ', 875000, '[\"AUST_PIC_1.webp\",\"AUST_PIC_2.webp\",\"AUST_PIC_3.webp\"]', '3 bedrooms 2 bathrooms 9095 square ft'),
(4, 'Country: USA, State: D.C., City Washington (Washington D.C.)', 470000, '[\"DC_PIC_1.webp\",\"DC_PIC_2.webp\", \"DC_PIC_3.webp\"]', '1 Bedroom, 2 Bathroom Condominium, 908 square ft, built in 1909'),
(5, 'Country: USA, State: Hawaii, City: Honolulu', 3950000, '[\"HONO_PIC_1.webp\", \"HONO_PIC_2.webp\", \"HONO_PIC_3.webp\"]', '6 bedrooms, 5 bathrooms, Total structure area: 2876, Total interior livable area: 2402 sqft'),
(6, 'Country: USA, State: Illinois, City: Chicago', 745000, '[\"CHIC_PIC_1.webp\", \"CHIC_PIC_2.webp\", \"CHIC_PIC_3.webp\"]', '4 bedrooms, 3 Bathrooms, 9099 square ft, Built in 1922'),
(7, 'Country: USA, State: California, City: San Francisco', 5750000, '[\"SF_PIC_1.webp\", \"SF_PIC_2.webp\", \"SF_PIC_3.webp\"]', '4,701 sqft, Duplex, 6 Bedrooms, 1 Garage Space'),
(8, 'Country: USA, State: Nevada, City: Las Vegas', 349000, '[\"LV_PIC_1.webp\", \"LV_PIC_2.webp\", \"LV_PIC_3.webp\"]', '3 Bedrooms, 2 Bathrooms, 1836 sqft, Single Family'),
(9, 'Country: USA, State: Missouri, City: Kansas City', 449000, '[\"KS_PIC_1.webp\", \"KS_PIC_2.webp\", \"KS_PIC_3.webp\"]', '3,735 sqft, 5 Bedrooms, 4 Bathroom, Single Family'),
(10, 'Country: USA, State: Georgia, City: Atlanta', 499000, '[\"ALT_PIC_1.webp\", \"ALT_PIC_2.webp\", \"ALT_PIC_3.webp\"]', '1638 sqft, 3 bedrooms, 3 bathrooms, single family resident');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `estateData`
--
ALTER TABLE `estateData`
  ADD PRIMARY KEY (`estateId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `estateData`
--
ALTER TABLE `estateData`
  MODIFY `estateId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
