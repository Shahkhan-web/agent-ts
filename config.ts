import { DataSource } from "typeorm";
import { Product } from './entity';
import { salesData } from './entity';
import dotenv from 'dotenv'; 

dotenv.config();

export const dataSource = new DataSource({
    type: 'sqlite',
    //database: 'db.sqlite',
    database: 'product_and_sales.sqlite',
    entities: [
        Product,
        salesData
    ],
    synchronize: true,
    logging: true,
})
 
