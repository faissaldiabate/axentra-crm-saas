CREATE TABLE followup_logs (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent'
);

CREATE INDEX idx_followup_logs_lead_id ON followup_logs(lead_id);
CREATE INDEX idx_followup_logs_sent_at ON followup_logs(sent_at);
