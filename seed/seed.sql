PRAGMA foreign_keys = ON;

INSERT OR REPLACE INTO categories (id, slug, name, description, image, sort_order) VALUES
('00000000-0000-4000-8000-000000000001', 'laptops', 'Laptops', 'Portable computers for study, work and creative projects.', '/images/laptop-teal.svg', 1),
('00000000-0000-4000-8000-000000000002', 'tablets', 'Tablets', 'Versatile touch-first devices for reading, sketching and entertainment.', '/images/tablet-teal.svg', 2),
('00000000-0000-4000-8000-000000000003', 'headphones', 'Headphones', 'Comfortable personal audio for calls, commutes and focused listening.', '/images/headphones-teal.svg', 3),
('00000000-0000-4000-8000-000000000004', 'speakers', 'Speakers', 'Room-filling sound in compact, original designs.', '/images/speaker-teal.svg', 4),
('00000000-0000-4000-8000-000000000005', 'mice', 'Mice', 'Precise pointing devices for productivity, portability and play.', '/images/mouse-teal.svg', 5);

INSERT OR REPLACE INTO products
(id, category_id, slug, name, manufacturer, short_description, description, price_paise, original_price_paise, rating, review_count, stock_quantity, featured, popular, keywords, created_at, updated_at) VALUES
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','aster-novabook-14','NovaBook 14','Aster Labs','A balanced 14-inch laptop with all-day battery life.','The NovaBook 14 pairs a crisp display with quiet cooling and a comfortable keyboard, making it a dependable companion for everyday work and learning.',7499000,8299000,4.7,184,18,1,1,'portable ultrabook student office battery','2026-01-03T09:00:00Z','2026-07-14T09:00:00Z'),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','meridian-forge-16','Forge 16','Meridian Works','A high-performance 16-inch workstation for demanding projects.','Forge 16 offers sustained multicore performance, a wide colour display and generous connectivity for creators and technical professionals.',12999000,13999000,4.8,96,9,1,1,'workstation creator performance 16 inch','2026-01-10T09:00:00Z','2026-08-02T09:00:00Z'),
('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','velo-airleaf-13','Airleaf 13','Velo Computing','A remarkably light notebook built for travel.','At just over a kilogram, Airleaf 13 slips easily into a small bag while keeping a bright screen and a full day of real-world battery life.',5899000,6499000,4.5,221,26,0,1,'lightweight travel notebook thin','2026-01-17T09:00:00Z','2026-06-18T09:00:00Z'),
('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','northstar-studio-15','Studio 15','Northstar Digital','A colour-accurate laptop for visual makers.','Studio 15 combines a calibrated high-resolution panel with fast storage and dedicated graphics for photo, video and 3D workflows.',10999000,NULL,4.6,73,7,0,0,'studio display graphics editing colour','2026-02-01T09:00:00Z','2026-05-11T09:00:00Z'),
('10000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','aster-circuitbook-15','CircuitBook 15','Aster Labs','A practical full-size laptop with easy upgrades.','CircuitBook 15 includes a numeric keypad, dual storage support and accessible memory slots for a long, useful service life.',4699000,5199000,4.3,312,31,0,0,'value office upgrade numeric keypad','2026-02-12T09:00:00Z','2026-04-09T09:00:00Z'),
('10000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000001','meridian-fieldbook-14','FieldBook 14','Meridian Works','A durable laptop for busy classrooms and field work.','A reinforced shell, spill-resistant keyboard and matte display help FieldBook 14 stay productive in demanding environments.',6799000,NULL,4.4,128,14,0,0,'durable rugged matte classroom field','2026-03-05T09:00:00Z','2026-07-30T09:00:00Z'),

