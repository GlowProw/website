import {DataSource} from 'typeorm';
import {TeamUp} from './entity/TeamUp'; // 稍后创建这个实体文件
import {User} from './entity/User'; // 引入 User 实体

const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "test",
    password: process.env.DB_PASSWORD || "zsezse",
    database: process.env.DB_DATABASE || "team_up_db",
    synchronize: true, // ⚠️ 生产环境不要用 true，开发环境方便自动创建表结构
    logging: false, // 设置为 true 可以看到 SQL 日志
    entities: [TeamUp, User],
    migrations: [],
    subscribers: [],
});

export default AppDataSource;
