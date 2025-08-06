/*
 Navicat MySQL Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80026
 Source Schema         : glow_prow

 Target Server Type    : MySQL
 Target Server Version : 80026
 File Encoding         : 65001
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for assembly
-- ----------------------------
DROP TABLE IF EXISTS `assembly`;
CREATE TABLE `assembly` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `userId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `data` json DEFAULT NULL COMMENT '配装',
  `fashion` json DEFAULT NULL COMMENT '时装',
  `food` json DEFAULT NULL COMMENT '食物',
  `localUid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `createdTime` datetime DEFAULT NULL,
  `updatedTime` datetime DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `cloningUuid` varchar(255) DEFAULT NULL COMMENT '克隆id，指向uuid',
  `visibility` enum('publicly','private') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'publicly',
  `attr` json DEFAULT NULL COMMENT '属性',
  PRIMARY KEY (`id`,`uuid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` varchar(5000) DEFAULT NULL,
  `targetType` varchar(255) DEFAULT NULL,
  `targetId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `updatedTime` datetime DEFAULT NULL,
  `deletedTime` datetime DEFAULT NULL,
  `createdTime` datetime DEFAULT NULL,
  `userId` varchar(36) DEFAULT NULL,
  `valid` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `byUserId` (`userId`),
  CONSTRAINT `byUserId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for likes
-- ----------------------------
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` varchar(36) DEFAULT NULL,
  `targetType` varchar(255) DEFAULT NULL,
  `targetId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `createdTime` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `valid` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for replies
-- ----------------------------
DROP TABLE IF EXISTS `replies`;
CREATE TABLE `replies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `commentId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `content` varchar(5000) DEFAULT NULL,
  `deletedTime` datetime DEFAULT NULL,
  `valid` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for team_up
-- ----------------------------
DROP TABLE IF EXISTS `team_up`;
CREATE TABLE `team_up` (
  `id` varchar(36) NOT NULL,
  `player` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `tags` json DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `userId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_ae0b84e96e76c2d0b5c8b61ea0c` (`userId`),
  CONSTRAINT `FK_ae0b84e96e76c2d0b5c8b61ea0c` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for used_captchas
-- ----------------------------
DROP TABLE IF EXISTS `used_captchas`;
CREATE TABLE `used_captchas` (
  `uniqHash` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expiresTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uniqHash`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `lastPublishedAt` datetime DEFAULT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `valid` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