('10000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000002','solace-canvas-11','Canvas 11','Solace Devices','An expressive tablet with a responsive pen.','Canvas 11 makes handwritten notes and digital sketches feel immediate with low-latency input and a paper-friendly display coating.',3999000,4499000,4.7,205,22,1,1,'stylus drawing notes creative tablet','2026-01-06T09:00:00Z','2026-08-12T09:00:00Z'),
('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000002','ember-slate-10','Slate 10','Ember Mobile','A friendly everyday tablet for streaming and browsing.','Slate 10 balances stereo sound, a vivid display and straightforward controls in a slim recycled-aluminium body.',2299000,2699000,4.4,388,40,0,1,'streaming family reading slim tablet','2026-01-20T09:00:00Z','2026-07-09T09:00:00Z'),
('10000000-0000-4000-8000-000000000009','00000000-0000-4000-8000-000000000002','solace-pocketpad-8','PocketPad 8','Solace Devices','A compact reading tablet that travels anywhere.','PocketPad 8 is sized for one-handed reading and navigation, with an eye-comfort mode and expandable storage.',1699000,NULL,4.2,144,35,0,0,'compact reading ebook travel tablet','2026-02-02T09:00:00Z','2026-03-18T09:00:00Z'),
('10000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','quanta-board-pro-13','Board Pro 13','Quanta House','A large productivity tablet with a desktop mode.','Board Pro 13 brings a spacious high-refresh display, magnetic keyboard support and flexible multitasking to mobile work.',7199000,7899000,4.8,89,11,1,0,'productivity desktop keyboard large tablet','2026-02-18T09:00:00Z','2026-08-23T09:00:00Z'),
('10000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000002','ember-playtab-11','PlayTab 11','Ember Mobile','A fast entertainment tablet with immersive sound.','Four speakers, smooth graphics and a bright panel make PlayTab 11 a comfortable home for games, films and video calls.',3299000,3699000,4.5,176,19,0,1,'gaming video quad speakers entertainment','2026-03-01T09:00:00Z','2026-06-06T09:00:00Z'),
('10000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000002','quanta-junior-tab','Junior Tab','Quanta House','A robust, easy-to-manage tablet for young learners.','Junior Tab includes a protective shell, family controls and a reading-first screen profile without embedding child-specific personal data.',1899000,NULL,4.3,257,29,0,0,'learning family durable controls tablet','2026-03-14T09:00:00Z','2026-05-27T09:00:00Z'),

('10000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000003','sonora-hushwave-700','HushWave 700','Sonora Audio','Adaptive noise-cancelling headphones with spacious sound.','HushWave 700 tunes its noise control to your surroundings while plush cushions and balanced audio support long listening sessions.',2499000,2899000,4.8,461,24,1,1,'anc wireless travel over ear calls','2026-01-08T09:00:00Z','2026-08-29T09:00:00Z'),
('10000000-0000-4000-8000-000000000014','00000000-0000-4000-8000-000000000003','kinetic-loop-buds','Loop Buds','Kinetic Sound','Secure wireless earbuds for active days.','Loop Buds use soft stabilising fins, sweat resistance and clear voice microphones for workouts and daily commutes.',799000,999000,4.4,720,52,0,1,'earbuds sport sweat wireless microphone','2026-01-25T09:00:00Z','2026-07-16T09:00:00Z'),
('10000000-0000-4000-8000-000000000015','00000000-0000-4000-8000-000000000003','sonora-studio-monitor-50','Studio Monitor 50','Sonora Audio','Detailed wired headphones for recording and mixing.','A neutral tuning, replaceable cable and swivelling earcups make Studio Monitor 50 a reliable tool for home recording.',1199000,NULL,4.6,138,17,0,0,'wired studio neutral recording mixing','2026-02-04T09:00:00Z','2026-05-22T09:00:00Z'),
('10000000-0000-4000-8000-000000000016','00000000-0000-4000-8000-000000000003','kinetic-cloudlite-300','CloudLite 300','Kinetic Sound','Lightweight wireless headphones for work and study.','CloudLite 300 keeps pressure low while multipoint pairing and a flip-to-mute boom simplify calls across two devices.',549000,699000,4.2,503,44,0,0,'lightweight bluetooth multipoint headset work','2026-02-20T09:00:00Z','2026-06-28T09:00:00Z'),
('10000000-0000-4000-8000-000000000017','00000000-0000-4000-8000-000000000003','auraloom-openair','OpenAir','Auraloom','Open-ear headphones that keep surroundings audible.','OpenAir rests outside the ear canal and directs clear audio inward, useful when awareness matters during walks and commutes.',899000,1099000,4.3,269,30,0,1,'open ear awareness commute wireless','2026-03-02T09:00:00Z','2026-07-04T09:00:00Z'),
('10000000-0000-4000-8000-000000000018','00000000-0000-4000-8000-000000000003','auraloom-nightsong','NightSong','Auraloom','Soft sleep-friendly headphones in a fabric band.','Low-profile speakers sit inside a washable fabric band, with a simple timer and gentle volume limit for overnight listening.',449000,NULL,4.1,192,38,0,0,'sleep fabric band relaxation audio','2026-03-18T09:00:00Z','2026-04-21T09:00:00Z'),

