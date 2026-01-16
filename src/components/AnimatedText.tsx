import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const letterVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 700, damping: 28 },
  },
};

export const AnimatedText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      aria-hidden
    >
      {Array.from(text).map((ch, i) => (
        <motion.span key={i} variants={letterVariants} className={`inline-block ${ch === ' ' ? 'w-2' : ''}`}>
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      ))}
    </motion.span>
  );
};