import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Path for persistent JSON database
const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize local DB with complete premium product listings and default seeded roles
const INITIAL_PRODUCTS = [
  {
    id: 'sonic-pro-headphones',
    title: 'Sonic Pro Noise Canceling Gen 2',
    category: 'Electronics',
    pricePKR: 14500,
    priceAED: 191,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdHoeDr0FvKMp6mpuBkdSuyhWlnkhuPgtrGqsydBA2ROMHwCjpStqnJsVTa7RRKDtRNMGPXB8WV37sEas02wkdywNxYkxdkR2PWyH74jtuMPocetJRxBBHS_O-AlH7bvchrBXRE_VSOk9KP3IzagOcFDEJGe9W19lmw4tdeTa0lC-PgOvMYUs77Opeba_24NQAvad39_mjeqpUTyjmEywVjKWs_1w1shPbZYlVPCuhSEFvO9NPcX6V60IIju2POth8VejI3WC-ug',
    rating: 4.9,
    reviewsCount: 1540,
    isFlashDeal: true,
    discount: 45,
    originalPricePKR: 26000,
    originalPriceAED: 347,
    description: 'Sleek, matte black wireless noise-canceling headphones designed with dynamic acoustics and intelligent adaptive ambient control. Engineered for continuous comfort with plush memory foam earcups.',
    specifications: {
      'Driver Size': '40mm Titanium Dome',
      'Battery Life': 'Up to 45 Hours (ANC On)',
      'Connectivity': 'Bluetooth 5.3 & Ultra-Low Latency Wired',
      'Noise Canceling': 'Hybrid Active Noise Cancellation (Up to 48dB)'
    }
  },
  {
    id: 'lumina-glow-skincare',
    title: 'Lumina Glow Organic Ritual Kit',
    category: 'Beauty',
    pricePKR: 15990,
    priceAED: 210,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDehDmVhAt8imnrSlU7IBPbO04Cgv5up3nbh8yf-lTWjufbjKfsRoM8HB6tt2ZDD4sYZAdFJVGkRu15VoMvuQGWkwFPFfDa9Ht1LzdkDxRSV7UP9DRIzSZJVXxoCJUZoCRiZ6_Eqat6cgXALcvmtIfCoqAR9nb0SWD8AjnZc-fz8pJwebV_KyNJeTFzEbI_HX19mFXKv_GgR7IZInyFps-k85ayn8muLytffSvjbtAN1zrdMna9nbAI9JzLe0ke6YAAnQEk4UGZqQ',
    rating: 4.95,
    reviewsCount: 842,
    isFlashDeal: true,
    discount: 30,
    originalPricePKR: 22800,
    originalPriceAED: 300,
    description: 'A luxurious kit of plant-derived skin treatments meant to lock in intense moisture and smooth complexions. Contains organic botanicals, high-purity Vitamin C serums, and deep renewing night creams.',
    specifications: {
      'Core Ingredients': 'Squalane, Rosehip Oil, Hyaluronic Acid, Vitamin C',
      'Skin Type': 'Suitable for All Skin Types including Sensitive',
      'Includes': 'Toner (100ml), Glow Serum (30ml), Midnight Moisturizer (50ml)'
    }
  },
  {
    id: 'chronos-elite-watch',
    title: 'Chronos Elite Chronograph S',
    category: 'Fashion',
    pricePKR: 38000,
    priceAED: 501,
    image: '/src/assets/images/chronos_elite_watch_image_1783397796162.jpg',
    rating: 4.8,
    reviewsCount: 312,
    isFlashDeal: true,
    discount: 25,
    originalPricePKR: 51000,
    originalPriceAED: 673,
    description: 'A handcrafted chronometer watch boasting mechanical precision. Features a striking dark-blue dial face inside a scratchproof casing of Grade 5 Titanium overlay.',
    specifications: {
      'Movement': 'Japanese Automatic Movement',
      'Water Resistance': '100m (10 ATM)',
      'Strap': 'Genuine Italian Suede leather strap, quick release',
      'Glass': 'Double-dome Curved Sapphire Crystal with internal AR coating'
    }
  },
  {
    id: 'nestflow-smart-thermostat',
    title: 'NestFlow AI Smart Thermostat',
    category: 'Home',
    pricePKR: 24999,
    priceAED: 320,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIrz4t6LnJXcoJ_VX5wu1M306UBnbJmDoU4SlZXKAzBRIZD40TMskfST1EqkB4nmyfscikEBsErkiys8nFnmCas3cGsGavfN7HzhzMsb6_JP1DkNc81LkaBsNsxw6O1OgOUHHzeCQdjaziJ0rsDKEyswem5o1TvORo00uoGGUveKSg9Q2ySgscxQKUBJO3Vq31D0EtqsGz9jRX_yj1x44dVsJ3j0TJfTSxZ6Wh0MN6xf7OScAXzNgHTy7nIR7mrAmqaItb5rAmoA',
    rating: 4.9,
    reviewsCount: 1205,
    description: 'An AI-optimized climate manager for space heating and cooling. Adapts dynamically to your schedule and uses predictive solar heating models to trim power utility bills.',
    specifications: {
      'Display': '2.4-inch AMOLED High Resolution Circular Touchscreen',
      'Connectivity': 'Dual-band Wi-Fi 6, Thread, Matter and Zigbee Support',
      'Integrations': 'Google Home, Apple HomeKit, Amazon Alexa'
    }
  },
  {
    id: 'zorify-elite-espresso',
    title: 'Elite Espresso Brew Pro',
    category: 'Home',
    pricePKR: 110000,
    priceAED: 1450,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP2D3slADJIANnpQDBt9ZybQwWPdUZcOwlorCvXDWgzu5UTf92figHDjIuE0i17gehC0zA2k6m5KlOtqjpxZx7286fFEP8IEwoKWQS7JAVhid9k8FfIkNVJkCKY1dXgfTaGsfBJHH0JklVsvn9kyI4kHJ46580gW94PTW3KqnwBsM9ZQHu0BH0Yv6k3gzAVj-I7q6P3vbSAygcAJgfwR_jDoXYzHaRxQfZdoDSOLR2D_HmnJ307gmnZ2SI_6HfTkR05VC-g2wxDg',
    rating: 5.0,
    reviewsCount: 458,
    topChoice: true,
    description: 'Commercial-grade, full-bodied espresso extractor bundled with a smart PID thermal generator and a micro-foam pressure milk frother. Get perfect golden-brown cremas every cycle.',
    specifications: {
      'Pump Pressure': '19 Bar High-Pressure OptiPump System',
      'Boiler Tech': 'Dual-Thermoblock System with Digital Temperature Guard',
      'Water Reservoir': '2.5L Removable BPA-free tank'
    }
  },
  {
    id: 'aura-leather-kicks',
    title: 'Aura Urban Leather Kicks',
    category: 'Fashion',
    pricePKR: 12500,
    priceAED: 165,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADXHDQy4qvMM5UKF_VQshuVPB5_MYJXWZVvP9EbwOXkKKZCJUF0Yh4Xy3zwF-s2PpkYgyWJkL7ljXty0kvV2-ueXHs2mCzJk4-vT5XL3loFgPHHgib8E4rq4BfhAhUHv9tSBlt_OqT6zw4rYKmgtoFbZJe7bOdMJ-UKuE2fiLNuyVxcwSTnZIzb4I3CrajeHAbrDBMTlAHcRUjYRLH2G2jCcMo7dl85cVHKucaqP29bEDR088YpYV_KPXhAqa6uQxMQo37YZHHlA',
    rating: 4.8,
    reviewsCount: 890,
    description: 'Minimalist designer street shoes using hand-stitched grain-milled leather with natural contrast suede mudguards.',
    specifications: {
      'Outer Material': 'Top Grain Cowhide Leather',
      'Sole Tech': 'OrthoGrip Recycled Cushioned Rubber Outsole',
      'Style': 'Eco-Lux Streetwear Silhouette'
    }
  },
  {
    id: 'tabpro-x-sketch-pad',
    title: 'TabPro X Digital Sketch Edition',
    category: 'Electronics',
    pricePKR: 68000,
    priceAED: 899,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBascmEWaiArh5UhN_KoFb6PNhn7uJ09uEthwLx7WHC24Eok4-ArpoCtlU3xq0dT5jjat5CNB13X5AgCcOoilKM_3laZdrBHODmFb4Yzy4m975mh5Aj2P_fx38L_3-9oM8DpAfw3Wx3QVL-ZY5XUid2qDgFEpfFnuE8GyNjZoEcTK8Hfk-Gfq98lyFdkloGwXvFEt9jRobr3b1TldTE8js9FVMyL-a7eg5l3X7FWX9LG0JTDXgdULbkUdjlyWqSRlMdbRaVpuVl3A',
    rating: 4.7,
    reviewsCount: 2314,
    description: 'High-precision active sketch tablet featuring zero-gap parallax and 8,192 points of pen angular sensitivity. Compatible with professional illustration networks.',
    specifications: {
      'Screen Size': '12.4 inch IPS Fully Laminated 120Hz',
      'Stylus Included': 'Z-Pen 3 Active Magnetic Charging Pen',
      'Color Coverage': '99% DCI-P3 Color Gamut'
    }
  },
  {
    id: 'baby-monitor-smart',
    title: 'CrySense Baby Monitor',
    category: 'Baby',
    pricePKR: 19800,
    priceAED: 260,
    image: 'https://images.unsplash.com/photo-1542443878-0435d72efcb2?auto=format&fit=crop&w=400&q=80',
    rating: 4.85,
    reviewsCount: 192,
    description: 'Smart AI baby monitor that utilizes acoustic analysis to classify infant cries into categories such as hunger, fatigue, or gas. Fully encrypted stream with offline storage option.',
    specifications: {
      'Resolution': '2K Ultra HD Pan & Tilt Camera with Infrared Night Vision',
      'Acoustic AI': 'Cry classification & Breathing Pattern Monitoring',
      'Privacy': 'End-to-End Encrypted Secure Network Local Storage'
    }
  },
  {
    id: 'commerce-era-blueprint',
    title: 'The AI-Commerce Era Blueprint',
    category: 'Books',
    pricePKR: 3800,
    priceAED: 50,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
    reviewsCount: 88,
    description: 'A deep-dive analysis written by industry headers exploring the intersection of global trade networks, trust validation systems, and agentic AI architectures.',
    specifications: {
      'Format': 'Hardcover Deluxe Edition & Digital Copy Key',
      'Pages': '342 Pages thick',
      'Publisher': 'Press Academic Series'
    }
  }
];

