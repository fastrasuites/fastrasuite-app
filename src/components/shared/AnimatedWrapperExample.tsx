import React from "react";
import {
  AnimatedWrapper,
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  Interactive,
  PageWrapper,
} from "./AnimatedWrapper";

// Example 1: Using AnimatedWrapper directly
export const ExampleComponent1: React.FC = () => {
  return (
    <AnimatedWrapper
      animation="slideUp"
      delay={0.2}
      hoverEffect={true}
      className="p-4 bg-white rounded-lg shadow"
    >
      <h2 className="text-lg font-semibold">Example Component 1</h2>
      <p>
        This component uses the main AnimatedWrapper with slideUp animation and
        hover effect.
      </p>
    </AnimatedWrapper>
  );
};

// Example 2: Using convenience components
export const ExampleComponent2: React.FC = () => {
  return (
    <div className="space-y-4">
      <FadeIn delay={0.1} className="text-center">
        <h2 className="text-2xl font-bold">Welcome to Fastra</h2>
      </FadeIn>

      <SlideUp delay={0.3} className="max-w-md mx-auto">
        <p className="text-gray-600">
          This is a slide-up animated component with delay.
        </p>
      </SlideUp>

      <ScaleIn delay={0.5} hoverEffect={true} className="flex justify-center">
        <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Animated Button
        </button>
      </ScaleIn>
    </div>
  );
};

// Example 3: Stagger animations for lists
export const ProductList: React.FC<{ products: string[] }> = ({ products }) => {
  return (
    <StaggerContainer className="space-y-2" staggerDelay={0.15}>
      {products.map((product, index) => (
        <FadeIn key={index} className="p-3 border rounded">
          {product}
        </FadeIn>
      ))}
    </StaggerContainer>
  );
};

// Example 4: Interactive hover effects
export const InteractiveCard: React.FC = () => {
  return (
    <Interactive
      effect="lift"
      onClick={() => console.log("Card clicked!")}
      className="p-6 bg-white rounded-lg shadow cursor-pointer"
    >
      <h3 className="text-lg font-medium mb-2">Interactive Card</h3>
      <p className="text-gray-600">Click me to see the animation!</p>
    </Interactive>
  );
};

// Example 5: Complete page with animations
export const ExamplePage: React.FC = () => {
  return (
    <PageWrapper className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <FadeIn delay={0.1} className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Animated Page</h1>
          <p className="text-gray-600 mt-2">
            All components have smooth animations
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SlideUp delay={0.2}>
            <Interactive effect="glow" className="p-6 bg-white rounded-lg">
              <h3 className="font-medium">Feature 1</h3>
              <p className="text-sm text-gray-600">Smooth animations</p>
            </Interactive>
          </SlideUp>

          <SlideUp delay={0.4}>
            <Interactive effect="subtle" className="p-6 bg-white rounded-lg">
              <h3 className="font-medium">Feature 2</h3>
              <p className="text-sm text-gray-600">Hover effects</p>
            </Interactive>
          </SlideUp>
        </div>

        <SlideUp delay={0.6}>
          <ProductList products={["Product A", "Product B", "Product C"]} />
        </SlideUp>
      </div>
    </PageWrapper>
  );
};

// Example 6: How to wrap existing components
const ExistingComponent: React.FC = () => (
  <div className="bg-blue-100 p-4 rounded">
    <h3>Existing Component</h3>
  </div>
);

export const WrappedExistingComponent: React.FC = () => {
  // You can wrap existing components like this:
  return (
    <FadeIn delay={0.3} className="mb-4">
      <ExistingComponent />
    </FadeIn>
  );
};

// Example 7: Custom animated wrapper
interface CustomAnimatedProps {
  title: string;
  children: React.ReactNode;
  animation?: keyof typeof import("./AnimatedWrapper").animations;
  delay?: number;
}

export const CustomAnimatedWrapper: React.FC<CustomAnimatedProps> = ({
  title,
  animation = "fadeIn",
  delay = 0,
  children,
}) => {
  return (
    <AnimatedWrapper animation={animation} delay={delay} className="mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        {children}
      </div>
    </AnimatedWrapper>
  );
};

// Usage examples
export const UsageExamples: React.FC = () => {
  return (
    <div className="space-y-6 p-8">
      <CustomAnimatedWrapper title="Slide Up Animation" animation="slideUp">
        <p>This wrapper has custom title and styling.</p>
      </CustomAnimatedWrapper>

      <CustomAnimatedWrapper
        title="Scale Animation"
        animation="scaleIn"
        delay={0.5}
      >
        <p>Different animation type with delay.</p>
      </CustomAnimatedWrapper>
    </div>
  );
};

export default ExamplePage;