('10000000-0000-4000-8000-000000000019','00000000-0000-4000-8000-000000000004','echopeak-room-one','Room One','EchoPeak','A refined compact speaker with broad room coverage.','Room One uses angled drivers and automatic room tuning to deliver consistent sound from a shelf, desk or kitchen counter.',1499000,1699000,4.7,342,20,1,1,'smart room wifi bluetooth speaker','2026-01-04T09:00:00Z','2026-08-17T09:00:00Z'),
('10000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000004','roamworks-trailbeat','TrailBeat','Roamworks','A tough portable speaker for outdoor gatherings.','TrailBeat combines water resistance, a grippy shell and a useful carrying loop with energetic sound and 18-hour playback.',699000,849000,4.6,611,43,0,1,'portable waterproof outdoor battery speaker','2026-01-16T09:00:00Z','2026-07-24T09:00:00Z'),
('10000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000004','echopeak-cinema-bar','Cinema Bar','EchoPeak','A slim soundbar that clarifies dialogue.','Cinema Bar widens television sound, offers a dedicated speech mode and connects with a single cable for uncomplicated setup.',2199000,2499000,4.5,201,12,1,0,'soundbar tv dialogue cinema hdmi','2026-02-06T09:00:00Z','2026-08-01T09:00:00Z'),
('10000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000004','roamworks-pocket-pulse','Pocket Pulse','Roamworks','A palm-sized speaker with surprising clarity.','Pocket Pulse clips onto a bag, handles splashes and pairs with a second unit for a wider stereo presentation.',299000,399000,4.2,834,60,0,1,'mini clip portable bluetooth speaker','2026-02-22T09:00:00Z','2026-06-15T09:00:00Z'),
('10000000-0000-4000-8000-000000000023','00000000-0000-4000-8000-000000000004','harmonic-grid-duo','Grid Duo','Harmonic Field','A pair of bookshelf speakers for detailed stereo listening.','Grid Duo brings careful stereo imaging and warm, controlled bass to desks and smaller rooms through versatile wired inputs.',2799000,NULL,4.8,77,8,0,0,'bookshelf stereo wired audiophile pair','2026-03-07T09:00:00Z','2026-05-03T09:00:00Z'),
('10000000-0000-4000-8000-000000000024','00000000-0000-4000-8000-000000000004','harmonic-field-clockradio','Daybreak Radio','Harmonic Field','A bedside speaker, radio and gentle alarm.','Daybreak Radio combines clear spoken audio, gradual wake lighting and tactile controls that are easy to use before sunrise.',599000,NULL,4.3,284,33,0,0,'alarm clock radio bedside speaker','2026-03-21T09:00:00Z','2026-04-29T09:00:00Z'),

('10000000-0000-4000-8000-000000000025','00000000-0000-4000-8000-000000000005','pixelgrove-precision-s','Precision S','PixelGrove','An ergonomic wireless mouse with quiet clicks.','Precision S supports three devices, smooth scrolling and a sculpted shape for comfortable everyday productivity.',349000,449000,4.6,952,70,1,1,'wireless ergonomic quiet office mouse','2026-01-02T09:00:00Z','2026-08-11T09:00:00Z'),
('10000000-0000-4000-8000-000000000026','00000000-0000-4000-8000-000000000005','vectorfox-sprint-8','Sprint 8','VectorFox','A lightweight performance mouse with eight controls.','Sprint 8 combines a low-latency sensor, flexible cable and configurable controls in a symmetrical lightweight shell.',499000,599000,4.7,687,48,1,1,'gaming lightweight sensor rgb mouse','2026-01-19T09:00:00Z','2026-07-31T09:00:00Z'),
('10000000-0000-4000-8000-000000000027','00000000-0000-4000-8000-000000000005','pixelgrove-travel-dot','Travel Dot','PixelGrove','A tiny dual-mode mouse made for small bags.','Travel Dot switches between Bluetooth and its stored USB receiver, with a silent wheel and a durable travel cover.',179000,229000,4.2,1104,90,0,1,'compact travel bluetooth portable mouse','2026-02-03T09:00:00Z','2026-06-19T09:00:00Z'),
('10000000-0000-4000-8000-000000000028','00000000-0000-4000-8000-000000000005','vectorfox-command-12','Command 12','VectorFox','A configurable mouse for shortcuts and complex workflows.','Twelve programmable thumb controls and onboard profiles help Command 12 streamline creative tools and strategy games.',699000,799000,4.5,391,25,0,0,'programmable buttons creator gaming mouse','2026-02-16T09:00:00Z','2026-08-04T09:00:00Z'),
('10000000-0000-4000-8000-000000000029','00000000-0000-4000-8000-000000000005','kinova-vertical-ease','Vertical Ease','Kinova Design','A vertical mouse designed for a relaxed grip.','Vertical Ease positions the hand at a gentle angle, with adjustable tracking and soft-touch side grips for longer desk sessions.',429000,NULL,4.4,575,39,0,1,'vertical ergonomic wrist office mouse','2026-03-03T09:00:00Z','2026-06-23T09:00:00Z'),
('10000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000005','kinova-track-orbit','Track Orbit','Kinova Design','A precise thumb trackball that stays in place.','Track Orbit saves desk space and offers accurate cursor control with a removable ball, tilt wheel and two-device switching.',549000,NULL,4.3,264,21,0,0,'trackball ergonomic compact precision mouse','2026-03-24T09:00:00Z','2026-05-26T09:00:00Z');

