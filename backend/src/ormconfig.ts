import {DataSource} from 'typeorm';
import {TeamUp} from './entity/TeamUp';
import {Users} from './entity/Users';
import mysql2 from 'mysql2'

import config from "../config";

const AppDataSource = new DataSource({
    type: "mysql",
    host: config.mysql.host,
    port: config.mysql.port,
    username: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    synchronize: config.__DEBUG__, // ⚠️ 生产环境不要用 true，开发环境方便自动创建表结构
    logging: false,
    driver: mysql2,
    entities: [TeamUp, Users],
    migrations: [],
    subscribers: [],
});

export default AppDataSource;
