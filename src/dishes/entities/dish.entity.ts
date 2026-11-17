import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { AllergenEntity } from '../../allergens/entities/allergen.entity.js';
import { MenuCategoryEntity } from '../../menu-categories/entities/menu-category.entity.js';

const decimalToNumber: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};

@Entity('dishes')
export class DishEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  slug: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    transformer: decimalToNumber,
  })
  price: number;

  @Column({ type: 'integer' })
  weightGrams: number;

  @Column({ type: 'integer' })
  calories: number;

  @Column({ type: 'boolean', default: false })
  isSpicy: boolean;

  @ManyToOne(() => MenuCategoryEntity, (category) => category.dishes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'menu_category_id' })
  menuCategory: Relation<MenuCategoryEntity> | null;

  @ManyToMany(() => AllergenEntity, (allergen) => allergen.dishes, {
    cascade: true,
  })
  @JoinTable({
    name: 'dish_allergens',
    joinColumn: { name: 'dish_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'allergen_id', referencedColumnName: 'id' },
  })
  allergens: AllergenEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
