import { motion, useAnimation } from "framer-motion";

export const PlayAnimation = (props) => {
  const controls = useAnimation();

  const startAnimation = async () => {
    // You can define a sequence of animations here
    await controls.start({ x: props.x, y:props.y, opacity: 1 });
  };

  return (
    <div>
      <button onClick={startAnimation}>Replay Animation</button>
      <motion.img
        src="/Card/Water_Flow.png"
        animate={controls}
        initial={{ x: 0, y:0, opacity: 0.5 }}
        style={{ width: 50, height: 50, background: 'blue' }}
      />
    </div>
  );
};
