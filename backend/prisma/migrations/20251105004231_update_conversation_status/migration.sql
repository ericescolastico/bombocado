-- AlterEnum
ALTER TYPE "ConversationStatus" ADD VALUE 'AGUARDANDO';
ALTER TYPE "ConversationStatus" ADD VALUE 'EM_ATENDIMENTO';
ALTER TYPE "ConversationStatus" ADD VALUE 'ATENDIDO';

-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO';

