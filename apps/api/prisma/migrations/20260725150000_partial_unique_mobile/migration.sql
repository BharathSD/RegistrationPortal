-- Soft-deleting a player (DeletePlayerUseCase) previously left their mobile
-- number permanently squatted, because "players_mobile_key" was a plain,
-- unconditional unique index — the deleted row (and its mobile) stayed in
-- it forever, so that number could never be used to register again.
--
-- Replace it with a regular (non-unique) index for lookup performance, plus
-- a partial unique index that only applies to active rows. This is the
-- standard Postgres pattern for "unique among non-deleted rows" — Prisma's
-- schema DSL can't express a partial index directly, so this constraint is
-- unmanaged from schema.prisma's point of view (see the comment on the
-- `mobile` field) and lives only here.

DROP INDEX "players_mobile_key";

CREATE INDEX "players_mobile_idx" ON "players"("mobile");

CREATE UNIQUE INDEX "players_mobile_active_key" ON "players"("mobile") WHERE "deleted_at" IS NULL;

-- Also add the index on payments.provider_order_id that
-- PrismaPaymentRepository.findByProviderOrderId (used by the payment
-- webhook handler) relies on — it was doing an unindexed findFirst scan.

CREATE INDEX "payments_provider_order_id_idx" ON "payments"("provider_order_id");
