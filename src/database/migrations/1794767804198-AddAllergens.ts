import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllergens1794767804198 implements MigrationInterface {
  name = 'AddAllergens1794767804198';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "allergens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(60) NOT NULL, "description" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d73253c8773f3fa18a3eb2e6721" UNIQUE ("name"), CONSTRAINT "PK_c8da6052d5476bc22463c7f8321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dish_allergens" ("dish_id" uuid NOT NULL, "allergen_id" uuid NOT NULL, CONSTRAINT "PK_acb58181fe66bb6475d529406f9" PRIMARY KEY ("dish_id", "allergen_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_605984f6881df2c60721fd2f95" ON "dish_allergens"  ("dish_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a199572267f7d1891c12db0e93" ON "dish_allergens"  ("allergen_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dish_allergens" ADD CONSTRAINT "FK_605984f6881df2c60721fd2f958" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "dish_allergens" ADD CONSTRAINT "FK_a199572267f7d1891c12db0e935" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dish_allergens" DROP CONSTRAINT "FK_a199572267f7d1891c12db0e935"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dish_allergens" DROP CONSTRAINT "FK_605984f6881df2c60721fd2f958"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a199572267f7d1891c12db0e93"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_605984f6881df2c60721fd2f95"`,
    );
    await queryRunner.query(`DROP TABLE "dish_allergens"`);
    await queryRunner.query(`DROP TABLE "allergens"`);
  }
}
