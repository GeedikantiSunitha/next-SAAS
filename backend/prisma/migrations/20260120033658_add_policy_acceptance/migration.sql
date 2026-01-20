-- CreateTable
CREATE TABLE "policy_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL DEFAULT '1.0',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "policy_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policy_acceptances_userId_idx" ON "policy_acceptances"("userId");

-- CreateIndex
CREATE INDEX "policy_acceptances_policyType_idx" ON "policy_acceptances"("policyType");

-- CreateIndex
CREATE INDEX "policy_acceptances_acceptedAt_idx" ON "policy_acceptances"("acceptedAt");

-- AddForeignKey
ALTER TABLE "policy_acceptances" ADD CONSTRAINT "policy_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
