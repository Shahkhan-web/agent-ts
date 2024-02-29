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
    mat: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    plant: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    sloc: string;
  
    @Column({ type: 'varchar', length: 4, nullable: false })
    year: string;
  
    @Column({ type: 'varchar', length: 2, nullable: false })
    mon: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    batch: string;
  
    @Column({ type: 'date', nullable: false })
    proddat: Date;
  
    @Column({ type: 'date', nullable: false })
    expdat: Date;
  
    @Column({ type: 'numeric', nullable: false })
    qty: number;
  }