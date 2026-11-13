import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('members')
@Index(['block', 'lot'], { unique: true })
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'block_code', length: 40 })
  block: string;

  @Column({ name: 'lot_code', length: 40 })
  lot: string;

  @Column({ name: 'registered_owners', type: 'text', nullable: true })
  registeredOwners: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'cellphone_number', type: 'bigint', unsigned: true, nullable: true })
  cellphoneNumber: string | null;

  @Column({ name: 'telephone_number', type: 'bigint', unsigned: true, nullable: true })
  telephoneNumber: string | null;

  @Column({ name: 'sqm_size', type: 'decimal', precision: 12, scale: 2, nullable: true })
  sqmSize: string | null;

  @Column({ length: 10 })
  classification: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  principal: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  interest: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  penalty: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
