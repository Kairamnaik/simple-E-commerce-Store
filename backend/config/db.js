const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/simple-ecommerce';

async function connect() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    // If the URI contains a placeholder password, skip it and trigger the in-memory fallback
    if (MONGODB_URI.includes('<db_password>')) {
      throw new Error('Placeholder <db_password> detected in MONGODB_URI.');
    }
    
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB at:', MONGODB_URI.split('@').pop());
    await seedProducts();
  } catch (err) {
    if (isProduction) {
      console.error('Database connection error in production:', err.message);
      return;
    }
    
    // In local development, fall back to MongoMemoryServer for any connection/auth error
    console.log('\n⚠️  Failed to connect to the configured MongoDB database:', err.message);
    console.log('⚙️  Starting an in-memory MongoDB database for zero-config local run...\n');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      
      await mongoose.connect(memoryUri);
      console.log('🎉 Connected to temporary in-memory MongoDB at:', memoryUri);
      await seedProducts();
    } catch (memErr) {
      console.error('Failed to start in-memory MongoDB server:', memErr.message);
    }
  }
}

async function seedProducts() {
  try {
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const count = await productsCollection.countDocuments();
    
    if (count === 0) {
      console.log('Seeding initial products into database...');
      const initialProducts = [
        {
          name: 'AeroGlide Wireless Mouse',
          description: 'Ergonomic wireless gaming mouse with 26K DPI precision, ultra-lightweight design, and customizable RGB lighting.',
          price: 79.99,
          image_url: 'images/product-mouse.png',
          category: 'Electronics',
          stock: 25,
          created_at: new Date()
        },
        {
          name: 'Luminae Mechanical Keyboard',
          description: 'Hot-swappable mechanical keyboard featuring silent linear switches, PBT keycaps, and a CNC aluminum frame.',
          price: 149.99,
          image_url: 'images/product-keyboard.png',
          category: 'Electronics',
          stock: 15,
          created_at: new Date()
        },
        {
          name: 'SoundWave ANC Headphones',
          description: 'Premium over-ear active noise cancelling headphones with 40-hour battery life and high-resolution sound profiles.',
          price: 199.99,
          image_url: 'images/product-headphones.png',
          category: 'Audio',
          stock: 20,
          created_at: new Date()
        },
        {
          name: 'Zenith Smart Watch',
          description: 'Sleek smartwatch with blood oxygen tracking, dynamic workout tracking, and 7-day battery life.',
          price: 129.99,
          image_url: 'images/product-watch.png',
          category: 'Electronics',
          stock: 30,
          created_at: new Date()
        },
        {
          name: 'Nova Glow Desk Mat',
          description: 'Water-resistant micro-texture cloth desk mat with stitched edges and dynamic RGB perimeter glow.',
          price: 34.99,
          image_url: 'images/product-deskmat.png',
          category: 'Accessories',
          stock: 45,
          created_at: new Date()
        },
        {
          name: 'Apex Charge 3-in-1',
          description: 'Magnetic wireless charging stand compatible with smart phones, smart watches, and wireless earbud cases.',
          price: 59.99,
          image_url: 'images/product-charger.png',
          category: 'Accessories',
          stock: 50,
          created_at: new Date()
        },
        {
          name: 'Helios USB-C Microphone',
          description: 'Studio-grade cardioid USB-C microphone with integrated pop filter, shock mount, and high-resolution 24-bit/96kHz audio recording.',
          price: 119.99,
          image_url: 'images/product-mic.png',
          category: 'Audio',
          stock: 18,
          created_at: new Date()
        },
        {
          name: 'Stratus Ergonomic Chair',
          description: 'High-back mesh ergonomic office chair with adaptive lumbar support, 3D armrests, and dynamic recline lock.',
          price: 349.99,
          image_url: 'images/product-chair.png',
          category: 'Accessories',
          stock: 8,
          created_at: new Date()
        }
      ];
      
      await productsCollection.insertMany(initialProducts);
      console.log('Seeding completed successfully.');
    }
  } catch (err) {
    console.error('Error seeding products:', err.message);
  }
}

connect();

module.exports = mongoose;