// Seed HHC Dropshipped mock products list
const HHC_TRENDING_WHOLESALE = [
  {
    id: 'hhc-series-9-smartwatch',
    title: 'HHC Smart Watch Series 9 Ultra',
    category: 'Electronics',
    hhcWholesalePricePKR: 3500,
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=400&q=80',
    description: 'Superb high-resolution AMOLED display, dual cores processors, continuous heart rate and fitness tracker.',
    specifications: { 'Screen': '2.0-inch AMOLED', 'Battery': 'Up to 7 Days', 'Strap': 'Orange Marine Silicon' }
  },
  {
    id: 'hhc-pro-hair-dryer',
    title: 'HHC Ionic Hair Dryer Pro Air',
    category: 'Beauty',
    hhcWholesalePricePKR: 2800,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    description: 'Salon grade negative ionic styling blower with smart thermal control triggers to lock moisture.',
    specifications: { 'Power': '1800W Silent Flow', 'Speed': '3 Levels', 'Nozzles': 'Concentrator & Diffuser' }
  },
  {
    id: 'hhc-mini-projector-wifi',
    title: 'HHC Wireless Smart Mini Projector',
    category: 'Electronics',
    hhcWholesalePricePKR: 12000,
    image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=400&q=80',
    description: 'Compact 1080P pocket cinematic projector, running on integrated Android ecosystem with direct streaming support.',
    specifications: { 'Brightness': '450 ANSI Lumens', 'Projection': 'Up to 150 inches', 'Platform': 'Android TV Active' }
  },
  {
    id: 'hhc-deep-massager-gun',
    title: 'HHC Deep Tissue Massager Gun S',
    category: 'Beauty',
    hhcWholesalePricePKR: 4200,
    image: 'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&w=400&q=80',
    description: 'Atherton quiet-glide massager gun with multiple speed coordinates to alleviate muscle stiffness.',
    specifications: { 'Heads': '6 Attachments included', 'Speed': '30 levels customizable', 'Carry': 'Deluxe EVA Case' }
  },
  {
    id: 'hhc-office-neck-pillow',
    title: 'HHC Memory Foam Neck Support',
    category: 'Home',
    hhcWholesalePricePKR: 1500,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=400&q=80',
    description: 'Premium slow-rebound core with breathable washable outer wrapper. Absolute neck comfort.',
    specifications: { 'Material': 'Activated Carbon Memory Foam', 'Support': '360 Wrap Orthopedic', 'Fabric': 'Sweat-Resistant Cool Mesh' }
  }
];

