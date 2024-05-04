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

@Entity()
export class salesData {
  @Column({ type: 'varchar', length: 50, nullable: false })
  BU: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  Division: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  Sub_Division: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  Brand: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  Tier: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  Region: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  Sales_Office: string;

  @PrimaryColumn({ type: 'int', nullable: false })
  Material: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  Material_Description: string;

  @Column({ type: 'boolean', nullable: false })
  SFS_Portfolio: boolean;

  @Column({ type: 'varchar', length: 50, nullable: false })
  Status: string;

  @Column({ type: 'int', nullable: false })
  Sold_To_Party_ID: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  Sold_To_Party_Name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  Customer_Name: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  Channel: string;

  @Column({ type: 'int', nullable: false })
  Distribution_Channel: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  Business_Sector: string;

  @Column({ type: 'int', nullable: false })
  Employee: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  Employee_Responsible: string;

  @Column({ type: 'varchar', length: 3, nullable: false })
  Month: string;

  @Column({ type: 'int', nullable: false })
  Years: number;

  @Column({ type: 'int', nullable: false })
  Sales_Qty_Adjusted: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  Sales_Value: number;
}