WITH ordered AS (SELECT id, category_id, stock_quantity, ROW_NUMBER() OVER (ORDER BY slug) AS n FROM products)
INSERT OR REPLACE INTO product_variants (id, product_id, colour, colour_hex, stock_quantity)
SELECT printf('20000000-0000-4000-8000-%012d', n), id,
  CASE category_id
    WHEN '00000000-0000-4000-8000-000000000001' THEN 'Deep Navy'
    WHEN '00000000-0000-4000-8000-000000000002' THEN 'Lagoon Teal'
    WHEN '00000000-0000-4000-8000-000000000003' THEN 'Night Navy'
    WHEN '00000000-0000-4000-8000-000000000004' THEN 'Harbour Blue'
    ELSE 'Graphite'
  END,
  CASE category_id
    WHEN '00000000-0000-4000-8000-000000000002' THEN '#1f9e9a'
    WHEN '00000000-0000-4000-8000-000000000005' THEN '#3d4248'
    ELSE '#173f5f'
  END,
  (stock_quantity + 1) / 2 FROM ordered;

WITH ordered AS (SELECT id, category_id, stock_quantity, ROW_NUMBER() OVER (ORDER BY slug) AS n FROM products)
INSERT OR REPLACE INTO product_variants (id, product_id, colour, colour_hex, stock_quantity)
SELECT printf('20000000-0000-4000-8000-%012d', n + 100), id,
  CASE category_id
    WHEN '00000000-0000-4000-8000-000000000001' THEN 'Warm Silver'
    WHEN '00000000-0000-4000-8000-000000000002' THEN 'Sunset Coral'
    WHEN '00000000-0000-4000-8000-000000000003' THEN 'Sunset Coral'
    WHEN '00000000-0000-4000-8000-000000000004' THEN 'Terracotta'
    ELSE 'Mist Silver'
  END,
  CASE category_id WHEN '00000000-0000-4000-8000-000000000001' THEN '#c2ccd3' WHEN '00000000-0000-4000-8000-000000000005' THEN '#b9c5cb' ELSE '#ed7966' END,
  stock_quantity / 2 FROM ordered;

WITH ordered AS (
  SELECT v.id AS variant_id, p.slug, p.name, v.colour,
    ROW_NUMBER() OVER (ORDER BY p.slug, v.colour) AS n
  FROM product_variants v JOIN products p ON p.id = v.product_id
)
INSERT OR REPLACE INTO variant_images (id, variant_id, url, alt, sort_order)
SELECT printf('31000000-0000-4000-8000-%012d', n), variant_id,
  '/images/products/' || slug || '-' || lower(replace(colour, ' ', '-')) || '-01.jpg',
  name || ' in ' || colour || ', front product view', 0 FROM ordered;

WITH ordered AS (
  SELECT v.id AS variant_id, p.slug, p.name, v.colour,
    ROW_NUMBER() OVER (ORDER BY p.slug, v.colour) AS n
  FROM product_variants v JOIN products p ON p.id = v.product_id
)
INSERT OR REPLACE INTO variant_images (id, variant_id, url, alt, sort_order)
SELECT printf('31000000-0000-4000-8000-%012d', n + 100), variant_id,
  '/images/products/' || slug || '-' || lower(replace(colour, ' ', '-')) || '-02.jpg',
  name || ' in ' || colour || ', alternate product view', 1 FROM ordered;

