import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '../members/member.entity.js';

@Entity('adjustments')
export class Adjustment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'adjustment_date', type: 'date' })
  adjustmentDate: string;

  @Column({ length: 20 })
  component: string;

  @Column({ length: 10 })
  direction: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'created_by_user_id', type: 'int', nullable: true })
  createdByUserId: number | null;

  @Column({ name: 'created_by_username', length: 80 })
  createdByUsername: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
