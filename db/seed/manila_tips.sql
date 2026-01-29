-- Manila Safety Tips Seed Data
-- 100 realistic safety tips for major Metro Manila areas
-- Focus: Makati, BGC, Quezon City, Manila City, Pasig, Mandaluyong

-- Get a random user ID (you'll need to replace this with an actual user ID)
-- For initial seeding, tips are auto-approved and associated with the first user

-- ============================================================================
-- MAKATI CBD
-- ============================================================================

INSERT INTO tips (id, author_id, title, message, category, latitude, longitude, location_name, time_relevance, status, created_at) VALUES
-- Ayala Avenue area
('00000001-0000-0000-0000-000000000001', (SELECT id FROM users LIMIT 1), 'Well-lit Ayala Avenue', 'Ayala Avenue is well-lit at night with regular security patrols. Safe for walking even late evening.', 'lighting', 14.5547, 121.0244, 'Ayala Avenue, Makati', '24/7', 'approved', NOW() - INTERVAL '30 days'),
('00000001-0000-0000-0000-000000000002', (SELECT id FROM users LIMIT 1), 'MRT Ayala Safe Exit A', 'Use Exit A from MRT Ayala - has security guard and connects directly to Glorietta. Well-lit walkway.', 'transit', 14.5555, 121.0281, 'MRT Ayala Station', '24/7', 'approved', NOW() - INTERVAL '25 days'),
('00000001-0000-0000-0000-000000000003', (SELECT id FROM users LIMIT 1), 'Glorietta Security Post', 'Glorietta has security posts on every floor. Safe area with CCTV coverage.', 'safe_haven', 14.5507, 121.0267, 'Glorietta Mall, Makati', '24/7', 'approved', NOW() - INTERVAL '20 days'),
('00000001-0000-0000-0000-000000000004', (SELECT id FROM users LIMIT 1), 'Greenbelt Park Evening Safety', 'Greenbelt Park is safe in the evening with good lighting and security presence. Popular walking area.', 'safe_haven', 14.5538, 121.0233, 'Greenbelt, Makati', 'evening', 'approved', NOW() - INTERVAL '18 days'),

-- Poblacion area
('00000001-0000-0000-0000-000000000005', (SELECT id FROM users LIMIT 1), 'Poblacion Well-Populated', 'Poblacion area is well-populated at night with many bars and restaurants. Safe for night walking on main streets.', 'safe_haven', 14.5622, 121.0342, 'Poblacion, Makati', 'evening', 'approved', NOW() - INTERVAL '15 days'),
('00000001-0000-0000-0000-000000000006', (SELECT id FROM users LIMIT 1), 'Side Streets Dark', 'Avoid small side streets in Poblacion at night - poorly lit. Stick to main roads like Don Pedro.', 'lighting', 14.5618, 121.0356, 'Poblacion Side Streets', 'night', 'approved', NOW() - INTERVAL '12 days'),

-- Rockwell area
('00000001-0000-0000-0000-000000000007', (SELECT id FROM users LIMIT 1), 'Rockwell High Security', 'Rockwell area has excellent security. CCTV everywhere and security guards at all entrances.', 'safe_haven', 14.5642, 121.0392, 'Rockwell Center, Makati', '24/7', 'approved', NOW() - INTERVAL '10 days'),

-- ============================================================================
-- BGC (Bonifacio Global City)
-- ============================================================================

('00000001-0000-0000-0000-000000000008', (SELECT id FROM users LIMIT 1), 'BGC High Street Safe Zone', 'BGC High Street has high security presence, CCTV coverage, and excellent lighting. Safe 24/7.', 'safe_haven', 14.5515, 121.0484, 'BGC High Street', '24/7', 'approved', NOW() - INTERVAL '9 days'),
('00000001-0000-0000-0000-000000000009', (SELECT id FROM users LIMIT 1), 'BGC Bus Stop Security', 'BGC Bus Terminal has security guards and good lighting. Safe waiting area even late night.', 'transit', 14.5501, 121.0507, 'BGC Bus Terminal', '24/7', 'approved', NOW() - INTERVAL '8 days'),
('00000001-0000-0000-0000-000000000010', (SELECT id FROM users LIMIT 1), 'Market Market Security', 'Market Market has security checkpoints at all entrances. Very safe shopping area.', 'safe_haven', 14.5488, 121.0532, 'Market Market, BGC', '24/7', 'approved', NOW() - INTERVAL '7 days'),
('00000001-0000-0000-0000-000000000011', (SELECT id FROM users LIMIT 1), 'BGC Central Park Jogging', 'Central Park BGC is safe for evening jogging. Well-lit paths and regular security patrols.', 'safe_haven', 14.5529, 121.0453, 'BGC Central Park', 'evening', 'approved', NOW() - INTERVAL '6 days'),
('00000001-0000-0000-0000-000000000012', (SELECT id FROM users LIMIT 1), 'Bonifacio High Street CCTV', 'Entire Bonifacio High Street area has extensive CCTV coverage. Report any issues to roving security.', 'safe_haven', 14.5502, 121.0463, 'Bonifacio High Street', '24/7', 'approved', NOW() - INTERVAL '5 days'),

-- ============================================================================
-- QUEZON CITY
-- ============================================================================

-- UP Diliman area
('00000001-0000-0000-0000-000000000013', (SELECT id FROM users LIMIT 1), 'UP Diliman Campus Security', 'UP Diliman has roving security and emergency poles throughout campus. Generally safe during daytime.', 'safe_haven', 14.6537, 121.0685, 'UP Diliman Campus', 'afternoon', 'approved', NOW() - INTERVAL '4 days'),
('00000001-0000-0000-0000-000000000014', (SELECT id FROM users LIMIT 1), 'UP Area Academic Oval Night', 'Academic Oval can be dark at night. Avoid jogging alone after 8 PM. Better in groups.', 'lighting', 14.6551, 121.0692, 'Academic Oval, UP Diliman', 'night', 'approved', NOW() - INTERVAL '3 days'),
('00000001-0000-0000-0000-000000000015', (SELECT id FROM users LIMIT 1), 'Katipunan Avenue Poor Lighting', 'Area near Ateneo back gate is poorly lit at night. Take Uber/Grab instead of walking.', 'lighting', 14.6387, 121.0774, 'Katipunan Avenue', 'night', 'approved', NOW() - INTERVAL '2 days'),

-- Cubao area
('00000001-0000-0000-0000-000000000016', (SELECT id FROM users LIMIT 1), 'Farmers Plaza Security', 'Farmers Plaza has security guards at all entrances. Safe shopping area with CCTV.', 'safe_haven', 14.6196, 121.0523, 'Farmers Plaza, Cubao', '24/7', 'approved', NOW() - INTERVAL '1 day'),
('00000001-0000-0000-0000-000000000017', (SELECT id FROM users LIMIT 1), 'Araneta Center Safe Zone', 'Araneta Center area is well-secured with multiple security posts. Smart Araneta Coliseum area especially safe.', 'safe_haven', 14.6200, 121.0505, 'Araneta Center, Cubao', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000018', (SELECT id FROM users LIMIT 1), 'Cubao MRT Pickpockets', 'Watch for pickpockets at Cubao MRT during rush hours (5-7 PM). Keep bags in front.', 'harassment', 14.6191, 121.0512, 'MRT Cubao Station', 'evening', 'approved', NOW()),

-- QC Circle area
('00000001-0000-0000-0000-000000000019', (SELECT id FROM users LIMIT 1), 'Quezon Memorial Circle Safe', 'QC Circle area safe during daytime with families. Avoid late night visits - some areas poorly lit.', 'safe_haven', 14.6524, 121.0500, 'Quezon Memorial Circle', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000020', (SELECT id FROM users LIMIT 1), 'QC Circle Night Lighting', 'Inner circle paths dark at night. Stick to main pathways with street lamps if visiting evening.', 'lighting', 14.6520, 121.0495, 'QC Circle Inner Paths', 'night', 'approved', NOW()),

-- ============================================================================
-- MANILA CITY
-- ============================================================================

-- Intramuros
('00000001-0000-0000-0000-000000000021', (SELECT id FROM users LIMIT 1), 'Intramuros Tourist Police', 'Tourist police station near Manila Cathedral. Safe zone with regular patrols.', 'safe_haven', 14.5906, 120.9744, 'Intramuros, Manila', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000022', (SELECT id FROM users LIMIT 1), 'Fort Santiago Well-Lit', 'Fort Santiago area well-lit and secure during operating hours. Close by 6 PM.', 'lighting', 14.5933, 120.9738, 'Fort Santiago, Intramuros', 'afternoon', 'approved', NOW()),

-- LRT/Divisoria area
('00000001-0000-0000-0000-000000000023', (SELECT id FROM users LIMIT 1), 'LRT Carriedo Crowded', 'Very crowded during rush hour (7-9 AM, 5-7 PM). Watch for pickpockets. Keep valuables secure.', 'harassment', 14.5981, 120.9825, 'LRT Carriedo Station', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000024', (SELECT id FROM users LIMIT 1), 'Divisoria Construction', 'Ongoing road construction near Divisoria market. Alternate route via Recto Avenue available.', 'construction', 14.6039, 120.9722, 'Divisoria, Manila', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000025', (SELECT id FROM users LIMIT 1), 'Divisoria Market Guards', 'Market area has security guards at major entrances. Still crowded - keep bags secure.', 'safe_haven', 14.6042, 120.9728, 'Divisoria Market', 'afternoon', 'approved', NOW()),

-- Ermita/Malate
('00000001-0000-0000-0000-000000000026', (SELECT id FROM users LIMIT 1), 'Roxas Boulevard Well-Lit', 'Roxas Boulevard well-lit with streetlights. Safe for evening walks along baywalk area.', 'lighting', 14.5789, 120.9796, 'Roxas Boulevard', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000027', (SELECT id FROM users LIMIT 1), 'Rizal Park Security', 'Rizal Park has security presence during day. Avoid visiting after dark - poorly lit in some areas.', 'safe_haven', 14.5834, 120.9794, 'Rizal Park, Manila', 'afternoon', 'approved', NOW()),

-- ============================================================================
-- PASIG CITY
-- ============================================================================

-- Ortigas area
('00000001-0000-0000-0000-000000000028', (SELECT id FROM users LIMIT 1), 'Ortigas Center Safe', 'Ortigas Center business district has good security. Safe during business hours and early evening.', 'safe_haven', 14.5858, 121.0563, 'Ortigas Center, Pasig', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000029', (SELECT id FROM users LIMIT 1), 'Megamall Security Posts', 'SM Megamall has security checkpoints and CCTV throughout. Very safe shopping area.', 'safe_haven', 14.5847, 121.0563, 'SM Megamall, Ortigas', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000030', (SELECT id FROM users LIMIT 1), 'MRT Shaw Elevated', 'MRT Shaw station safe but can be crowded rush hours. Use elevated walkway to Shangri-La.', 'transit', 14.5816, 121.0532, 'MRT Shaw Station', '24/7', 'approved', NOW()),

-- Kapitolyo
('00000001-0000-0000-0000-000000000031', (SELECT id FROM users LIMIT 1), 'Kapitolyo Food Street Safe', 'Kapitolyo food street area well-populated evenings. Safe for dining, good street lighting.', 'safe_haven', 14.5692, 121.0647, 'Kapitolyo, Pasig', 'evening', 'approved', NOW()),

-- ============================================================================
-- MANDALUYONG CITY
-- ============================================================================

('00000001-0000-0000-0000-000000000032', (SELECT id FROM users LIMIT 1), 'EDSA Shaw Underpass', 'EDSA Shaw underpass safe during day but avoid late night. Better to use footbridge.', 'transit', 14.5808, 121.0492, 'EDSA Shaw Boulevard', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000033', (SELECT id FROM users LIMIT 1), 'Shangri-La Plaza Security', 'Shangri-La Plaza has excellent security. Safe shopping destination with parking security.', 'safe_haven', 14.5804, 121.0533, 'Shangri-La Plaza, Mandaluyong', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000034', (SELECT id FROM users LIMIT 1), 'MRT Boni Crowded PM', 'MRT Boni station very crowded 5-7 PM. Watch belongings, use alternative routes if possible.', 'harassment', 14.5739, 121.0505, 'MRT Boni Station', 'evening', 'approved', NOW()),

-- ============================================================================
-- TAGUIG (outside BGC)
-- ============================================================================

('00000001-0000-0000-0000-000000000035', (SELECT id FROM users LIMIT 1), 'Venice Grand Canal Security', 'Venice Grand Canal Mall McKinley has good security and well-lit parking areas.', 'safe_haven', 14.5336, 121.0516, 'Venice Grand Canal, McKinley', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000036', (SELECT id FROM users LIMIT 1), 'McKinley Hill Safe Area', 'McKinley Hill residential area has 24/7 security checkpoints. Very safe neighborhood.', 'safe_haven', 14.5438, 121.0516, 'McKinley Hill, Taguig', '24/7', 'approved', NOW()),

-- ============================================================================
-- Additional Transit Tips
-- ============================================================================

('00000001-0000-0000-0000-000000000037', (SELECT id FROM users LIMIT 1), 'MRT Magallanes Safe Exit', 'MRT Magallanes Exit B leads to covered walkway. Safe route to nearby offices.', 'transit', 14.5425, 121.0199, 'MRT Magallanes Station', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000038', (SELECT id FROM users LIMIT 1), 'MRT Buendia Crowded AM', 'MRT Buendia packed 7-9 AM northbound. Alternative: Take bus along Taft Avenue.', 'transit', 14.5613, 121.0328, 'MRT Buendia Station', 'morning', 'approved', NOW()),
('00000001-0000-0000-0000-000000000039', (SELECT id FROM users LIMIT 1), 'EDSA Carousel Safe', 'EDSA Carousel buses are safe and air-conditioned. Female-only sections available during rush hour.', 'transit', 14.5564, 121.0293, 'EDSA Carousel Ayala', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000040', (SELECT id FROM users LIMIT 1), 'Guadalupe MRT Steep Stairs', 'Guadalupe MRT has steep stairs. Use elevator if carrying heavy items. Can be slippery when wet.', 'transit', 14.5567, 121.0401, 'MRT Guadalupe Station', '24/7', 'approved', NOW()),

-- ============================================================================
-- Additional Safety and Harassment Tips
-- ============================================================================

('00000001-0000-0000-0000-000000000041', (SELECT id FROM users LIMIT 1), 'Pioneer Underpass Dark', 'EDSA-Pioneer underpass poorly lit at night. Use footbridge instead or take Grab.', 'lighting', 14.5743, 121.0666, 'EDSA-Pioneer Underpass', 'night', 'approved', NOW()),
('00000001-0000-0000-0000-000000000042', (SELECT id FROM users LIMIT 1), 'Boni Avenue Night Walking', 'Boni Avenue safe during day but poorly lit at night. Stick to main road, avoid shortcuts.', 'lighting', 14.5721, 121.0472, 'Boni Avenue, Mandaluyong', 'night', 'approved', NOW()),
('00000001-0000-0000-0000-000000000043', (SELECT id FROM users LIMIT 1), 'Kalayaan Flyover Safe', 'Kalayaan Avenue Flyover area well-lit and patrolled. Safe for commuters even late evening.', 'lighting', 14.5492, 121.0395, 'Kalayaan Flyover, Makati', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000044', (SELECT id FROM users LIMIT 1), 'Centris Station Security', 'Centris Station area near Trinoma has security presence. Safe waiting area for transport.', 'safe_haven', 14.6553, 121.0347, 'Centris Station, QC', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000045', (SELECT id FROM users LIMIT 1), 'North Avenue Terminus Crowded', 'MRT North Avenue terminal extremely crowded AM rush. Consider starting from different station.', 'transit', 14.6561, 121.0321, 'MRT North Avenue Terminal', 'morning', 'approved', NOW()),

-- ============================================================================
-- Additional Lighting Tips
-- ============================================================================

('00000001-0000-0000-0000-000000000046', (SELECT id FROM users LIMIT 1), 'Pasig Greenway Safe Path', 'Pasig River Greenway has good lighting and security. Safe for evening walks and cycling.', 'lighting', 14.5677, 121.0625, 'Pasig River Greenway', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000047', (SELECT id FROM users LIMIT 1), 'Buendia-Pasay Dark Corner', 'Corner of Buendia and Pasay Road dark at night. Street light broken - avoid walking alone.', 'lighting', 14.5505, 121.0094, 'Buendia-Pasay Road', 'night', 'approved', NOW()),
('00000001-0000-0000-0000-000000000048', (SELECT id FROM users LIMIT 1), 'Chino Roces Well-Lit', 'Chino Roces Avenue well-lit from Magallanes to EDSA. Safe for evening commute.', 'lighting', 14.5516, 121.0237, 'Chino Roces Avenue', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000049', (SELECT id FROM users LIMIT 1), 'Salcedo Village Streets Lit', 'Salcedo Village residential streets well-lit. Security guards at building entrances.', 'lighting', 14.5585, 121.0203, 'Salcedo Village, Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000050', (SELECT id FROM users LIMIT 1), 'Legaspi Village Safe Evening', 'Legaspi Village area safe for evening walks. Well-lit streets and low crime rate.', 'safe_haven', 14.5567, 121.0157, 'Legaspi Village, Makati', 'evening', 'approved', NOW()),

-- ============================================================================
-- Construction and Infrastructure
-- ============================================================================

('00000001-0000-0000-0000-000000000051', (SELECT id FROM users LIMIT 1), 'EDSA-Ayala Construction', 'Ongoing roadwork at EDSA-Ayala intersection. Expect traffic delays 10 AM - 6 PM.', 'construction', 14.5486, 121.0304, 'EDSA-Ayala Intersection', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000052', (SELECT id FROM users LIMIT 1), 'Ortigas-EDSA Sidewalk Closed', 'Sidewalk construction near Ortigas-EDSA. Use alternate pedestrian route via Robinson Galleria.', 'construction', 14.5858, 121.0572, 'Ortigas-EDSA Intersection', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000053', (SELECT id FROM users LIMIT 1), 'C5-Kalayaan Road Work', 'Road widening project at C5-Kalayaan. Heavy traffic PM rush hours. Plan alternate route.', 'construction', 14.5518, 121.0693, 'C5-Kalayaan Intersection', 'evening', 'approved', NOW()),

-- ============================================================================
-- More Safe Haven and Emergency Points
-- ============================================================================

('00000001-0000-0000-0000-000000000054', (SELECT id FROM users LIMIT 1), 'Makati Police Station Nearby', 'Makati Central Police Station on Osmena Highway. Emergency assistance available 24/7.', 'safe_haven', 14.5539, 121.0332, 'Makati Central Police', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000055', (SELECT id FROM users LIMIT 1), 'BGC Police Outpost', 'BGC has police outpost near Bonifacio High Street. Fast response team for emergencies.', 'safe_haven', 14.5497, 121.0471, 'BGC Police Outpost', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000056', (SELECT id FROM users LIMIT 1), 'Ayala Museum Safe Meeting Point', 'Ayala Museum lobby safe meeting point. Security guards and CCTV coverage.', 'safe_haven', 14.5513, 121.0244, 'Ayala Museum, Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000057', (SELECT id FROM users LIMIT 1), 'Century City Mall Security', 'Century City Mall Makati has dedicated security team. Safe waiting area with WiFi.', 'safe_haven', 14.5652, 121.0382, 'Century City Mall', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000058', (SELECT id FROM users LIMIT 1), 'Power Plant Mall Secure', 'Power Plant Mall has security at all entrances. Safe for families, CCTV monitored.', 'safe_haven', 14.5634, 121.0368, 'Power Plant Mall, Makati', '24/7', 'approved', NOW()),

-- ============================================================================
-- Additional Harassment and Safety Warnings
-- ============================================================================

('00000001-0000-0000-0000-000000000059', (SELECT id FROM users LIMIT 1), 'Quiapo Church Area Crowded', 'Quiapo Church extremely crowded Fridays. Watch for pickpockets. Keep bags secure.', 'harassment', 14.5984, 120.9837, 'Quiapo Church, Manila', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000060', (SELECT id FROM users LIMIT 1), 'Baclaran Church Vendors', 'Baclaran Church area crowded with vendors Wed/Sun. Watch belongings, avoid showing valuables.', 'harassment', 14.5132, 120.9925, 'Baclaran Church, Paranaque', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000061', (SELECT id FROM users LIMIT 1), 'Guadalupe Bridge Catcalling', 'Guadalupe Bridge area reports of catcalling evening hours. Walk with companions if possible.', 'harassment', 14.5589, 121.0448, 'Guadalupe Bridge', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000062', (SELECT id FROM users LIMIT 1), 'Pasay LRT Pickpockets', 'LRT EDSA station in Pasay crowded rush hour. Reports of pickpocketing. Stay alert.', 'harassment', 14.5385, 121.0006, 'LRT EDSA Station, Pasay', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000063', (SELECT id FROM users LIMIT 1), 'Recto University Belt Safe Day', 'Recto area (University Belt) safe during daytime. Avoid late night - poorly lit side streets.', 'safe_haven', 14.6053, 120.9816, 'Recto Avenue, Manila', 'afternoon', 'approved', NOW()),

-- ============================================================================
-- More Specific Location Tips (70-100)
-- ============================================================================

('00000001-0000-0000-0000-000000000064', (SELECT id FROM users LIMIT 1), 'Arca South Well-Secured', 'Arca South Taguig has 24/7 security checkpoints. Gated community with CCTV.', 'safe_haven', 14.5074, 121.0465, 'Arca South, Taguig', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000065', (SELECT id FROM users LIMIT 1), 'Newport City Mall Safe', 'Newport City near NAIA Terminal 3 has tight security. Safe for late night arrivals.', 'safe_haven', 14.5144, 121.0199, 'Newport City, Pasay', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000066', (SELECT id FROM users LIMIT 1), 'MOA Complex Security', 'Mall of Asia complex has extensive CCTV and security. Safe for families shopping.', 'safe_haven', 14.5352, 120.9823, 'MOA Complex, Pasay', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000067', (SELECT id FROM users LIMIT 1), 'Alabang Town Center Secure', 'Alabang Town Center Muntinlupa has valet security and CCTV. Very safe shopping destination.', 'safe_haven', 14.4237, 121.0399, 'Alabang Town Center', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000068', (SELECT id FROM users LIMIT 1), 'Alabang-Zapote Road Well-Lit', 'Alabang-Zapote Road well-lit from Alabang to Las Pinas. Safe for evening drives.', 'lighting', 14.4103, 121.0255, 'Alabang-Zapote Road', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000069', (SELECT id FROM users LIMIT 1), 'Taft Avenue LRT Stations Safe', 'Taft Avenue LRT stations have security guards. Safe during operating hours (5 AM - 10 PM).', 'transit', 14.5512, 120.9953, 'Taft Avenue LRT', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000070', (SELECT id FROM users LIMIT 1), 'UN Avenue Safe Daytime', 'UN Avenue safe during business hours. Good lighting near government buildings.', 'safe_haven', 14.5789, 120.9882, 'UN Avenue, Manila', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000071', (SELECT id FROM users LIMIT 1), 'Luneta Park Evening Patrols', 'Luneta Park has tourist police patrols until 9 PM. Safe for evening relaxation.', 'safe_haven', 14.5831, 120.9785, 'Luneta Park, Manila', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000072', (SELECT id FROM users LIMIT 1), 'Manila Ocean Park Secure', 'Manila Ocean Park area has security. Safe for family visits. Well-lit parking.', 'safe_haven', 14.5781, 120.9751, 'Manila Ocean Park', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000073', (SELECT id FROM users LIMIT 1), 'Robinsons Ermita Safe', 'Robinsons Place Manila (Ermita) has good security checkpoints. Safe shopping area.', 'safe_haven', 14.5811, 120.9885, 'Robinsons Ermita', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000074', (SELECT id FROM users LIMIT 1), 'UST Area Student Safe Zones', 'UST España area has student-friendly cafes with security. Safe study spaces until 10 PM.', 'safe_haven', 14.6093, 120.9892, 'UST Area, Manila', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000075', (SELECT id FROM users LIMIT 1), 'Morayta Side Streets Dark', 'Morayta side streets poorly lit. Use main Morayta Road for safer walking route.', 'lighting', 14.6073, 120.9921, 'Morayta, Manila', 'night', 'approved', NOW()),
('00000001-0000-0000-0000-000000000076', (SELECT id FROM users LIMIT 1), 'Eastwood City Secure', 'Eastwood City Libis has gated security. Safe 24/7 for residents and visitors.', 'safe_haven', 14.6085, 121.0798, 'Eastwood City, QC', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000077', (SELECT id FROM users LIMIT 1), 'Trinoma Mall Safe Meeting', 'Trinoma North Triangle has security and safe meeting points. CCTV coverage throughout.', 'safe_haven', 14.6556, 121.0327, 'Trinoma, QC', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000078', (SELECT id FROM users LIMIT 1), 'SM North EDSA Secure', 'SM North EDSA has dedicated security team and CCTV. Safe for late night shopping.', 'safe_haven', 14.6569, 121.0295, 'SM North EDSA', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000079', (SELECT id FROM users LIMIT 1), 'Commonwealth Avenue Fast Traffic', 'Commonwealth Avenue has fast-moving traffic. Use footbridges, never jaywalk.', 'transit', 14.6727, 121.0697, 'Commonwealth Avenue, QC', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000080', (SELECT id FROM users LIMIT 1), 'Timog Avenue Nightlife Safe', 'Timog Avenue restaurant row safe evenings. Well-populated and patrolled area.', 'safe_haven', 14.6329, 121.0342, 'Timog Avenue, QC', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000081', (SELECT id FROM users LIMIT 1), 'Tomas Morato Safe Dining', 'Tomas Morato area safe for evening dining. Security presence from restaurants.', 'safe_haven', 14.6350, 121.0316, 'Tomas Morato, QC', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000082', (SELECT id FROM users LIMIT 1), 'Greenhills Shopping Safe', 'Greenhills Shopping Center has security checkpoints. Safe for bargain shopping.', 'safe_haven', 14.6025, 121.0461, 'Greenhills, San Juan', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000083', (SELECT id FROM users LIMIT 1), 'Wilson-EDSA Underpass Dark', 'Wilson-EDSA underpass poorly lit night. Use Santolan footbridge instead.', 'lighting', 14.6021, 121.0562, 'Wilson-EDSA Underpass', 'night', 'approved', NOW()),
('00000001-0000-0000-0000-000000000084', (SELECT id FROM users LIMIT 1), 'Santolan LRT Safe Station', 'LRT Santolan station well-maintained with security. Safe connection point.', 'transit', 14.6048, 121.0859, 'LRT Santolan Station', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000085', (SELECT id FROM users LIMIT 1), 'Marikina Riverbanks Lit', 'Marikina Riverbanks well-lit for evening jogging. Family-friendly area.', 'lighting', 14.6361, 121.1032, 'Marikina Riverbanks', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000086', (SELECT id FROM users LIMIT 1), 'Marikina Shoe Museum Safe', 'Marikina Shoe Museum area has security. Safe for tourist visits.', 'safe_haven', 14.6431, 121.0984, 'Marikina Shoe Museum', 'afternoon', 'approved', NOW()),
('00000001-0000-0000-0000-000000000087', (SELECT id FROM users LIMIT 1), 'Market Market Safe Parking', 'Market Market BGC has well-lit multi-level parking. Security on every level.', 'safe_haven', 14.5485, 121.0536, 'Market Market Parking', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000088', (SELECT id FROM users LIMIT 1), 'Uptown BGC Safe Complex', 'Uptown Bonifacio has residential security. Safe community with CCTV coverage.', 'safe_haven', 14.5562, 121.0462, 'Uptown BGC', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000089', (SELECT id FROM users LIMIT 1), 'SM Aura Premier Secure', 'SM Aura has premium security service. Very safe shopping destination.', 'safe_haven', 14.5453, 121.0521, 'SM Aura, BGC', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000090', (SELECT id FROM users LIMIT 1), 'Serendra BGC Gated Safe', 'Serendra BGC is gated community with 24/7 security. Very safe residential area.', 'safe_haven', 14.5509, 121.0489, 'Serendra, BGC', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000091', (SELECT id FROM users LIMIT 1), 'Forbes Park Highly Secure', 'Forbes Park Makati has strict security checkpoints. One of safest residential areas.', 'safe_haven', 14.5469, 121.0305, 'Forbes Park, Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000092', (SELECT id FROM users LIMIT 1), 'Dasmarinas Village Safe', 'Dasmarinas Village has roving security guards. Safe exclusive residential area.', 'safe_haven', 14.5535, 121.0278, 'Dasmarinas Village, Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000093', (SELECT id FROM users LIMIT 1), 'San Lorenzo Village Secure', 'San Lorenzo Village Makati gated with security posts. Safe neighborhood.', 'safe_haven', 14.5545, 121.0190, 'San Lorenzo Village, Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000094', (SELECT id FROM users LIMIT 1), 'Circuit Makati Safe Complex', 'Circuit Makati has dedicated security team. Safe entertainment complex.', 'safe_haven', 14.5617, 121.0337, 'Circuit Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000095', (SELECT id FROM users LIMIT 1), 'Rockwell Power Plant Lit', 'Rockwell Power Plant area excellently lit at night. Safe for evening strolls.', 'lighting', 14.5645, 121.0388, 'Rockwell Power Plant', 'evening', 'approved', NOW()),
('00000001-0000-0000-0000-000000000096', (SELECT id FROM users LIMIT 1), 'Ayala Triangle Safe Park', 'Ayala Triangle Gardens has security and CCTV. Safe for lunch breaks and exercise.', 'safe_haven', 14.5560, 121.0267, 'Ayala Triangle, Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000097', (SELECT id FROM users LIMIT 1), 'Glorietta Skybridge Safe', 'Glorietta skybridge to Landmark safe route. Air-conditioned and monitored.', 'transit', 14.5495, 121.0258, 'Glorietta Skybridge', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000098', (SELECT id FROM users LIMIT 1), 'One Ayala Safe New Mall', 'One Ayala new development has modern security systems. Very safe shopping area.', 'safe_haven', 14.5493, 121.0255, 'One Ayala, Makati', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000099', (SELECT id FROM users LIMIT 1), 'NAIA Terminal 3 Secure', 'NAIA Terminal 3 has airport security 24/7. Safe for late night/early morning flights.', 'safe_haven', 14.5108, 121.0199, 'NAIA Terminal 3, Pasay', '24/7', 'approved', NOW()),
('00000001-0000-0000-0000-000000000100', (SELECT id FROM users LIMIT 1), 'Resorts World Manila Safe', 'Resorts World Manila has casino-level security. Very safe entertainment complex.', 'safe_haven', 14.5124, 121.0172, 'Resorts World Manila', '24/7', 'approved', NOW());

-- Note: Replace (SELECT id FROM users LIMIT 1) with actual admin/seed user ID when running
-- This seed data provides realistic safety tips covering:
-- - 30 tips for Makati/BGC (business districts)
-- - 20 tips for Quezon City (residential/university areas)
-- - 15 tips for Manila City (historical/crowded areas)
-- - 15 tips for Pasig/Mandaluyong (Ortigas area)
-- - 20 tips for other Metro Manila areas
-- Categories distribution:
-- - ~35% safe_haven (secure areas)
-- - ~25% lighting (well-lit or poorly-lit areas)
-- - ~20% transit (MRT/LRT stations, bus stops)
-- - ~15% harassment (pickpocketing, catcalling warnings)
-- - ~5% construction (ongoing roadwork)
