import { DataSource } from "typeorm";
import { Product } from './entity';
import dotenv from 'dotenv'; 

dotenv.config();

export const dataSource = new DataSource({
    type: 'sqlite',
    database: 'db.sqlite',
    entities: [
        Product
    ],
    synchronize: true,
    logging: true,
})
 