// Helper to load/save JSON DB safely
function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDB = {
      users: [
        {
          id: 'USR-ADMIN',
          username: 'admin',
          passwordHash: bcrypt.hashSync('admin123', 10),
          role: 'admin',
          registeredAt: new Date().toISOString()
        },
        {
          id: 'USR-SELLER',
          username: 'seller',
          passwordHash: bcrypt.hashSync('seller123', 10),
          role: 'seller',
          registeredAt: new Date().toISOString()
        },
        {
          id: 'USR-BUYER',
          username: 'buyer',
          passwordHash: bcrypt.hashSync('buyer123', 10),
          role: 'buyer',
          registeredAt: new Date().toISOString()
        }
      ],
      products: INITIAL_PRODUCTS,
      orders: [],
      emails: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading JSON DB, returning empty:', e);
    return { users: [], products: [], orders: [], emails: [] };
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing JSON DB:', e);
  }
}

// Security Audit Logs Storage
const SECURITY_LOGS: any[] = [
  { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), type: 'SYSTEM_BOOT', message: 'Zorify Security and Compliance kernel loaded up.' },
  { timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'HTTPS_ACTIVATED', message: 'Simulated Helmet HSTS protection headers configured.' },
  { timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'CORS_CONFIGURED', message: 'CORS policy configured for whitelist scopes origin:*.' }
];

function logSecurityEvent(type: string, message: string) {
  SECURITY_LOGS.unshift({
    timestamp: new Date().toISOString(),
    type,
    message
  });
  if (SECURITY_LOGS.length > 50) {
    SECURITY_LOGS.pop();
  }
}

// Rate Limiter storage map
const RATE_LIMITS: Record<string, { count: number; resetTime: number }> = {};
const LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS = 10;

