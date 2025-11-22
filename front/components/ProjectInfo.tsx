'use client';

import { motion } from 'motion/react';
import { Zap, Shield, RefreshCw, Coins } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    title: "Instant Evolution",
    description: "Watch your eggs hatch and evolve in real-time with our advanced on-chain genetics engine."
  },
  {
    icon: <Shield className="w-8 h-8 text-blue-400" />,
    title: "Secure Ownership",
    description: "Every egg is a unique NFT on the Sui blockchain, guaranteeing true ownership and scarcity."
  },
  {
    icon: <RefreshCw className="w-8 h-8 text-green-400" />,
    title: "Dynamic Traits",
    description: "Traits evolve based on interaction, care, and random mutations, creating endless possibilities."
  },
  {
    icon: <Coins className="w-8 h-8 text-purple-400" />,
    title: "Marketplace",
    description: "Trade your rare breeds in our decentralized marketplace with low fees and instant settlement."
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function ProjectInfo() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 text-transparent bg-clip-text font-bangers tracking-wide"
          >
            The Future of Digital Evolution
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto font-medium"
          >
            Discover a world where your digital assets are alive, evolving, and truly yours.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-6 p-4 rounded-xl bg-gray-50 w-fit group-hover:bg-gray-100 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 font-bangers tracking-wide">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
