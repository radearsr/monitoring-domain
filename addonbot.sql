/*
SQLyog Community
MySQL - 5.7.42-cll-lve : Database - unitedpay_addonbot
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`addon_bot` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `addon_bot`;

/*Table structure for table `main_domain` */

DROP TABLE IF EXISTS `main_domain`;

CREATE TABLE `main_domain` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hosting` varchar(200) NOT NULL,
  `domain` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;

/*Table structure for table `ssl_domain` */

DROP TABLE IF EXISTS `ssl_domain`;

CREATE TABLE `ssl_domain` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(200) NOT NULL,
  `domain` varchar(200) NOT NULL,
  `port` int(11) NOT NULL,
  `tempat` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