WITH ordered AS (SELECT p.id, p.slug, p.name, p.category_id, ROW_NUMBER() OVER (ORDER BY p.slug) AS n FROM products p)
INSERT OR REPLACE INTO product_images (id, product_id, url, alt, sort_order)
SELECT printf('30000000-0000-4000-8000-%012d', n), id,
  '/images/products/' || slug || '-' || CASE category_id
    WHEN '00000000-0000-4000-8000-000000000001' THEN 'deep-navy'
    WHEN '00000000-0000-4000-8000-000000000002' THEN 'lagoon-teal'
    WHEN '00000000-0000-4000-8000-000000000003' THEN 'night-navy'
    WHEN '00000000-0000-4000-8000-000000000004' THEN 'harbour-blue'
    ELSE 'graphite'
  END || '-01.jpg',
  name || ' front product view', 0 FROM ordered;

WITH ordered AS (SELECT p.id, p.slug, p.name, p.category_id, ROW_NUMBER() OVER (ORDER BY p.slug) AS n FROM products p)
INSERT OR REPLACE INTO product_images (id, product_id, url, alt, sort_order)
SELECT printf('30000000-0000-4000-8000-%012d', n + 100), id,
  '/images/products/' || slug || '-' || CASE category_id
    WHEN '00000000-0000-4000-8000-000000000001' THEN 'deep-navy'
    WHEN '00000000-0000-4000-8000-000000000002' THEN 'lagoon-teal'
    WHEN '00000000-0000-4000-8000-000000000003' THEN 'night-navy'
    WHEN '00000000-0000-4000-8000-000000000004' THEN 'harbour-blue'
    ELSE 'graphite'
  END || '-02.jpg',
  name || ' alternate product view', 1 FROM ordered;

WITH ordered AS (SELECT p.id, c.slug AS category, ROW_NUMBER() OVER (ORDER BY p.slug) AS n FROM products p JOIN categories c ON c.id = p.category_id)
INSERT OR REPLACE INTO product_specifications (id, product_id, name, value, sort_order)
SELECT printf('40000000-0000-4000-8000-%012d', n), id,
  CASE category WHEN 'laptops' THEN 'Memory' WHEN 'tablets' THEN 'Display' WHEN 'headphones' THEN 'Battery life' WHEN 'speakers' THEN 'Connectivity' ELSE 'Tracking' END,
  CASE category WHEN 'laptops' THEN '16 GB' WHEN 'tablets' THEN 'High-resolution touch display' WHEN 'headphones' THEN 'Up to 32 hours' WHEN 'speakers' THEN 'Bluetooth 5.3' ELSE 'Adjustable precision sensor' END, 0 FROM ordered;

WITH ordered AS (SELECT p.id, c.slug AS category, ROW_NUMBER() OVER (ORDER BY p.slug) AS n FROM products p JOIN categories c ON c.id = p.category_id)
INSERT OR REPLACE INTO product_specifications (id, product_id, name, value, sort_order)
SELECT printf('40000000-0000-4000-8000-%012d', n + 100), id,
  CASE category WHEN 'laptops' THEN 'Storage' WHEN 'tablets' THEN 'Storage' WHEN 'headphones' THEN 'Connection' WHEN 'speakers' THEN 'Warranty' ELSE 'Connection' END,
  CASE category WHEN 'laptops' THEN '512 GB solid-state drive' WHEN 'tablets' THEN '128 GB, expandable' WHEN 'headphones' THEN 'Bluetooth 5.3 and cable' WHEN 'speakers' THEN 'Two-year limited demo warranty' ELSE 'Bluetooth and USB receiver' END, 1 FROM ordered;

INSERT OR REPLACE INTO users
(id, username, email, password_hash, password_salt, first_name, last_name, phone, marketing_opt_in, created_at, updated_at) VALUES
('50000000-0000-4000-8000-000000000001', 'testmart_tester', 'tester@testmart.demo', 'BaBxTbqsCHALgCJMRjS94VYvca9aEDMTSC+fxwGKgv4=', 'dGVzdG1hcnQtZGVtby1zYWx0LTE=', 'Demo', 'Tester', '+91 90000 00000', 0, '2026-01-01T09:00:00Z', '2026-01-01T09:00:00Z');

INSERT OR REPLACE INTO addresses
(id, user_id, label, first_name, last_name, phone, street, city, state, postal_code, country, is_default) VALUES
('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'Demo address', 'Demo', 'Tester', '+91 90000 00000', '101 Learning Lane', 'Pune', 'Maharashtra', '411001', 'India', 1);
