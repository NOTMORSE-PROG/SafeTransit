-- Seed Major POIs (Malls, Schools, Airports) for Pickup Points
-- These need to exist BEFORE pickup points migration can reference them

-- Major Malls
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('SM Mall of Asia', 'Seaside Blvd, Pasay, Metro Manila', 14.53580, 120.98310, 'shopping_mall', 500),
('SM North EDSA', 'North Avenue, Quezon City', 14.65660, 121.02940, 'shopping_mall', 450),
('Ayala Malls Manila Bay', 'EDSA Extension, Parañaque', 14.52120, 120.98620, 'shopping_mall', 400),
('Robinsons Place Manila', '1000 Pedro Gil St, Ermita, Manila', 14.57920, 120.99350, 'shopping_mall', 380),
('Gateway Mall', 'Araneta City, Cubao, Quezon City', 14.61950, 121.05220, 'shopping_mall', 350),
('SM Megamall', 'EDSA corner Julia Vargas Ave, Mandaluyong', 14.58500, 121.05650, 'shopping_mall', 480),
('Trinoma', 'EDSA corner North Avenue, Quezon City', 14.65720, 121.03180, 'shopping_mall', 420),
('Greenbelt', 'Ayala Center, Makati', 14.55260, 121.02130, 'shopping_mall', 390),
('Glorietta', 'Ayala Center, Makati', 14.54940, 121.02540, 'shopping_mall', 385)
ON CONFLICT DO NOTHING;

-- Major Universities
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('Technological Institute of the Philippines Manila', '938 Aurora Blvd, Cubao, Quezon City', 14.60910, 121.02250, 'university', 300),
('University of the Philippines Diliman', 'Diliman, Quezon City', 14.65380, 121.06840, 'university', 450),
('Ateneo de Manila University', 'Katipunan Ave, Quezon City', 14.63900, 121.07780, 'university', 400),
('De La Salle University Manila', '2401 Taft Avenue, Malate, Manila', 14.56480, 120.99310, 'university', 380),
('University of Santo Tomas', 'España Blvd, Sampaloc, Manila', 14.60950, 120.98950, 'university', 360)
ON CONFLICT DO NOTHING;

-- Airports
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('NAIA Terminal 1', 'Ninoy Aquino International Airport Terminal 1, Parañaque', 14.50920, 121.01940, 'airport', 600),
('NAIA Terminal 2', 'Ninoy Aquino International Airport Terminal 2, Pasay', 14.51280, 121.01510, 'airport', 580),
('NAIA Terminal 3', 'Ninoy Aquino International Airport Terminal 3, Pasay', 14.50860, 121.00960, 'airport', 650),
('NAIA Terminal 4', 'Ninoy Aquino International Airport Domestic Terminal, Pasay', 14.51030, 121.01380, 'airport', 550)
ON CONFLICT DO NOTHING;

-- Major Train Stations
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('MRT Cubao Station', 'EDSA, Cubao, Quezon City', 14.61890, 121.05180, 'station', 400),
('MRT Ayala Station', 'Ayala Ave, Makati', 14.54910, 121.02760, 'station', 420),
('MRT Taft Avenue Station', 'EDSA corner Taft Ave, Pasay', 14.53850, 121.00160, 'station', 380),
('LRT-1 EDSA Station', 'EDSA, Pasay', 14.54120, 121.00080, 'station', 360),
('LRT-2 Katipunan Station', 'Katipunan Ave, Quezon City', 14.63240, 121.07180, 'station', 340),
('LRT-2 Cubao Station', 'Aurora Blvd, Cubao, Quezon City', 14.61970, 121.05240, 'station', 350)
ON CONFLICT DO NOTHING;

-- Major Hospitals
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('Philippine General Hospital', 'Taft Avenue, Manila', 14.57810, 120.98620, 'hospital', 500),
('St. Lukes Medical Center BGC', 'Rizal Drive, BGC, Taguig', 14.55140, 121.05030, 'hospital', 450),
('Makati Medical Center', 'Amorsolo St, Makati', 14.56080, 121.01950, 'hospital', 420),
('The Medical City', 'Ortigas Ave, Pasig', 14.58810, 121.05710, 'hospital', 400),
('Manila Doctors Hospital', 'UN Avenue, Ermita, Manila', 14.58020, 120.98550, 'hospital', 380)
ON CONFLICT DO NOTHING;
