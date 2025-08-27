-- Initialize the database with required extensions and tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    original_filename VARCHAR(255),
    image_url VARCHAR(512),
    status VARCHAR(50) DEFAULT 'processing',
    extracted_data JSONB,
    excel_url VARCHAR(512),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_url VARCHAR(512) NOT NULL,
    field_mappings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing logs table
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    step VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_logs_invoice_id ON processing_logs(invoice_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, role) VALUES 
('admin@smartinvoice.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6jBdgTJXeK', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default template
INSERT INTO templates (name, description, template_url, field_mappings) VALUES 
(
    'Default Invoice Template',
    'Standard invoice processing template',
    '/templates/default_invoice_template.xlsx',
    '{
        "vendor_name": "A1",
        "invoice_number": "B1", 
        "invoice_date": "C1",
        "total_amount": "D1",
        "tax_amount": "E1",
        "line_items_start": "A5"
    }'::jsonb
)
ON CONFLICT DO NOTHING;
