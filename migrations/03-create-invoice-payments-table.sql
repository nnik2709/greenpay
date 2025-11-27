-- Migration: Create invoice_payments table for payment tracking
-- Records all payments (partial/full) against invoices

CREATE TABLE IF NOT EXISTS invoice_payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Payment Details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,

  -- Audit Fields
  recorded_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('CASH', 'CARD', 'BANK TRANSFER', 'EFTPOS', 'CHEQUE', 'OTHER'))
);

-- Indexes for performance
CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_date ON invoice_payments(payment_date);
CREATE INDEX idx_invoice_payments_method ON invoice_payments(payment_method);

-- Comments for documentation
COMMENT ON TABLE invoice_payments IS 'Payment records for invoices supporting partial and full payments';
COMMENT ON COLUMN invoice_payments.payment_method IS 'Payment method: CASH, CARD, BANK TRANSFER, EFTPOS, CHEQUE, OTHER';
COMMENT ON COLUMN invoice_payments.reference_number IS 'Transaction reference, receipt number, or cheque number';
COMMENT ON COLUMN invoice_payments.recorded_by IS 'User ID who recorded the payment';

-- Function to update invoice amounts after payment
CREATE OR REPLACE FUNCTION update_invoice_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
  v_new_status VARCHAR(20);
BEGIN
  -- Calculate total paid for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM invoice_payments
  WHERE invoice_id = NEW.invoice_id;

  -- Get invoice total
  SELECT total_amount INTO v_total_amount
  FROM invoices
  WHERE id = NEW.invoice_id;

  -- Determine new status
  IF v_total_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update invoice
  UPDATE invoices
  SET
    amount_paid = v_total_paid,
    amount_due = v_total_amount - v_total_paid,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update invoice after payment
CREATE TRIGGER trigger_update_invoice_after_payment
AFTER INSERT ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_after_payment();

-- Also handle payment deletion (refund scenario)
CREATE OR REPLACE FUNCTION update_invoice_after_payment_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
  v_new_status VARCHAR(20);
BEGIN
  -- Calculate total paid for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM invoice_payments
  WHERE invoice_id = OLD.invoice_id;

  -- Get invoice total
  SELECT total_amount INTO v_total_amount
  FROM invoices
  WHERE id = OLD.invoice_id;

  -- Determine new status
  IF v_total_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update invoice
  UPDATE invoices
  SET
    amount_paid = v_total_paid,
    amount_due = v_total_amount - v_total_paid,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = OLD.invoice_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_after_payment_delete
AFTER DELETE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_after_payment_delete();
