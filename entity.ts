import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    PrimaryColumn,
  } from 'typeorm';
import 'reflect-metadata'

  @Entity()
  export class Product {
    @PrimaryColumn({ type: 'varchar', length: 255, nullable: false })
    materialId: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    productName: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    plantId: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    storageLocation: string;
  
    @Column({ type: 'varchar', length: 4, nullable: false })
    yearOfReceiving: string;
  
    @Column({ type: 'varchar', length: 2, nullable: false })
    monthOfReceiving: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    batchId: string;
  
    @Column({ type: 'date', nullable: false })
    productionDate: Date;
  
    @Column({ type: 'date', nullable: false })
    Expiry_date: Date;
  
    @Column({ type: 'numeric', nullable: false })
    quantityTons: number;
  }
