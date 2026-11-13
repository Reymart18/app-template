import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '../members/member.entity.js';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'collection_date', type: 'date' })
  collectionDate: string;

  @Column({ name: 'reference_number', length: 100 })
  referenceNumber: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: string;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ name: 'net_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  netAmount: string;

  @Column({ name: 'applied_penalty', type: 'decimal', precision: 14, scale: 2, default: 0 })
  appliedPenalty: string;

  @Column({ name: 'applied_interest', type: 'decimal', precision: 14, scale: 2, default: 0 })
  appliedInterest: string;

  @Column({ name: 'applied_principal', type: 'decimal', precision: 14, scale: 2, default: 0 })
  appliedPrincipal: string;

  @Column({ name: 'payment_method', length: 60 })
  paymentCategory: string;

  @Column({ name: 'payment_type', length: 30, default: 'Cash' })
  paymentType: string;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
