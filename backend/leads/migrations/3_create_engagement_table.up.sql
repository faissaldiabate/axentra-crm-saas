CREATE TABLE lead_engagement (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'email_open', 'email_click', 'email_reply', 'call_answered', 'meeting_scheduled'
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_engagement_lead_id ON lead_engagement(lead_id);
CREATE INDEX idx_lead_engagement_event_type ON lead_engagement(event_type);
CREATE INDEX idx_lead_engagement_created_at ON lead_engagement(created_at);
