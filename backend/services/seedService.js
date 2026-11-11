'use strict';

const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const env = require('../config/env');
const { totalsFor, STATUS_LABELS } = require('../config/constants');
const { generateOrderNumber } = require('../utils/helpers');

const photo = (id, width = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=82`;

const categories = [
  {
    name: 'Phones',
    slug: 'phones',
    description: 'Titanium-built smartphones with computational imaging and all-day power.',
    image: photo('1695048133142-1a20484d2569', 900),
    featured: true,
    sortOrder: 1,
  },
  {
    name: 'Audio',
    slug: 'audio',
    description: 'Immersive sound engineered for stillness, depth and detail.',
    image: photo('1505740420928-5e560c06d30e', 900),
    featured: true,
    sortOrder: 2,
  },
  {
    name: 'Wearables',
    slug: 'wearables',
    description: 'Quiet companions for health, movement and everyday precision.',
    image: photo('1523275335684-37898b6baf30', 900),
    featured: true,
    sortOrder: 3,
  },
  {
    name: 'Computing',
    slug: 'computing',
    description: 'Desktop-class performance in objects you can carry.',
    image: photo('1517336714731-489689fd1ca8', 900),
    featured: true,
    sortOrder: 4,
  },
  {
    name: 'Imaging',
    slug: 'imaging',
    description: 'Full-frame capture and reference displays for visual storytellers.',
    image: photo('1516035069371-29a1b244cc32', 900),
    featured: false,
    sortOrder: 5,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'The considered details that complete your setup.',
    image: photo('1587829741301-dc798b83add3', 900),
    featured: false,
    sortOrder: 6,
  },
];

const products = [
  {
    slug: 'titan-x-pro',
    name: 'Titan X Pro',
    sku: 'AUR-TXP-001',
    shortDescription: 'Forged titanium. A19 Pro performance. The most capable Titan ever.',
    description:
      'Titan X Pro is machined from grade 5 titanium and finished by hand. A 6.9-inch LTPO display reaches 120Hz and 2,500 nits, while the A1 Pro chip brings console-class performance to a device that fits in your palm. The 48MP triple camera captures colour the way your eye remembers it.',
    price: 1299,
    originalPrice: 1399,
    category: 'phones',
    images: ['1695048133142-1a20484d2569', '1616348436168-de43ad0db179', '1592750475338-74b7b21085ab'].map((id) => photo(id)),
    stock: 26,
    featured: true,
    colors: [
      { name: 'Desert Titanium', hex: '#C2A182' },
      { name: 'Black Titanium', hex: '#3A3A3C' },
      { name: 'Natural Titanium', hex: '#B8B3AB' },
    ],
    sizes: ['256GB', '512GB', '1TB'],
    specifications: [
      { label: 'Display', value: '6.9" LTPO OLED · 120Hz · 2,500 nits' },
      { label: 'Chip', value: 'AURELIS A1 Pro · 6-core GPU' },
      { label: 'Camera', value: '48MP main · 48MP ultra-wide · 12MP 5× tele' },
      { label: 'Battery', value: 'Up to 33 hours video playback' },
      { label: 'Frame', value: 'Grade 5 titanium · Ceramic Shield' },
    ],
    tags: ['flagship', 'titanium', 'smartphone'],
    sold: 420,
  },
  {
    slug: 'titan-x',
    name: 'Titan X',
    sku: 'AUR-TX-002',
    shortDescription: 'A lighter titanium frame with the A1 chip and 48MP dual camera.',
    description:
      'Titan X brings the essential Titan experience into a 6.3-inch form. Aerospace-grade aluminium and a matte glass back keep it light, while the A1 chip and 48MP camera system deliver flagship speed and clarity every day.',
    price: 999,
    originalPrice: 1099,
    category: 'phones',
    images: ['1511707171634-5f897ff02aa9', '1592750475338-74b7b21085ab', '1580910051074-3eb694886505'].map((id) => photo(id)),
    stock: 38,
    featured: false,
    colors: [
      { name: 'Midnight', hex: '#1C1C1E' },
      { name: 'Titanium', hex: '#A8A7A2' },
      { name: 'Ocean', hex: '#3F5C6B' },
    ],
    sizes: ['128GB', '256GB', '512GB'],
    specifications: [
      { label: 'Display', value: '6.3" OLED · 120Hz · 2,000 nits' },
      { label: 'Chip', value: 'AURELIS A1 · 5-core GPU' },
      { label: 'Camera', value: '48MP main · 12MP ultra-wide' },
      { label: 'Battery', value: 'Up to 28 hours video playback' },
      { label: 'Water resistance', value: 'IP68 · 6 metres for 30 minutes' },
    ],
    tags: ['smartphone', 'titanium'],
    sold: 305,
  },
  {
    slug: 'auralis-pro',
    name: 'Auralis Pro',
    shortDescription: 'Adaptive noise cancelling headphones with studio-grade drivers.',
    description:
      'Auralis Pro surrounds you with a precisely tuned 40mm driver and adaptive noise cancellation that reads the room 48,000 times a second. Memory-foam cushions and a titanium headband distribute weight evenly, so the music disappears into a 40-hour listening session.',
    price: 549,
    originalPrice: 599,
    category: 'audio',
    images: ['1505740420928-5e560c06d30e', '1583394838336-acd977736f90', '1546435770-a3e426bf472b'].map((id) => photo(id)),
    stock: 54,
    featured: true,
    colors: [
      { name: 'Midnight', hex: '#1F2022' },
      { name: 'Titanium', hex: '#B4B0A8' },
      { name: 'Sand', hex: '#CBB89D' },
    ],
    sizes: [],
    specifications: [
      { label: 'Drivers', value: '40mm beryllium-coated dynamic' },
      { label: 'Noise cancelling', value: 'Adaptive ANC · Transparency Pro' },
      { label: 'Battery', value: '40 hours playback · 3 hours from 10 min' },
      { label: 'Connectivity', value: 'Bluetooth 5.4 · USB-C lossless' },
      { label: 'Weight', value: '271g' },
    ],
    tags: ['headphones', 'audio', 'noise cancelling'],
    sold: 612,
  },
  {
    slug: 'auralis-buds',
    name: 'Auralis Buds',
    shortDescription: 'Spatial earbuds with adaptive ANC and a pocketable titanium case.',
    description:
      'Auralis Buds deliver a wide, dimensional soundstage from an 11mm driver. Adaptive transparency, head-tracked spatial audio and a compact titanium case make them the pair you forget you are wearing — until you take them out.',
    price: 199,
    originalPrice: 229,
    category: 'audio',
    images: ['1545127398-14699f92334b', '1484704849700-f032a568e944', '1583394838336-acd977736f90'].map((id) => photo(id)),
    stock: 87,
    featured: false,
    colors: [
      { name: 'Cloud', hex: '#EDEBE7' },
      { name: 'Graphite', hex: '#3B3B3D' },
    ],
    sizes: [],
    specifications: [
      { label: 'Drivers', value: '11mm dynamic · custom amplifier' },
      { label: 'Battery', value: '8 hours · 32 hours with case' },
      { label: 'Audio', value: 'Spatial Audio with head tracking' },
      { label: 'Durability', value: 'IPX4 sweat and water resistant' },
      { label: 'Case', value: 'Titanium-finish wireless charging case' },
    ],
    tags: ['earbuds', 'audio'],
    sold: 880,
  },
  {
    slug: 'sonar-one',
    name: 'Sonar One',
    shortDescription: 'Room-filling spatial audio in a single sculpted aluminium column.',
    description:
      'Sonar One fills a room from a single column, calibrating itself to the walls around it. Seven amplifiers and a high-excursion woofer create deep, articulate bass without the bulk. Anodised aluminium and a woven acoustic shell make it an object worth leaving on display.',
    price: 299,
    category: 'audio',
    images: ['1608043152269-423dbba4e7e1', '1589003077984-894e133dabab', '1545454675-3531b543be5d'].map((id) => photo(id)),
    stock: 31,
    featured: false,
    colors: [
      { name: 'Space Grey', hex: '#5D5D60' },
      { name: 'Chalk', hex: '#E2DFD9' },
    ],
    sizes: [],
    specifications: [
      { label: 'Output', value: '100W peak · 7 amplifier channels' },
      { label: 'Audio', value: '360° spatial audio · room calibration' },
      { label: 'Connectivity', value: 'Wi-Fi 6 · AirPlay · Bluetooth 5.3' },
      { label: 'Material', value: 'Anodised aluminium · acoustic weave' },
      { label: 'Dimensions', value: '168 × 168 × 268mm' },
    ],
    tags: ['speaker', 'audio', 'home'],
    sold: 198,
  },
  {
    slug: 'chrono-s',
    name: 'Chrono S',
    shortDescription: 'A titanium smartwatch with ECG, dual-band GPS and a 72-hour battery.',
    description:
      'Chrono S is a precision instrument for the wrist. A 46mm brushed titanium case frames an always-on LTPO display that dims to a whisper. Advanced sensors track ECG, blood oxygen and sleep stages, while dual-band GPS keeps every route exact.',
    price: 399,
    originalPrice: 449,
    category: 'wearables',
    images: ['1523275335684-37898b6baf30', '1546868871-7041f2a55e12', '1524805444758-089113d48a6d'].map((id) => photo(id)),
    stock: 43,
    featured: true,
    colors: [
      { name: 'Titanium', hex: '#A9A6A0' },
      { name: 'Slate', hex: '#4C4E52' },
      { name: 'Sand', hex: '#C9B395' },
    ],
    sizes: ['41mm', '46mm'],
    specifications: [
      { label: 'Case', value: '46mm brushed titanium' },
      { label: 'Display', value: 'Always-on LTPO AMOLED · 2,000 nits' },
      { label: 'Sensors', value: 'ECG · SpO₂ · skin temperature · depth' },
      { label: 'Battery', value: 'Up to 72 hours · 18 min fast charge' },
      { label: 'Water resistance', value: '10 ATM · EN13319 dive rated' },
    ],
    tags: ['watch', 'wearable', 'health'],
    sold: 514,
  },
  {
    slug: 'orbit-band',
    name: 'Orbit Band',
    shortDescription: 'A featherweight health band with a two-week battery.',
    description:
      'Orbit Band tracks the things that matter without asking for attention. A featherweight aluminium body, 120 workout modes and a two-week battery make it the simplest way to understand your day. The 1.5-inch AMOLED display stays legible in direct sun.',
    price: 149,
    category: 'wearables',
    images: ['1546868871-7041f2a55e12', '1524805444758-089113d48a6d', '1523275335684-37898b6baf30'].map((id) => photo(id)),
    stock: 96,
    featured: false,
    colors: [
      { name: 'Graphite', hex: '#2C2C2E' },
      { name: 'Silver', hex: '#C7C6C2' },
      { name: 'Clay', hex: '#B98470' },
    ],
    sizes: ['Small', 'Medium', 'Large'],
    specifications: [
      { label: 'Display', value: '1.5" AMOLED · 1,000 nits' },
      { label: 'Battery', value: 'Up to 14 days' },
      { label: 'Tracking', value: '120 workout modes · sleep · stress' },
      { label: 'Durability', value: '5 ATM · aluminium frame' },
      { label: 'Weight', value: '23g' },
    ],
    tags: ['fitness', 'wearable'],
    sold: 733,
  },
  {
    slug: 'lumen-book-pro-14',
    name: 'Lumen Book Pro 14',
    shortDescription: 'A 14-inch pro notebook with a 12-core chip and 21-hour battery.',
    description:
      'Lumen Book Pro is built for work that refuses to compromise. The 12-core L2 Pro chip, 32GB of unified memory and a 14.2-inch Liquid Retina XDR display make light work of colour grading, code and complex models. It stays silent under load and runs for 21 hours.',
    price: 1999,
    originalPrice: 2199,
    category: 'computing',
    images: ['1517336714731-489689fd1ca8', '1496181133206-80ce9b88a853', '1611186871348-b1ce696e52c9'].map((id) => photo(id)),
    stock: 17,
    featured: true,
    colors: [
      { name: 'Space Black', hex: '#2B2B2D' },
      { name: 'Silver', hex: '#D7D6D2' },
    ],
    sizes: ['512GB', '1TB', '2TB'],
    specifications: [
      { label: 'Chip', value: 'AURELIS L2 Pro · 12-core CPU · 18-core GPU' },
      { label: 'Memory', value: '32GB unified memory' },
      { label: 'Display', value: '14.2" Liquid Retina XDR · 120Hz · 1,600 nits' },
      { label: 'Battery', value: 'Up to 21 hours' },
      { label: 'Ports', value: '3× Thunderbolt 5 · HDMI · SDXC · MagCharge' },
    ],
    tags: ['laptop', 'pro', 'computing'],
    sold: 164,
  },
  {
    slug: 'lumen-book-air-13',
    name: 'Lumen Book Air 13',
    shortDescription: '1.24kg of fanless performance with an 18-hour battery.',
    description:
      'Lumen Book Air is the everyday notebook refined to its essentials. At 1.24kg and 11.3mm thin, it disappears into a bag and opens to a bright 13.6-inch display. The fanless L2 chip handles a full workday in absolute silence.',
    price: 1299,
    category: 'computing',
    images: ['1496181133206-80ce9b88a853', '1611186871348-b1ce696e52c9', '1517336714731-489689fd1ca8'].map((id) => photo(id)),
    stock: 29,
    featured: false,
    colors: [
      { name: 'Midnight', hex: '#2F3133' },
      { name: 'Starlight', hex: '#E4DFD5' },
      { name: 'Silver', hex: '#D2D2CE' },
    ],
    sizes: ['256GB', '512GB', '1TB'],
    specifications: [
      { label: 'Chip', value: 'AURELIS L2 · 8-core CPU · 10-core GPU' },
      { label: 'Memory', value: '16GB unified memory' },
      { label: 'Display', value: '13.6" Liquid Retina · 500 nits' },
      { label: 'Battery', value: 'Up to 18 hours' },
      { label: 'Weight', value: '1.24kg · 11.3mm thin' },
    ],
    tags: ['laptop', 'ultrabook'],
    sold: 389,
  },
  {
    slug: 'vision-pad-11',
    name: 'Vision Pad 11',
    shortDescription: 'An 11-inch OLED canvas for ideas, films and everything between.',
    description:
      'Vision Pad is a sheet of light you can hold. The 11-inch OLED display covers the full P3 gamut at 120Hz, while the A1 chip makes drawing, editing and multitasking feel immediate. Add the Slate Keyboard and it becomes a studio that fits under your arm.',
    price: 799,
    category: 'computing',
    images: ['1544244015-0df4b3ffc6b0', '1561154464-82e9adf32764', '1496181133206-80ce9b88a853'].map((id) => photo(id)),
    stock: 44,
    featured: false,
    colors: [
      { name: 'Graphite', hex: '#47484B' },
      { name: 'Silver', hex: '#DAD9D5' },
    ],
    sizes: ['128GB', '256GB', '512GB'],
    specifications: [
      { label: 'Display', value: '11" Ultra Retina OLED · 120Hz' },
      { label: 'Chip', value: 'AURELIS A1' },
      { label: 'Battery', value: 'Up to 12 hours' },
      { label: 'Pencil', value: 'Slate Pencil 2 · magnetic charging' },
      { label: 'Weight', value: '446g' },
    ],
    tags: ['tablet', 'creative'],
    sold: 256,
  },
  {
    slug: 'halo-display-27',
    name: 'Halo Display 27',
    shortDescription: 'A 5K reference display with 120Hz ProMotion and studio speakers.',
    description:
      'Halo Display is a window with no visible edges. The 27-inch 5K panel delivers reference colour and 1,600 nits of peak brightness, with six studio speakers and a three-microphone array built in. One Thunderbolt cable carries video, data and 140W of power.',
    price: 1199,
    category: 'computing',
    images: ['1527443224154-c4a3942d3acf', '1585792180666-f7347c490ee2', '1496181133206-80ce9b88a853'].map((id) => photo(id)),
    stock: 12,
    featured: false,
    colors: [{ name: 'Silver', hex: '#D4D3CF' }],
    sizes: [],
    specifications: [
      { label: 'Panel', value: '27" 5K · 120Hz · 1,600 nits peak' },
      { label: 'Colour', value: 'P3 · 10-bit · factory calibrated' },
      { label: 'Audio', value: '6-speaker system · spatial audio' },
      { label: 'Camera', value: '12MP Centre Stage · 3-mic array' },
      { label: 'Connectivity', value: 'Thunderbolt 5 · 140W charging' },
    ],
    tags: ['display', 'monitor', 'pro'],
    sold: 92,
  },
  {
    slug: 'optic-m1',
    name: 'Optic M1',
    shortDescription: 'A 61MP full-frame mirrorless camera with 8K cinema.',
    description:
      'Optic M1 is a tool for deliberate image makers. Its 61MP full-frame sensor resolves texture and light with startling clarity, while 8K video, 5-axis stabilisation and a magnesium weather-sealed body make it ready for the field as much as the studio.',
    price: 1899,
    originalPrice: 1999,
    category: 'imaging',
    images: ['1516035069371-29a1b244cc32', '1502920917128-1aa500764cbd', '1519183071298-a2962feb14f4'].map((id) => photo(id)),
    stock: 9,
    featured: true,
    colors: [{ name: 'Graphite', hex: '#333437' }],
    sizes: [],
    specifications: [
      { label: 'Sensor', value: '61MP full-frame back-illuminated CMOS' },
      { label: 'Video', value: '8K 30p · 4K 120p · 10-bit 4:2:2' },
      { label: 'Stabilisation', value: '5-axis IBIS · 8 stops' },
      { label: 'Autofocus', value: '759-point phase detect · subject AI' },
      { label: 'Body', value: 'Magnesium alloy · weather sealed' },
    ],
    tags: ['camera', 'photography', 'pro'],
    sold: 76,
  },
  {
    slug: 'slate-keyboard',
    name: 'Slate Keyboard',
    shortDescription: 'A low-profile mechanical keyboard milled from a single aluminium block.',
    description:
      'Slate is a keyboard that rewards the fingertips. A single block of aluminium anchors low-profile mechanical switches tuned for a crisp, quiet keystroke. Backlighting responds as your hands approach, and three-device connectivity moves between screens without ceremony.',
    price: 179,
    category: 'accessories',
    images: ['1587829741301-dc798b83add3', '1618384887929-16ec33fab9ef'].map((id) => photo(id)),
    stock: 65,
    featured: false,
    colors: [
      { name: 'Slate', hex: '#43464A' },
      { name: 'Silver', hex: '#CFCEC9' },
    ],
    sizes: ['US', 'UK', 'DE'],
    specifications: [
      { label: 'Switches', value: 'Low-profile mechanical · 1.5mm travel' },
      { label: 'Body', value: 'CNC-milled aluminium · 18mm profile' },
      { label: 'Battery', value: 'Up to 6 months · USB-C' },
      { label: 'Connectivity', value: 'Bluetooth 5.2 · 3 devices · wired' },
      { label: 'Weight', value: '780g' },
    ],
    tags: ['keyboard', 'desk'],
    sold: 341,
  },
  {
    slug: 'glide-mouse',
    name: 'Glide Mouse',
    shortDescription: 'A 26K DPI wireless mouse with a titanium scroll wheel.',
    description:
      'Glide is shaped for long sessions and precise movement. A 26,000 DPI sensor tracks flawlessly on glass, while the titanium scroll wheel and 70-hour battery remove every small friction from your desk.',
    price: 99,
    category: 'accessories',
    images: ['1527864550417-7fd91fc51a46', '1615663245857-ac93bb7c39e7'].map((id) => photo(id)),
    stock: 82,
    featured: false,
    colors: [
      { name: 'Graphite', hex: '#414347' },
      { name: 'Cloud', hex: '#E7E5E0' },
    ],
    sizes: [],
    specifications: [
      { label: 'Sensor', value: '26,000 DPI · 650 IPS tracking' },
      { label: 'Battery', value: 'Up to 70 hours' },
      { label: 'Scroll', value: 'Machined titanium wheel · haptic' },
      { label: 'Connection', value: '2.4GHz · Bluetooth · USB-C' },
      { label: 'Weight', value: '90g' },
    ],
    tags: ['mouse', 'desk'],
    sold: 407,
  },
  {
    slug: 'flux-charge-3-in-1',
    name: 'Flux Charge 3-in-1',
    shortDescription: 'A travel charger for phone, watch and buds in machined aluminium.',
    description:
      'Flux replaces three chargers with one folded slab of aluminium. Fifteen watts of magnetic charging for your phone, a fast-charge dock for Chrono and a wireless pad for Auralis Buds. It folds flat, weighs 190 grams and disappears into a bag.',
    price: 129,
    category: 'accessories',
    images: ['1583863788434-e58a36330cf0', '1616348436168-de43ad0db179', '1592750475338-74b7b21085ab'].map((id) => photo(id)),
    stock: 3,
    featured: false,
    colors: [{ name: 'Titanium', hex: '#A7A39B' }],
    sizes: [],
    specifications: [
      { label: 'Power', value: '15W magnetic · 5W watch · 5W buds' },
      { label: 'Material', value: 'CNC aluminium · vegan leather base' },
      { label: 'Travel', value: 'Folds to 108 × 76 × 22mm' },
      { label: 'Included', value: '45W USB-C adapter · 1.5m cable' },
      { label: 'Weight', value: '190g' },
    ],
    tags: ['charger', 'travel', 'accessory'],
    sold: 289,
  },
  {
    slug: 'aero-drone-x',
    name: 'Aero Drone X',
    shortDescription: 'A folding 8K aerial camera with 46 minutes of flight time.',
    description:
      'Aero Drone X folds to the size of a water bottle and unfolds into a stabilised 8K camera. Omnidirectional obstacle sensing, 15km transmission and 46 minutes of flight turn a difficult shot into a quiet, controlled exercise.',
    price: 999,
    category: 'imaging',
    images: [photo('1473968512647-3e447244af8f')],
    stock: 0,
    featured: false,
    colors: [{ name: 'Graphite', hex: '#3A3C3F' }],
    sizes: [],
    specifications: [
      { label: 'Camera', value: '8K 30p · 4K 120p · 1-inch sensor' },
      { label: 'Flight', value: '46 minutes · 15km transmission' },
      { label: 'Sensing', value: 'Omnidirectional obstacle avoidance' },
      { label: 'Folded', value: '182 × 96 × 76mm · 720g' },
      { label: 'Storage', value: '128GB internal · 8K 10-bit LOG' },
    ],
    tags: ['drone', 'aerial', 'camera'],
    sold: 58,
  },
];

const reviewers = [
  { name: 'Ava Chen', email: 'ava@aurelis.com' },
  { name: 'Noah Williams', email: 'noah@aurelis.com' },
  { name: 'Elena Rossi', email: 'elena@aurelis.com' },
];

const reviewTitles = [
  'Engineering you can feel',
  'Quietly exceptional',
  'Worth every dollar',
  'The details are the product',
  'Beautiful, with one caveat',
  'A genuine upgrade',
];

const reviewComments = [
  'The finish is flawless and the weight is perfectly judged. It feels like an object designed to be kept, not replaced next year.',
  'I have used it daily for three weeks. Battery life is honest, the interface stays out of the way, and the craftsmanship is obvious in person.',
  'Unboxing felt like a small event. Performance is excellent and the accessories are genuinely useful rather than filler.',
  'There is a learning curve, but once it clicks the experience is remarkably calm and refined. Support was also quick to help.',
  'Beautiful design and superb materials. I would like a slightly longer cable in the box, but that is a small complaint.',
  'This replaced two older devices for me. It is faster, quieter and simply nicer to use every single day.',
];

const buildTracking = (status, startDate) => {
  const order = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
  // Seeded history must never contain future timestamps (an order seeded early in
  // the month can be newer than its normal tracking offsets).
  const eventAt = (offsetMs) => new Date(Math.min(startDate.getTime() + offsetMs, Date.now() - 60 * 1000));
  if (status === 'cancelled') {
    return [
      {
        status: 'placed',
        label: 'Order Placed',
        note: 'Payment verified successfully.',
        at: eventAt(60 * 60 * 1000),
      },
      {
        status: 'confirmed',
        label: 'Confirmed',
        note: 'Your order was confirmed by our studio.',
        at: eventAt(5 * 60 * 60 * 1000),
      },
      {
        status: 'cancelled',
        label: 'Cancelled',
        note: 'Order cancelled and payment refunded.',
        at: eventAt(26 * 60 * 60 * 1000),
      },
    ];
  }
  const index = order.indexOf(status);
  const active = index === -1 ? 0 : index;
  return order.slice(0, active + 1).map((entry, position) => ({
    status: entry,
    label: STATUS_LABELS[entry],
    note:
      entry === 'placed'
        ? 'Payment verified successfully.'
        : entry === 'delivered'
        ? 'Delivered to the shipping address.'
        : 'Status updated by AURELIS fulfilment.',
    at: eventAt((position + 1) * 22 * 60 * 60 * 1000),
  }));
};

const buildItems = (productDocs, quantities = []) =>
  productDocs.map((product, index) => ({
    product: product._id,
    name: product.name,
    slug: product.slug,
    image: product.images[0],
    price: product.price,
    quantity: quantities[index] || 1,
    color: product.colors[0]?.name || '',
    size: product.sizes[0] || '',
  }));

const createSeedOrder = async ({ user, productDocs, createdAt, status, paymentMethod = 'card', quantities }) => {
  const items = buildItems(productDocs, quantities);
  const totals = totalsFor(items);
  const paymentStatus = status === 'cancelled' ? 'refunded' : 'paid';
  const trackingHistory = buildTracking(status, createdAt);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: user._id,
    items,
    shippingAddress: {
      fullName: user.name,
      phone: '+1 415 555 0134',
      line1: '88 Montgomery Street',
      line2: 'Penthouse 12',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94104',
      country: 'United States',
    },
    paymentMethod,
    paymentProvider: paymentMethod === 'card' ? 'sandbox' : 'none',
    paymentStatus,
    orderStatus: status,
    ...totals,
    trackingHistory,
    paidAt: paymentStatus === 'paid' ? createdAt : undefined,
    deliveredAt: status === 'delivered' ? trackingHistory[trackingHistory.length - 1].at : undefined,
    cancelledAt: status === 'cancelled' ? trackingHistory[trackingHistory.length - 1].at : undefined,
    cancelReason: status === 'cancelled' ? 'Customer changed their mind.' : '',
    stockRestored: true,
    salesCounted: false,
  });

  await Order.collection.updateOne(
    { _id: order._id },
    { $set: { createdAt, updatedAt: createdAt } }
  );

  return order;
};

const seedDatabase = async ({ onlyIfEmpty = false } = {}) => {
  const existingProducts = await Product.countDocuments();
  if (onlyIfEmpty && existingProducts > 0) {
    console.log('[seed] Catalog already present — skipping seed.');
    return { skipped: true };
  }

  console.log('[seed] Preparing AURELIS demo data...');

  const categoryDocs = {};
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    categoryDocs[category.slug] = doc;
  }

  const findOrCreateUser = async ({ name, email, role = 'user', password = env.DEMO_PASSWORD }) => {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, password, role, addresses: [] });
    }
    return user;
  };

  const admin = await findOrCreateUser({
    name: 'AURELIS Admin',
    email: env.ADMIN_EMAIL,
    role: 'admin',
    password: env.ADMIN_PASSWORD,
  });
  const demo = await findOrCreateUser({ name: 'Deepa Sharma', email: env.DEMO_EMAIL });
  const reviewerDocs = [];
  for (const reviewer of reviewers) {
    reviewerDocs.push(await findOrCreateUser(reviewer));
  }
  if (env.isProduction && env.ADMIN_PASSWORD === 'Admin@12345') {
    console.warn('[seed] WARNING: change ADMIN_PASSWORD before running in production.');
  }

  const productDocs = [];
  for (const entry of products) {
    const category = categoryDocs[entry.category];
    const doc = await Product.findOneAndUpdate(
      { slug: entry.slug },
      {
        $set: { ...entry, category: category._id, brand: 'AURELIS', isActive: true },
        $setOnInsert: { rating: 0, numReviews: 0 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    productDocs.push(doc);
  }

  const existingOrders = await Order.countDocuments();
  if (existingOrders === 0) {
    // Review-eligible purchases: roughly eight products per reviewer per order.
    for (let r = 0; r < reviewerDocs.length; r += 1) {
      const reviewer = reviewerDocs[r];
      const firstHalf = productDocs.slice(0, 8);
      const secondHalf = productDocs.slice(8);
      await createSeedOrder({
        user: reviewer,
        productDocs: firstHalf,
        createdAt: new Date(Date.now() - (70 + r * 9) * 24 * 60 * 60 * 1000),
        status: 'delivered',
      });
      await createSeedOrder({
        user: reviewer,
        productDocs: secondHalf,
        createdAt: new Date(Date.now() - (45 + r * 11) * 24 * 60 * 60 * 1000),
        status: 'delivered',
      });
    }

    // Twelve months of paid orders for the revenue chart.
    const now = new Date();
    for (let month = 11; month >= 0; month -= 1) {
      const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - month, 6 + (month % 8), 12, 0, 0));
      // Never seed revenue in the future: early in a month the current bucket falls ahead of today.
      const created = new Date(Math.min(anchor.getTime(), now.getTime() - 2 * 24 * 60 * 60 * 1000));
      const picks = [productDocs[month % productDocs.length], productDocs[(month + 5) % productDocs.length]];
      await createSeedOrder({
        user: reviewerDocs[month % reviewerDocs.length],
        productDocs: picks,
        createdAt: created,
        status: 'delivered',
      });
    }

    // Customer order history showcasing the full tracking timeline.
    await createSeedOrder({
      user: demo,
      productDocs: [productDocs[0], productDocs[2]],
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      status: 'delivered',
      quantities: [1, 1],
    });
    await createSeedOrder({
      user: demo,
      productDocs: [productDocs[7]],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'shipped',
    });
    await createSeedOrder({
      user: demo,
      productDocs: [productDocs[5]],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'processing',
    });
    await createSeedOrder({
      user: demo,
      productDocs: [productDocs[9]],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      status: 'cancelled',
    });
  }

  const existingReviews = await Review.countDocuments();
  if (existingReviews === 0) {
    const deliveredOrders = await Order.find({
      user: { $in: reviewerDocs.map((user) => user._id) },
      orderStatus: 'delivered',
    }).sort({ createdAt: 1 });

    const productSet = new Map();
    deliveredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = String(item.product);
        if (!productSet.has(key)) productSet.set(key, []);
        productSet.get(key).push({ order, userId: String(order.user) });
      });
    });

    let reviewIndex = 0;
    for (const [productId, purchases] of productSet.entries()) {
      const uniqueUsers = [...new Set(purchases.map((entry) => entry.userId))];
      for (let index = 0; index < uniqueUsers.length; index += 1) {
        const purchase = purchases.find((entry) => entry.userId === uniqueUsers[index]);
        const ratingBase = [5, 5, 4, 5, 4, 3][reviewIndex % 6];
        await Review.create({
          user: uniqueUsers[index],
          product: productId,
          order: purchase.order._id,
          rating: ratingBase,
          title: reviewTitles[reviewIndex % reviewTitles.length],
          comment: reviewComments[reviewIndex % reviewComments.length],
          isVerifiedPurchase: true,
          createdAt: new Date(Date.now() - (reviewIndex + 3) * 24 * 60 * 60 * 1000),
        });
        reviewIndex += 1;
      }
    }

    for (const product of productDocs) {
      const summary = await Review.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const average = summary[0]?.average || 0;
      const count = summary[0]?.count || 0;
      await Product.updateOne(
        { _id: product._id },
        { $set: { rating: Number(average.toFixed(2)), numReviews: count } }
      );
    }
  }

  const sales = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', quantity: { $sum: '$items.quantity' } } },
  ]);
  for (const entry of sales) {
    const product = productDocs.find((doc) => String(doc._id) === String(entry._id));
    if (!product) continue;
    const baseline = product.sold || 0;
    await Product.updateOne(
      { _id: product._id },
      { $set: { sold: baseline > entry.quantity ? baseline : entry.quantity + 40 } }
    );
  }

  const counts = {
    categories: categoryDocs ? Object.keys(categoryDocs).length : 0,
    products: await Product.countDocuments(),
    users: await User.countDocuments(),
    orders: await Order.countDocuments(),
    reviews: await Review.countDocuments(),
  };

  console.log(
    `[seed] Ready: ${counts.products} products · ${counts.users} users · ${counts.orders} orders · ${counts.reviews} reviews`
  );
  console.log(`[seed] Admin: ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
  console.log(`[seed] Customer: ${env.DEMO_EMAIL} / ${env.DEMO_PASSWORD}`);

  return { adminId: admin._id, counts };
};

module.exports = { seedDatabase };
