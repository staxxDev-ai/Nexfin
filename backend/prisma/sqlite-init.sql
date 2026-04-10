-- Gatilhos de Imutabilidade para o NEXFIN v3.1 (SQLite)

-- 1. Bloquear alterações em transações
CREATE TRIGGER IF NOT EXISTS prevent_transaction_update
BEFORE UPDATE ON transactions
BEGIN
  SELECT RAISE(ABORT, 'Operação Bloqueada: Transações financeiras não podem ser alteradas no NEXFIN v3.1.');
END;

-- 2. Bloquear exclusões de transações
CREATE TRIGGER IF NOT EXISTS prevent_transaction_delete
BEFORE DELETE ON transactions
BEGIN
  SELECT RAISE(ABORT, 'Operação Bloqueada: Transações financeiras não podem ser apagadas do Ledger.');
END;

-- 3. Bloquear alterações no histórico do Ledger (Auditoria)
-- Nota: Caso a tabela ledger_history ainda não exista (é gerada por ALE), este trigger será aplicado na próxima migração
