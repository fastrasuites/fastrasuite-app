"use client";

import React from "react";
import { motion } from "framer-motion";

// Animation presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 },
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 },
  },
};

// Main wrapper component
interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: keyof typeof animations;
  delay?: number;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = "fadeIn",
  delay = 0,
  className = "",
  hoverEffect = false,
  onClick,
  style,
  ...props
}) => {
  const baseAnimation = animations[animation];

  return (
    <motion.div
      className={className}
      style={style}
      initial={baseAnimation.initial}
      animate={baseAnimation.animate}
      transition={
        delay > 0
          ? { ...baseAnimation.transition, delay }
          : baseAnimation.transition
      }
      {...(hoverEffect && {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.2 },
      })}
      {...(onClick && {
        onClick,
        whileTap: { scale: 0.95 },
        transition: { duration: 0.1 },
      })}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Convenience components for common animations
interface SimpleAnimatedProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<SimpleAnimatedProps> = ({
  children,
  ...props
}) => (
  <AnimatedWrapper animation="fadeIn" {...props}>
    {children}
  </AnimatedWrapper>
);

export const SlideUp: React.FC<SimpleAnimatedProps> = ({
  children,
  ...props
}) => (
  <AnimatedWrapper animation="slideUp" {...props}>
    {children}
  </AnimatedWrapper>
);

export const SlideDown: React.FC<SimpleAnimatedProps> = ({
  children,
  ...props
}) => (
  <AnimatedWrapper animation="slideDown" {...props}>
    {children}
  </AnimatedWrapper>
);

export const SlideLeft: React.FC<SimpleAnimatedProps> = ({
  children,
  ...props
}) => (
  <AnimatedWrapper animation="slideLeft" {...props}>
    {children}
  </AnimatedWrapper>
);

export const SlideRight: React.FC<SimpleAnimatedProps> = ({
  children,
  ...props
}) => (
  <AnimatedWrapper animation="slideRight" {...props}>
    {children}
  </AnimatedWrapper>
);

export const ScaleIn: React.FC<SimpleAnimatedProps> = ({
  children,
  ...props
}) => (
  <AnimatedWrapper animation="scaleIn" {...props}>
    {children}
  </AnimatedWrapper>
);

// Stagger animations for lists
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  style?: React.CSSProperties;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = "",
  staggerDelay = 0.1,
  style,
  ...props
}) => (
  <div className={className} style={style}>
    {React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * staggerDelay,
        }}
        {...props}
      >
        {child}
      </motion.div>
    ))}
  </div>
);

// Page wrapper
interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = "",
  style,
  ...props
}) => (
  <motion.div
    className={className}
    style={style}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Interactive wrapper with hover effects
interface InteractiveProps extends SimpleAnimatedProps {
  effect?: "subtle" | "lift" | "glow";
}

export const Interactive: React.FC<InteractiveProps> = ({
  children,
  effect = "subtle",
  ...props
}) => {
  const getHoverEffect = () => {
    switch (effect) {
      case "lift":
        return {
          whileHover: {
            y: -4,
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
          },
        };
      case "glow":
        return {
          whileHover: {
            boxShadow: "0 0 20px rgba(59, 123, 237, 0.3)",
          },
        };
      default:
        return {
          whileHover: { scale: 1.02 },
        };
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      {...getHoverEffect()}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated list items
interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  itemDelay?: number;
  direction?: "left" | "right" | "up" | "down";
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = "",
  itemDelay = 0.1,
  direction = "left",
}) => {
  const getInitialState = () => {
    switch (direction) {
      case "right":
        return { opacity: 0, x: -20 };
      case "up":
        return { opacity: 0, y: 20 };
      case "down":
        return { opacity: 0, y: -20 };
      default:
        return { opacity: 0, x: 20 };
    }
  };

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={getInitialState()}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * itemDelay,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

export default AnimatedWrapper;
