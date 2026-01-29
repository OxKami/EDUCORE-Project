import app from './app';
import { config } from './config/env';
import prisma from './config/database';

const PORT = config.port;

// Test database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log(`🎓 EduCore API Server Started!`);
    console.log('🚀 ========================================');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('🚀 ========================================');
    console.log('');
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();