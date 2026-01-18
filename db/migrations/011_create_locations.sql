-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL, -- 'station', 'mall', 'landmark', 'general'
  search_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster search
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_locations_address ON locations USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_locations_search_count ON locations (search_count DESC);

-- Seed initial data (MRT-3 Stations)
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('North Avenue Station', 'MRT-3 North Avenue Station, EDSA, Quezon City', 14.6521, 121.0323, 'station', 100),
('Quezon Avenue Station', 'MRT-3 Quezon Avenue Station, EDSA, Quezon City', 14.6423, 121.0385, 'station', 90),
('GMA-Kamuning Station', 'MRT-3 GMA-Kamuning Station, EDSA, Quezon City', 14.6352, 121.0433, 'station', 85),
('Araneta Center-Cubao Station', 'MRT-3 Araneta Center-Cubao Station, EDSA, Quezon City', 14.6195, 121.0511, 'station', 150),
('Santolan-Annapolis Station', 'MRT-3 Santolan-Annapolis Station, EDSA, Quezon City', 14.6083, 121.0564, 'station', 70),
('Ortigas Station', 'MRT-3 Ortigas Station, EDSA, Mandaluyong', 14.5879, 121.0567, 'station', 120),
('Shaw Boulevard Station', 'MRT-3 Shaw Boulevard Station, EDSA, Mandaluyong', 14.5812, 121.0536, 'station', 130),
('Boni Station', 'MRT-3 Boni Station, EDSA, Mandaluyong', 14.5737, 121.0475, 'station', 80),
('Guadalupe Station', 'MRT-3 Guadalupe Station, EDSA, Makati', 14.5673, 121.0456, 'station', 110),
('Buendia Station', 'MRT-3 Buendia Station, EDSA, Makati', 14.5543, 121.0345, 'station', 95),
('Ayala Station', 'MRT-3 Ayala Station, EDSA, Makati', 14.5493, 121.0279, 'station', 200),
('Magallanes Station', 'MRT-3 Magallanes Station, EDSA, Makati', 14.5420, 121.0195, 'station', 75),
('Taft Avenue Station', 'MRT-3 Taft Avenue Station, EDSA, Pasay', 14.5376, 121.0014, 'station', 140);

-- Seed initial data (LRT-1 Stations - Selected)
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('Roosevelt Station', 'LRT-1 Roosevelt Station, Quezon City', 14.6576, 121.0211, 'station', 60),
('Balintawak Station', 'LRT-1 Balintawak Station, Quezon City', 14.6574, 121.0005, 'station', 65),
('Monumento Station', 'LRT-1 Monumento Station, Caloocan', 14.6542, 120.9839, 'station', 80),
('Doroteo Jose Station', 'LRT-1 Doroteo Jose Station, Manila', 14.6054, 120.9821, 'station', 90),
('Carriedo Station', 'LRT-1 Carriedo Station, Manila', 14.5995, 120.9813, 'station', 85),
('Central Terminal Station', 'LRT-1 Central Terminal Station, Manila', 14.5928, 120.9816, 'station', 75),
('United Nations Station', 'LRT-1 United Nations Station, Manila', 14.5826, 120.9850, 'station', 70),
('Pedro Gil Station', 'LRT-1 Pedro Gil Station, Manila', 14.5768, 120.9882, 'station', 80),
('Quirino Station', 'LRT-1 Quirino Station, Manila', 14.5703, 120.9915, 'station', 65),
('Vito Cruz Station', 'LRT-1 Vito Cruz Station, Manila', 14.5633, 120.9948, 'station', 95),
('Gil Puyat Station', 'LRT-1 Gil Puyat Station, Pasay', 14.5540, 120.9975, 'station', 100),
('Libertad Station', 'LRT-1 Libertad Station, Pasay', 14.5476, 120.9983, 'station', 60),
('EDSA Station', 'LRT-1 EDSA Station, Pasay', 14.5386, 121.0006, 'station', 110),
('Baclaran Station', 'LRT-1 Baclaran Station, Pasay', 14.5343, 120.9983, 'station', 120);

