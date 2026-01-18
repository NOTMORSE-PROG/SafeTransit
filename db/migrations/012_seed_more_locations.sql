-- Add more locations to the database
-- Major Roads
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('EDSA', 'Epifanio de los Santos Avenue, Metro Manila', 14.5839, 121.0568, 'general', 300),
('Taft Avenue', 'Taft Avenue, Manila', 14.5723, 120.9912, 'general', 280),
('Quezon Avenue', 'Quezon Avenue, Quezon City', 14.6342, 121.0215, 'general', 250),
('Commonwealth Avenue', 'Commonwealth Avenue, Quezon City', 14.6685, 121.0658, 'general', 240),
('Roxas Boulevard', 'Roxas Boulevard, Manila', 14.5647, 120.9845, 'general', 220),
('C-5 Road', 'Circumferential Road 5, Metro Manila', 14.5863, 121.0745, 'general', 210),
('Shaw Boulevard', 'Shaw Boulevard, Mandaluyong', 14.5882, 121.0435, 'general', 200),
('Ortigas Avenue', 'Ortigas Avenue, Pasig', 14.5923, 121.0765, 'general', 190),
('Aurora Boulevard', 'Aurora Boulevard, Quezon City', 14.6215, 121.0532, 'general', 180),
('España Boulevard', 'España Boulevard, Manila', 14.6095, 120.9935, 'general', 170);

-- Key Districts / Areas
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('BGC', 'Bonifacio Global City, Taguig', 14.5547, 121.0509, 'general', 400),
('Makati CBD', 'Central Business District, Makati', 14.5547, 121.0244, 'general', 380),
('Ortigas Center', 'Ortigas Center, Pasig/Mandaluyong', 14.5868, 121.0614, 'general', 350),
('Eastwood City', 'Eastwood City, Quezon City', 14.6106, 121.0807, 'general', 250),
('Rockwell Center', 'Rockwell Center, Makati', 14.5645, 121.0365, 'general', 220),
('Binondo', 'Binondo, Manila', 14.6006, 120.9745, 'general', 200),
('Malate', 'Malate, Manila', 14.5715, 120.9875, 'general', 180),
('Tomas Morato', 'Tomas Morato Avenue, Quezon City', 14.6345, 121.0365, 'general', 190),
('Maginhawa', 'Maginhawa Street, Quezon City', 14.6435, 121.0612, 'general', 170),
('Kapitolyo', 'Kapitolyo, Pasig', 14.5745, 121.0585, 'general', 160);

-- Universities (More)
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('PUP Sta. Mesa', 'Polytechnic University of the Philippines, Sta. Mesa, Manila', 14.5975, 121.0105, 'landmark', 150),
('FEU Manila', 'Far Eastern University, Sampaloc, Manila', 14.6042, 120.9865, 'landmark', 140),
('Adamson University', 'Adamson University, Ermita, Manila', 14.5865, 120.9855, 'landmark', 130),
('Mapua University', 'Mapua University, Intramuros, Manila', 14.5905, 120.9775, 'landmark', 120),
('San Beda University', 'San Beda University, Mendiola, Manila', 14.5985, 120.9925, 'landmark', 110);

-- Transport Terminals
INSERT INTO locations (name, address, latitude, longitude, type, search_count) VALUES
('PITX', 'Parañaque Integrated Terminal Exchange, Parañaque', 14.5105, 120.9915, 'station', 300),
('Araneta City Bus Port', 'Araneta City Bus Port, Cubao, Quezon City', 14.6195, 121.0535, 'station', 250),
('Victory Liner Pasay', 'Victory Liner Terminal, Pasay', 14.5465, 121.0025, 'station', 200),
('Five Star Cubao', 'Five Star Bus Terminal, Cubao, Quezon City', 14.6245, 121.0435, 'station', 180);
