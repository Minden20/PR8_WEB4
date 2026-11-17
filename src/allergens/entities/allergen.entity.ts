import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DishEntity } from '../../dishes/entities/dish.entity.js';

@Entity('allergens')
export class AllergenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToMany(() => DishEntity, (dish) => dish.allergens)
  dishes: DishEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
