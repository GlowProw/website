// src/entity/TeamUp.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User"; // 导入 User 实体

@Entity()
export class TeamUp {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255 })
    player: string;

    @Column("text")
    description: string;

    @Column({
        type: "json",
        nullable: true
    })
    tags: string[];

    @Column({ type: "datetime" })
    expiresAt: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    // 添加用户关联
    @ManyToOne(() => User, user => user.teamUps, { nullable: true, onDelete: 'SET NULL' })
        // nullable: true 表示匿名发布时 userId 可以为空
        // onDelete: 'SET NULL' 表示如果用户被删除了，他发布的组队信息对应的 user 字段会被设为 NULL
    user: User | null; // 关联的用户实体

    @Column({ type: "varchar",nullable: true }) // 存储用户ID，方便查询
    userId: string | null;
}