-- Seed initial data (LRT-2 Stations - Selected)
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('Recto Station', 'LRT-2 Recto Station, Manila', 14.6033, 120.9833, 'station', 85),
('Legarda Station', 'LRT-2 Legarda Station, Manila', 14.6008, 120.9926, 'station', 60),
('Pureza Station', 'LRT-2 Pureza Station, Manila', 14.6015, 121.0053, 'station', 55),
('V. Mapa Station', 'LRT-2 V. Mapa Station, Manila', 14.6038, 121.0173, 'station', 50),
('J. Ruiz Station', 'LRT-2 J. Ruiz Station, San Juan', 14.6105, 121.0264, 'station', 45),
('Gilmore Station', 'LRT-2 Gilmore Station, Quezon City', 14.6135, 121.0342, 'station', 65),
('Betty Go-Belmonte Station', 'LRT-2 Betty Go-Belmonte Station, Quezon City', 14.6186, 121.0427, 'station', 40),
('Araneta Center-Cubao Station', 'LRT-2 Araneta Center-Cubao Station, Quezon City', 14.6203, 121.0525, 'station', 130),
('Anonas Station', 'LRT-2 Anonas Station, Quezon City', 14.6280, 121.0646, 'station', 60),
('Katipunan Station', 'LRT-2 Katipunan Station, Quezon City', 14.6313, 121.0738, 'station', 110),
('Santolan Station', 'LRT-2 Santolan Station, Pasig', 14.6223, 121.0858, 'station', 70),
('Marikina-Pasig Station', 'LRT-2 Marikina-Pasig Station, Marikina', 14.6196, 121.0963, 'station', 65),
('Antipolo Station', 'LRT-2 Antipolo Station, Antipolo', 14.6253, 121.1216, 'station', 80);

-- Seed initial data (Popular Malls)
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('SM Mall of Asia', 'SM Mall of Asia, Pasay City', 14.5355, 120.9826, 'mall', 250),
('SM Megamall', 'SM Megamall, EDSA, Mandaluyong', 14.5842, 121.0567, 'mall', 220),
('SM North EDSA', 'SM City North EDSA, Quezon City', 14.6564, 121.0288, 'mall', 210),
('Greenbelt', 'Greenbelt Mall, Makati City', 14.5520, 121.0204, 'mall', 180),
('Glorietta', 'Glorietta Mall, Makati City', 14.5505, 121.0265, 'mall', 170),
('Trinoma', 'Trinoma Mall, Quezon City', 14.6536, 121.0336, 'mall', 160),
('Robinsons Place Manila', 'Robinsons Place Manila, Ermita, Manila', 14.5744, 120.9839, 'mall', 140),
('Robinsons Galleria', 'Robinsons Galleria, Ortigas, Quezon City', 14.5905, 121.0596, 'mall', 130),
('Uptown Mall', 'Uptown Mall, BGC, Taguig', 14.5566, 121.0533, 'mall', 150),
('Venice Grand Canal Mall', 'Venice Grand Canal Mall, Taguig', 14.5350, 121.0516, 'mall', 140),
('Bonifacio High Street', 'Bonifacio High Street, BGC, Taguig', 14.5516, 121.0505, 'mall', 190);

-- Seed initial data (Landmarks & Areas)
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('NAIA Terminal 1', 'Ninoy Aquino International Airport Terminal 1, Paranaque', 14.5056, 121.0055, 'landmark', 200),
('NAIA Terminal 2', 'Ninoy Aquino International Airport Terminal 2, Pasay', 14.5097, 121.0139, 'landmark', 190),
('NAIA Terminal 3', 'Ninoy Aquino International Airport Terminal 3, Pasay', 14.5134, 121.0195, 'landmark', 220),
('NAIA Terminal 4', 'Ninoy Aquino International Airport Terminal 4, Pasay', 14.5226, 121.0016, 'landmark', 150),
('Rizal Park', 'Rizal Park, Ermita, Manila', 14.5826, 120.9787, 'landmark', 160),
('Intramuros', 'Intramuros, Manila', 14.5896, 120.9747, 'landmark', 170),
('Makati Medical Center', 'Makati Medical Center, Makati City', 14.5593, 121.0145, 'landmark', 120),
('St. Lukes Medical Center BGC', 'St. Lukes Medical Center, BGC, Taguig', 14.5543, 121.0478, 'landmark', 110),
('St. Lukes Medical Center QC', 'St. Lukes Medical Center, Quezon City', 14.6225, 121.0232, 'landmark', 100),
('Philippine General Hospital', 'Philippine General Hospital, Manila', 14.5786, 120.9845, 'landmark', 130),
('University of the Philippines Diliman', 'UP Diliman, Quezon City', 14.6538, 121.0685, 'landmark', 140),
('Ateneo de Manila University', 'Ateneo de Manila University, Quezon City', 14.6396, 121.0777, 'landmark', 130),
('De La Salle University', 'De La Salle University, Manila', 14.5648, 120.9932, 'landmark', 130),
('University of Santo Tomas', 'University of Santo Tomas, Manila', 14.6105, 120.9896, 'landmark', 130);
