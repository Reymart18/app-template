import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '../members/member.entity.js';

@Entity('billings')
@Index(['member', 'billingMonth'], { unique: true })
export class Billing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'billing_month', length: 7 })
  billingMonth: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  rate: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  principal: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  interest: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  penalty: string;

  @Column({ name: 'previous_principal', type: 'decimal', precision: 14, scale: 2, default: 0 })
  previousPrincipal: string;

  @Column({ name: 'previous_interest', type: 'decimal', precision: 14, scale: 2, default: 0 })
  previousInterest: string;

  @Column({ name: 'previous_penalty', type: 'decimal', precision: 14, scale: 2, default: 0 })
  previousPenalty: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
