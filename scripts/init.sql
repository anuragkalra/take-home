-- Initialize the sponsorships table
CREATE TABLE IF NOT EXISTS sponsorships (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    sponsor_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed with sample data
INSERT INTO sponsorships (title, amount, sponsor_name, description, status) VALUES
    ('Tech Conference 2026', 5000.00, 'Acme Corp', 'Annual tech conference sponsorship', 'active'),
    ('Startup Hackathon', 2500.00, 'Innovation Labs', 'Weekend hackathon event', 'active'),
    ('Developer Meetup', 1000.00, 'Code Academy', 'Monthly developer meetup series', 'pending'),
    ('Open Source Fund', 10000.00, 'Tech Giants Inc', 'Supporting open source projects', 'active'),
    ('Student Scholarships', 3000.00, 'Future Foundation', 'Scholarships for aspiring developers', 'completed');
