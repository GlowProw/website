// src/entity/User.ts
import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {TeamUp} from "./TeamUp";

@Entity()
export class Users {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "varchar",
        length: 255,
        unique: true
    })
    username: string;

    @Column({
        type: 'varchar',
        default: '',
        length: 255
    })
    email: string

    @Column({
        type: "varchar",
        length: 255
    })
    passwordHash: string;

    @Column({type: "int", default: 1})
    valid: number

    @Column({type: "datetime", nullable: true})
    lastPublishedAt: Date | null;

    // 一个用户可以发布多个组队信息
    @OneToMany(() => TeamUp, teamUp => teamUp.user)
    teamUps: TeamUp[];
}
