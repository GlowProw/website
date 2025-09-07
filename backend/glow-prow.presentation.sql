/*
 Navicat MySQL Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80026
 Source Host           : localhost:3306
 Source Schema         : glow_prow

 Target Server Type    : MySQL
 Target Server Version : 80026
 File Encoding         : 65001

 Date: 07/09/2025 14:43:36
*/

SET NAMES utf8mb4;
SET
FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for assembly
-- ----------------------------
DROP TABLE IF EXISTS `assembly`;
CREATE TABLE `assembly`
(
    `id`          int                                                           NOT NULL AUTO_INCREMENT,
    `uuid`        varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `userId`      varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  DEFAULT NULL,
    `name`        varchar(255)                                                  DEFAULT NULL,
    `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    `data`        json                                                          DEFAULT NULL COMMENT '配装',
    `fashionId`   varchar(36)                                                   DEFAULT NULL COMMENT '时装Id',
    `wheelId`     varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  DEFAULT NULL COMMENT '轮盘id',
    `warehouseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  DEFAULT NULL COMMENT '船仓id',
    `localUid`    varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    `createdTime` datetime                                                      DEFAULT NULL,
    `updatedTime` datetime                                                      DEFAULT NULL,
    `tags`        json                                                          DEFAULT NULL,
    `cloningUuid` varchar(255)                                                  DEFAULT NULL COMMENT '克隆id，指向uuid',
    `visibility`  enum('publicly','private') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'publicly',
    `attr`        json                                                          DEFAULT NULL COMMENT '属性',
    `valid`       int                                                           DEFAULT '1',
    PRIMARY KEY (`id`, `uuid`) USING BTREE,
    KEY           `idx_visibility` (`visibility`),
    KEY           `idx_created_time` (`createdTime`),
    KEY           `idx_updated_time` (`updatedTime`),
    KEY           `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`
(
    `id`          int NOT NULL AUTO_INCREMENT,
    `content`     varchar(5000)                                                 DEFAULT NULL,
    `targetType`  varchar(255)                                                  DEFAULT NULL,
    `targetId`    varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    `updatedTime` datetime                                                      DEFAULT NULL,
    `deletedTime` datetime                                                      DEFAULT NULL,
    `createdTime` datetime                                                      DEFAULT NULL,
    `userId`      varchar(36)                                                   DEFAULT NULL,
    `valid`       int                                                           DEFAULT '1',
    PRIMARY KEY (`id`),
    KEY           `byUserId` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for likes
-- ----------------------------
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes`
(
    `id`          int NOT NULL AUTO_INCREMENT,
    `userId`      varchar(36)                                                   DEFAULT NULL,
    `targetType`  varchar(255)                                                  DEFAULT NULL,
    `targetId`    varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    `createdTime` datetime                                                      DEFAULT NULL,
    `valid`       int                                                           DEFAULT '1',
    PRIMARY KEY (`id`),
    KEY           `idx_target` (`targetType`,`targetId`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for replies
-- ----------------------------
DROP TABLE IF EXISTS `replies`;
CREATE TABLE `replies`
(
    `id`          int NOT NULL AUTO_INCREMENT,
    `userId`      int                                                           DEFAULT NULL,
    `commentId`   varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    `content`     varchar(5000)                                                 DEFAULT NULL,
    `deletedTime` datetime                                                      DEFAULT NULL,
    `valid`       int                                                           DEFAULT '1',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for glow_prow
-- ----------------------------
DROP TABLE IF EXISTS `glow_prow`;
CREATE TABLE `glow_prow`
(
    `id`          int          NOT NULL AUTO_INCREMENT,
    `player`      varchar(255) NOT NULL,
    `description` text         NOT NULL,
    `tags`        json                  DEFAULT NULL,
    `expiresAt`   datetime     NOT NULL,
    `createdAt`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `userId`      varchar(255)          DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY           `FK_ae0b84e96e76c2d0b5c8b61ea0c` (`userId`),
    CONSTRAINT `FK_ae0b84e96e76c2d0b5c8b61ea0c` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for used_captchas
-- ----------------------------
DROP TABLE IF EXISTS `used_captchas`;
CREATE TABLE `used_captchas`
(
    `uniqHash`    varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `expiresTime` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`uniqHash`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`
(
    `key`             int                                                           NOT NULL,
    `id`              varchar(36)                                                   NOT NULL,
    `username`        varchar(255)                                                  NOT NULL,
    `alternativeName` varchar(255)                                                  NOT NULL,
    `privilege`       json                                                          NOT NULL COMMENT '权限',
    `attr`            json                                                                   DEFAULT NULL,
    `password`        varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `signoutTime`     datetime                                                               DEFAULT NULL,
    `createdTime`     datetime                                                               DEFAULT NULL,
    `updateTime`      datetime                                                               DEFAULT CURRENT_TIMESTAMP,
    `email`           varchar(255)                                                  NOT NULL DEFAULT '',
    `valid`           int                                                           NOT NULL DEFAULT '1',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
    CONSTRAINT `chk_username` CHECK (((`username` is not null) and (`username` <> _utf8mb4'') and (char_length(trim(`username`)) > 0) and (lower(trim(`username`)) not in (_utf8mb4'null', _utf8mb4'undefined', _utf8mb4'admin', _utf8mb4'root')) and (trim(`username`) not in (_utf8mb4' ', _utf8mb4'	', _utf8mb4'\n', _utf8mb4'\r'))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for warehouse
-- ----------------------------
DROP TABLE IF EXISTS `warehouse`;
CREATE TABLE `warehouse`
(
    `id`           int      NOT NULL AUTO_INCREMENT,
    `uuid`         varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    `userId`       varchar(36)                                                  DEFAULT NULL,
    `data`         json     NOT NULL COMMENT '轮盘数据',
    `attr`         json     NOT NULL COMMENT '属性',
    `creationTime` datetime NOT NULL,
    `updatedTime`  datetime NOT NULL,
    `valid`        int      NOT NULL                                            DEFAULT '1',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for wheel
-- ----------------------------
DROP TABLE IF EXISTS `wheel`;
CREATE TABLE `wheel`
(
    `id`           int      NOT NULL AUTO_INCREMENT,
    `uuid`         varchar(36)       DEFAULT NULL,
    `userId`       varchar(36)       DEFAULT NULL,
    `data`         json     NOT NULL COMMENT '轮盘数据',
    `attr`         json     NOT NULL COMMENT '属性',
    `creationTime` datetime NOT NULL,
    `updatedTime`  datetime NOT NULL,
    `valid`        int      NOT NULL DEFAULT '1',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Event structure for remove_expired_captchas
-- ----------------------------
DROP
EVENT IF EXISTS `remove_expired_captchas`;
delimiter ;;
CREATE
EVENT `team_up_db`.`remove_expired_captchas`
ON SCHEDULE
EVERY '30' MINUTE STARTS '2021-07-01 15:56:03'
ON COMPLETION PRESERVE
COMMENT 'Remove expired captchas to free space'
DO
BEGIN
DELETE
FROM used_captchas
WHERE `expiresTime` <= CURRENT_TIMESTAMP();
END
;;
delimiter ;

-- ----------------------------
-- Event structure for remove_expired_verifications
-- ----------------------------
DROP
EVENT IF EXISTS `remove_expired_verifications`;
delimiter ;;
CREATE
EVENT `team_up_db`.`remove_expired_verifications`
ON SCHEDULE
EVERY '30' MINUTE STARTS '2021-07-01 15:59:44'
ON COMPLETION PRESERVE
COMMENT 'Remove expired verifications'
DO
BEGIN
DELETE
FROM verifications
WHERE `expiresTime` <= CURRENT_TIMESTAMP();
END
;;
delimiter ;

SET
FOREIGN_KEY_CHECKS = 1;