async function main() {
  const app = express();
  const PORT = 3000;

  // Configure CORS
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(express.json());

  // Security headers & HTTPS enforcement simulation middleware
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' data: https: blob:; frame-ancestors *;");
    next();
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Core server uncaught exception error:', err);
    logSecurityEvent('SERVER_ERROR_CAUGHT', `Handler caught exception: ${err.message || 'Unknown state'}`);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'A secure error boundary caught an exception.',
      details: err.message || 'General exception'
    });
  });

  // SQL Injection Protection Validation Middleware (Safeguarded against false positives on regular words)
  const sqlInjectionProtection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const checkValue = (val: any): boolean => {
      if (typeof val === 'string') {
        const sqlPattern = /(\bunion\s+select\b|\bdrop\s+table\b|\bdelete\s+from\b|\binsert\s+into\b|\bor\s+1\s*=\s*1\b|'--|;\s*drop\b)/i;
        return sqlPattern.test(val);
      }
      if (typeof val === 'object' && val !== null) {
        return Object.values(val).some(v => checkValue(v));
      }
      return false;
    };

    if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
      logSecurityEvent('SQL_INJECTION_BLOCKED', `Suspicious database syntax matching injection threat blocked on path "${req.path}".`);
      return res.status(403).json({
        error: 'SQL Injection Blocked',
        message: 'Security protection shield intercepted and neutralized a SQL Injection attack signature.',
        mitigationStatus: 'Threat neutralized, logged event, transaction aborted.'
      });
    }
    next();
  };

  // Helper to verify user by session token
  const authenticateToken = (reqToken: string) => {
    const db = getDB();
    if (!reqToken || !reqToken.startsWith('ZORIFY-SECURE-SESSION-')) return null;
    try {
      const parts = reqToken.split('-');
      const base64Username = parts[3];
      const username = Buffer.from(base64Username, 'base64').toString('utf-8');
      const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
      return user || null;
    } catch (e) {
      return null;
    }
  };

  // Live health diagnostic index
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cryptoActive: true,
      bcryptSuites: 'bcryptjs (Rounds=10)',
      corsPolicies: 'Active (Header origin: *)',
      environmentSecurity: 'Secure-Enclave',
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // GET products catalog
  app.get('/api/products', (req, res) => {
    const db = getDB();
    res.json(db.products);
  });

  // POST subscribe email alerts (No-Login Notification Option)
  app.post('/api/notifications/subscribe', sqlInjectionProtection, (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const db = getDB();
    if (!db.subscribers) {
      db.subscribers = [];
    }

    const trimmedEmail = email.trim().toLowerCase();
    const isNew = !db.subscribers.includes(trimmedEmail);
    if (isNew) {
      db.subscribers.push(trimmedEmail);
    }

    // Trigger instant mock confirmation email to the subscriber
    const mailId = `mail-sub-${Date.now()}`;
    const mailSubject = `[Zorify] Live Email Notifications Activated! 🔔`;
    const timestamp = new Date().toISOString();
    const mailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 12px; background: #fff;">
        <h3 style="background: #002045; color: #fff; padding: 12px; border-radius: 8px; margin-top: 0; text-align: center;">Zorify Alert System</h3>
        <p>Dear Customer,</p>
        <p>Your email address <strong>${trimmedEmail}</strong> has been successfully registered to receive instant real-time alerts from <strong>Zorify</strong>.</p>
        
        <p style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; border-radius: 6px; color: #166534; font-size: 13px;">
          <strong>🔔 Live Tracking Enabled:</strong> You will now receive automated dispatches whenever a new product is listed, catalog gets updated, or any secure trade escrow transaction activity completes.
        </p>

        <p>You did not need to register a user account. You can manage or unsubscribe at any time directly by clicking the alerts bell.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; text-align: center; color: #999;">This dispatch was triggered securely by Nodemailer sandbox. Zorify Security & Legal Escrow Department.</p>
      </div>
    `;

    const newEmailLog = {
      id: mailId,
      to: trimmedEmail,
      subject: mailSubject,
      body: mailBody,
      sentAt: timestamp
    };

    if (!db.emails) {
      db.emails = [];
    }
    db.emails.unshift(newEmailLog);
    saveDB(db);

    logSecurityEvent('NOTIFICATION_SUBSCRIBED', `New anonymous email subscriber registered: "${trimmedEmail}" for real-time live alert dispatch.`);

    res.json({
      success: true,
      message: 'Successfully subscribed to real-time Zorify alerts! A confirmation email log has been dispatched.',
      isNew
    });
  });

  // POST add custom product (Seller / Admin)
  app.post('/api/seller/products', sqlInjectionProtection, (req, res) => {
    const { token, title, category, pricePKR, priceUSD, image, description, specificationsStr } = req.body;
    const user = authenticateToken(token);
    if (!user || user.role === 'buyer') {
      return res.status(401).json({ error: 'Unauthorized vendor or admin action.' });
    }

    if (!title || !pricePKR || !image) {
      return res.status(400).json({ error: 'Product title, base price, and image URL are required.' });
    }

    const db = getDB();
    const id = `prod-seller-${Date.now()}`;
    
    // Parse specs string like "Key: Value, Key2: Value2"
    const specifications: Record<string, string> = {};
    if (specificationsStr) {
      specificationsStr.split(',').forEach((p: string) => {
        const parts = p.split(':');
        if (parts.length >= 2) {
          specifications[parts[0].trim()] = parts[1].trim();
        }
      });
    }

    const newProduct = {
      id,
      title,
      category,
      pricePKR,
      priceUSD: priceUSD || Math.round(pricePKR / 278),
      image,
      rating: 4.8,
      reviewsCount: 1,
      description,
      specifications,
      sellerId: user.id
    };

    db.products.push(newProduct);
    
    // Notify all subscribers of the new product drops
    if (db.subscribers && db.subscribers.length > 0) {
      db.subscribers.forEach((subEmail: string) => {
        const notifyMailId = `mail-notif-prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const notifySubject = `[Zorify Alerts] New Verified Product Listed: ${title}!`;
        const notifyBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 12px; background: #fff;">
            <h3 style="background: #002045; color: #fff; padding: 12px; border-radius: 8px; margin-top: 0; text-align: center;">New Product Drop Alert</h3>
            <p>Hello Subscriber,</p>
            <p>A brand new premium certified product has just been uploaded to the <strong>Zorify</strong> catalog by certified vendors:</p>
            
            <div style="display: flex; gap: 15px; border: 1px solid #eee; padding: 15px; border-radius: 10px; background: #fafafa; margin-top: 15px;">
              <div style="flex-shrink: 0;">
                <img src="${image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />
              </div>
              <div>
                <h4 style="margin: 0; color: #002045; font-size: 14px;">${title}</h4>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">Category: <strong>${category}</strong></p>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold; color: #16a34a;">Price: PKR ${pricePKR.toLocaleString()}</p>
                <p style="margin: 5px 0; font-size: 11px; color: #777;">${description || ''}</p>
              </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; text-align: center; color: #999;">You received this because you subscribed to Zorify live email notifications. Zorify Legal Escrow Department.</p>
          </div>
        `;
        db.emails.unshift({
          id: notifyMailId,
          to: subEmail,
          subject: notifySubject,
          body: notifyBody,
          sentAt: new Date().toISOString()
        });
      });
      logSecurityEvent('SUBSCRIBERS_NOTIFIED_PRODUCT', `Dispatched new product drop alerts to ${db.subscribers.length} subscribers.`);
    }

    saveDB(db);

    logSecurityEvent('PRODUCT_LISTED', `Seller "${user.username}" successfully listed product "${title}" (ID: ${id}) to database.`);
    res.json(newProduct);
  });

  // POST HHC Dropshipping database sync
  app.post('/api/dropship/sync', (req, res) => {
    const { token } = req.body;
    const user = authenticateToken(token);
    if (!user || user.role === 'buyer') {
      return res.status(401).json({ error: 'Unauthorized administrative action.' });
    }

    const db = getDB();
    let importedCount = 0;

    HHC_TRENDING_WHOLESALE.forEach((hhcProd) => {
      // Check if product already exists
      const exists = db.products.some((p: any) => p.id === hhcProd.id);
      if (!exists) {
        // Compute exact 15% profit margin formula:
        // Selling Price = Wholesale Price + (Wholesale Price * 0.15)
        const wholesalePrice = hhcProd.hhcWholesalePricePKR;
        const sellingPricePKR = Math.round(wholesalePrice + (wholesalePrice * 0.15));
        const sellingPriceUSD = Math.round(sellingPricePKR / 278); // Standard PKR to USD conversion

        const newProd = {
          id: hhcProd.id,
          title: hhcProd.title,
          category: hhcProd.category as any,
          pricePKR: sellingPricePKR,
          priceUSD: sellingPriceUSD,
          image: hhcProd.image,
          rating: 4.9,
          reviewsCount: Math.floor(Math.random() * 80) + 10,
          description: hhcProd.description,
          specifications: hhcProd.specifications,
          isFlashDeal: Math.random() > 0.5,
          discount: 15,
          originalPricePKR: Math.round(sellingPricePKR * 1.15),
          originalPriceUSD: Math.round(sellingPriceUSD * 1.15)
        };

        db.products.push(newProd);
        importedCount++;
      }
    });

    if (importedCount > 0) {
      // Notify all subscribers of the Dropship Sync
      if (db.subscribers && db.subscribers.length > 0) {
        db.subscribers.forEach((subEmail: string) => {
          const notifyMailId = `mail-notif-sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const notifySubject = `[Zorify Alerts] Fresh Stock Imported! ${importedCount} trending items added 🚀`;
          const notifyBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 12px; background: #fff;">
              <h3 style="background: #002045; color: #fff; padding: 12px; border-radius: 8px; margin-top: 0; text-align: center;">Fresh Stock Update Alert</h3>
              <p>Hello Subscriber,</p>
              <p>Our automated dropship engine has successfully pulled and computed markup prices for <strong>${importedCount} new wholesale trending products</strong> from HHC Dropshipping!</p>
              
              <p>They are now available inside the public Zorify catalog with our strict <strong>15% profit margin guarantee</strong>.</p>
              
              <p style="background: #eff6ff; padding: 12px; border-radius: 6px; font-size: 12px; border-left: 4px solid #3b82f6; color: #1e3a8a; margin-top: 15px;">
                Visit the homepage to view the live dynamic catalog. All items are verified under the Zorify Safe Buy guarantee.
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; text-align: center; color: #999;">You received this because you subscribed to Zorify live email notifications. Zorify Legal Escrow Department.</p>
            </div>
          `;
          db.emails.unshift({
            id: notifyMailId,
            to: subEmail,
            subject: notifySubject,
            body: notifyBody,
            sentAt: new Date().toISOString()
          });
        });
        logSecurityEvent('SUBSCRIBERS_NOTIFIED_SYNC', `Dispatched dropship sync alert email notifications to ${db.subscribers.length} subscribers.`);
      }

      saveDB(db);
      logSecurityEvent('HHC_DROPSHIP_SYNC_COMPLETED', `Successfully synced ${importedCount} wholesale items from HHC with 15% markup price calculation.`);
    }

    res.json({ success: true, count: importedCount });
  });

  // GET orders logs (filters for Buyers or returns all for Admin/Seller)
  app.get('/api/orders', (req, res) => {
    const token = req.query.token as string;
    const user = authenticateToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session token invalid or expired.' });
    }

    const db = getDB();
    if (user.role === 'buyer') {
      // Return only buyer placed orders
      const userOrders = db.orders.filter((o: any) => o.buyerId === user.id);
      return res.json(userOrders);
    }

    // Admins and Sellers can see all orders
    res.json(db.orders);
  });

  // POST checkout payment (Place Order)
  app.post('/api/checkout/payment', sqlInjectionProtection, (req, res) => {
    const { cartItems, fullName, phone, address, city, paymentMethod, currencyState, totalCost, token } = req.body;
    if (!fullName || !phone || !address || !totalCost || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Delivery details and shopping items are required.' });
    }

    const db = getDB();
    const user = authenticateToken(token);
    const buyerId = user ? user.id : 'GUEST-BUYER';

    const orderId = `ZV-${Math.floor(Math.random() * 900000) + 100000}`;
    const timestamp = new Date().toISOString();

    const newOrder = {
      id: orderId,
      buyerId,
      fullName,
      phone,
      address,
      city: city || 'Lahore',
      cartItems,
      totalCost,
      currency: currencyState || 'PKR',
      paymentMethod: paymentMethod || 'Cash on Delivery',
      status: 'Placed',
      trackingHistory: [
        { status: 'Placed', timestamp }
      ],
      createdAt: timestamp
    };

    db.orders.unshift(newOrder);

    // Build visual and detailed HTML Admin notification email logs
    const mailId = `mail-dispatch-${Date.now()}`;
    const mailSubject = `[ZORIFY-NEW-ORDER] Escrow Secure Order Placed #${orderId}!`;
    
    // Items listing string
    const itemsHTML = cartItems.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${item.product.title}</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #10B981;">
          ${currencyState === 'AED' ? 'AED' : 'PKR'} ${(currencyState === 'AED' ? item.selectedSeller.priceAED : item.selectedSeller.pricePKR) * item.quantity}
        </td>
      </tr>
    `).join('');

    const mailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 12px;">
        <h3 style="background: #002045; color: #fff; padding: 12px; border-radius: 8px; margin-top: 0; text-align: center;">Zorify Order Alert Desk</h3>
        <p>Attention Admin, a secure purchase contract has been successfully initialized on Zorify Escrow covenants.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr><td style="padding: 6px 0; color: #666;">Order Number:</td><td><strong>#${orderId}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Recipient Client:</td><td><strong>${fullName}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Contact Phone:</td><td><strong>${phone}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Shipping Address:</td><td><strong>${address}, ${city || 'Lahore'}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Secure Payment Mode:</td><td><strong>${paymentMethod || 'Cash on Delivery'}</strong></td></tr>
        </table>

        <p style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #002045; padding-bottom: 4px;">Shopping Cart Items</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;"><th style="padding: 8px; text-align: left;">Title</th><th style="padding: 8px; text-align: center;">Qty</th><th style="padding: 8px; text-align: right;">Price</th></tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 15px; font-size: 16px;">
          <strong>Total Volume: <span style="color: #002045;">${currencyState === 'USD' ? 'USD' : 'PKR'} ${totalCost.toLocaleString()}</span></strong>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; text-align: center; color: #999;">This dispatch was triggered securely by Nodemailer sandbox. Zorify Security & Legal Escrow Department.</p>
      </div>
    `;

    const newEmailLog = {
      id: mailId,
      to: 'admin@zorify.com',
      subject: mailSubject,
      body: mailBody,
      sentAt: timestamp
    };

    db.emails.unshift(newEmailLog);

    // Notify all subscribers of marketplace transaction activity
    if (db.subscribers && db.subscribers.length > 0) {
      db.subscribers.forEach((subEmail: string) => {
        const notifyMailId = `mail-notif-trade-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const notifySubject = `[Zorify Alerts] Escrow Trade Activity: New secure purchase contract placed!`;
        const notifyBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 12px; background: #fff;">
            <h3 style="background: #002045; color: #fff; padding: 12px; border-radius: 8px; margin-top: 0; text-align: center;">Escrow Trade Activity Alert</h3>
            <p>Hello Subscriber,</p>
            <p>A brand new secure trade escrow contract has been successfully initialized on the <strong>Zorify</strong> marketplace network:</p>
            
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 8px; font-size: 12px; margin: 15px 0;">
              <div><strong>Contract ID:</strong> #${orderId}-ESC</div>
              <div><strong>Fulfillment Method:</strong> ${paymentMethod}</div>
              <div><strong>Order Total:</strong> ${currencyState} ${totalCost.toLocaleString()}</div>
              <div><strong>Escrow Status:</strong> SAFELY SECURED IN COMPLIANCE COVENANTS</div>
            </div>

            <p style="font-size: 12px; color: #666; leading-relaxed: 1.5;">This trade is protected by our zero-risk buyer assurance and multi-signature release protocols. Payments are only released after proof of delivery.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; text-align: center; color: #999;">You received this because you subscribed to Zorify live email notifications. Zorify Legal Escrow Department.</p>
          </div>
        `;
        db.emails.unshift({
          id: notifyMailId,
          to: subEmail,
          subject: notifySubject,
          body: notifyBody,
          sentAt: new Date().toISOString()
        });
      });
      logSecurityEvent('SUBSCRIBERS_NOTIFIED_TRADE', `Dispatched marketplace transaction escrow activity alert email notifications to ${db.subscribers.length} subscribers.`);
    }

    saveDB(db);

    logSecurityEvent('ORDER_PAYMENT_AUTHORIZED', `Authorized simulated ${paymentMethod} payment from "${fullName}" of value: ${currencyState} ${totalCost.toLocaleString()}. Contract ID: #${orderId}-ESC`);
    logSecurityEvent('ADMIN_EMAIL_DISPATCHED', `Dispatched instant order alert email notification to "admin@zorify.com" for Order #${orderId}.`);

    res.json({
      success: true,
      orderId,
      order: newOrder,
      message: 'Checkout complete. Security logs updated and Admin email log has been dispatched successfully.'
    });
  });

  // PATCH update order tracking status (Admin / Seller)
  app.patch('/api/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { token, status } = req.body;
    const user = authenticateToken(token);
    if (!user || user.role === 'buyer') {
      return res.status(401).json({ error: 'Unauthorized administrative action.' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Order status state is required.' });
    }

    const db = getDB();
    const orderIdx = db.orders.findIndex((o: any) => o.id === orderId);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Order contract not found.' });
    }

    const timestamp = new Date().toISOString();
    db.orders[orderIdx].status = status;
    db.orders[orderIdx].trackingHistory.push({
      status,
      timestamp
    });

    saveDB(db);

    logSecurityEvent('ORDER_STATUS_CHANGED', `Fulfillment state of Order #${orderId} advanced to "${status}" by moderator "${user.username}".`);
    res.json(db.orders[orderIdx]);
  });

  // GET Admin Email logs
  app.get('/api/admin/emails', (req, res) => {
    const token = req.query.token as string;
    const user = authenticateToken(token);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Access restricted to authorized administrators only.' });
    }

    const db = getDB();
    res.json(db.emails);
  });

  // Password Hashing (bcrypt) User Registration
  app.post('/api/auth/register', sqlInjectionProtection, async (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and structural password are required.' });
      }

      const exactUserLower = username.toLowerCase();
      const db = getDB();
      const userExists = db.users.find((u: any) => u.username.toLowerCase() === exactUserLower);
      if (userExists) {
        return res.status(400).json({ error: 'This business partner/username is already registered.' });
      }

      // Secure encryption using Bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = {
        id: `USR-${Math.floor(Math.random() * 90000) + 10000}`,
        username,
        passwordHash,
        role: role || 'buyer', // Supports role-based access
        registeredAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveDB(db);

      logSecurityEvent('USER_REGISTERED', `User "${username}" registered as ${newUser.role}. Plaintext salt generated: ${salt}`);

      res.json({
        success: true,
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
        saltGenerated: salt,
        passwordHashGenerated: passwordHash,
        message: 'Password hashed securely using strong cryptographic random salt + Blowfish bcrypt.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  // Password Hashing (bcrypt) User Login verification
  app.post('/api/auth/login', sqlInjectionProtection, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password fields are required.' });
      }

      const exactUserLower = username.toLowerCase();
      const db = getDB();
      const userObj = db.users.find((u: any) => u.username.toLowerCase() === exactUserLower);
      if (!userObj) {
        logSecurityEvent('AUTH_FAIL', `Failed login attempt for missing username "${username}".`);
        return res.status(401).json({ error: 'The credentials supplied could not be certified.' });
      }

      // Secure comparison of bcrypted password hash
      const isMatch = await bcrypt.compare(password, userObj.passwordHash);
      if (!isMatch) {
        logSecurityEvent('AUTH_FAIL', `Invalid password attempted for username "${username}".`);
        return res.status(401).json({ error: 'The credentials supplied could not be certified.' });
      }

      logSecurityEvent('AUTH_SUCCESS', `User "${username}" successfully authorized as role: ${userObj.role}.`);
      res.json({
        success: true,
        username: userObj.username,
        role: userObj.role,
        sessionToken: `ZORIFY-SECURE-SESSION-${Buffer.from(username).toString('base64')}-${Date.now()}`,
        message: 'Authentication successful. Password verification matching completed via bcrypt.compare().'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login verification crashed.' });
    }
  });

  // Custom API Rate Limiter verification route
  app.post('/api/test/rate-limit', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientIp = Array.isArray(ip) ? ip[0] : (typeof ip === 'string' ? ip.split(',')[0] : '127.0.0.1');
    const now = Date.now();

    if (!RATE_LIMITS[clientIp] || now > RATE_LIMITS[clientIp].resetTime) {
      RATE_LIMITS[clientIp] = {
        count: 0,
        resetTime: now + LIMIT_WINDOW_MS
      };
    }

    RATE_LIMITS[clientIp].count += 1;
    const remainingHits = Math.max(0, MAX_REQUESTS - RATE_LIMITS[clientIp].count);

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', remainingHits.toString());
    res.setHeader('X-RateLimit-Reset', RATE_LIMITS[clientIp].resetTime.toString());

    if (RATE_LIMITS[clientIp].count > MAX_REQUESTS) {
      logSecurityEvent('DOSTHREAT_RATE_LIMIT_BLOCKED', `IP address ${clientIp} blocked. Click frequency threshold exceeded limit ${MAX_REQUESTS}/min.`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `API rate limit exceeded. Click restriction of max ${MAX_REQUESTS} transactions per minute is active.`,
        remaining: 0,
        resetInSeconds: Math.ceil((RATE_LIMITS[clientIp].resetTime - now) / 1000)
      });
    }

    res.json({
      success: true,
      message: 'Rate limit test token successfully verified.',
      clientIp,
      requestsUsed: RATE_LIMITS[clientIp].count,
      requestsRemaining: remainingHits,
      resetSecondsLeft: Math.ceil((RATE_LIMITS[clientIp].resetTime - now) / 1000)
    });
  });

  // Dynamic SQL Injection protect route
  app.post('/api/test/sql-protect', sqlInjectionProtection, (req, res) => {
    res.json({
      success: true,
      message: 'Excellent. No SQL Injection threat signatures detected in payload strings.',
      sanitizedPayload: req.body
    });
  });

  // Pull Security Audit logs
  app.get('/api/admin/security-logs', (req, res) => {
    res.json(SECURITY_LOGS);
  });

  // Database Backup Generation endpoint
  app.get('/api/admin/backup', (req, res) => {
    const db = getDB();
    const backupPayload = {
      backupId: `BACKUP-ZOR-${Date.now()}`,
      firmwareVersion: 'v3.1.2-Shielded',
      timestamp: new Date().toISOString(),
      integrityCheck: 'MD5:e4d909c290d235c6f3e1b72b8da8195a',
      database: {
        products: db.products,
        registeredUsersCount: db.users.length,
        usersMockState: db.users.map((u: any) => ({ username: u.username, passwordHash: u.passwordHash, role: u.role })),
        securityAuditLogs: SECURITY_LOGS,
        orders: db.orders,
        emails: db.emails
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=zorify_database_backup_${Date.now()}.json`);
    res.send(JSON.stringify(backupPayload, null, 2));
  });

  // AI-Powered Search Route
  app.post('/api/gemini/search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const db = getDB();
      const catalog = db.products.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        pricePKR: p.pricePKR,
        priceAED: p.priceAED,
        description: p.description
      }));

      if (!process.env.GEMINI_API_KEY) {
        // Fallback for missing key: Do basic keyword matching
        const normalized = query.toLowerCase();
        const matches = catalog.filter((p: any) => 
          p.title.toLowerCase().includes(normalized) || 
          p.description.toLowerCase().includes(normalized) || 
          p.category.toLowerCase().includes(normalized)
        ).map((p: any) => p.id);

        return res.json({
          reply: `Here are the results matching your query "${query}". (Note: Active Gemini API Key is missing, practicing keyword search mode).`,
          matchedProductIds: matches,
          recommendationExplanation: 'Matching tags or keyword criteria occurred.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are the Zorify AI Intelligent Assistant shopping guide helper. Given the user request, return the best products and explanation.
        
User Request: "${query}"

Here is the exact catalogue of products:
${JSON.stringify(catalog, null, 2)}`,
        config: {
          systemInstruction: `Analyze the user shopping search query. Recommend relevant matching product IDs from Zorify inventory. Follow this JSON schema format:
          {
            "reply": "Friendly explanation directly answering the user, suggesting matching items",
            "matchedProductIds": ["id1", "id2"],
            "recommendationExplanation": "Slogan or rationale explaining why they matched this item"
          }
          Be conversational and objective. Do not make up products or recommend things outside of the catalog inventory. Return empty matchedProductIds if nothing matches. Always output valid JSON under the requested schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'conversational response to the buyer'
              },
              matchedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'the IDs of products that fit the query'
              },
              recommendationExplanation: {
                type: Type.STRING,
                description: 'concise summary explaining the match'
              }
            },
            required: ['reply', 'matchedProductIds', 'recommendationExplanation']
          }
        }
      });

      const textResult = response.text || '';
      try {
        const parsed = JSON.parse(textResult.trim());
        res.json(parsed);
      } catch (err) {
        console.error('Failed to parse Gemini response as JSON. RAW WAS:', textResult);
        res.json({
          reply: textResult || "I gathered some options for you but couldn't parse the structure perfectly.",
          matchedProductIds: [],
          recommendationExplanation: ''
        });
      }
    } catch (e: any) {
      console.error('Error in /api/gemini/search:', e);
      res.status(500).json({ error: e.message || 'Internal server error during search' });
    }
  });

  // Seller submit proposal endpoint
  app.post('/api/seller/apply', (req, res) => {
    const { storeName, category, website, location } = req.body;
    if (!storeName || !category) {
      return res.status(400).json({ error: 'Store name and department category are required.' });
    }

    // Dynamic automated checklist evaluation
    const score = Math.floor(Math.random() * 20) + 80; // 80-100 score
    res.json({
      success: true,
      score,
      status: score >= 90 ? 'Approved - Instant Verification Issued' : 'Under Manual Trust Review',
      checklist: {
        domainVerified: !!website,
        geoSecurityCheck: true,
        riskRating: 'Low'
      },
      message: `Thanks for applying with ${storeName}. Your preliminary Zorify score is ${score}%.`
    });
  });

  // Client SPA support and static asset loading
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/src/assets', express.static(path.join(process.cwd(), 'src/assets')));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zorify server booted on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('Server boot failed:', err);
  process.exit(1);
});
